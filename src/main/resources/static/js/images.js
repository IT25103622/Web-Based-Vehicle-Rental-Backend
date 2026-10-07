// Shared vehicle photo and inspection evidence uploads.
const ImageUploads = {
    states: {}, galleries: {},
    reset(key, existing = [], ownerId = null) {
        this.clearUrls(this.states[key]?.urls || []);
        this.states[key] = {files: [], existing, ownerId, urls: []};
        const input = document.getElementById(`${key}-images-input`);
        if (input) input.value = '';
        this.renderSelection(key);
    },
    clearUrls(urls) { urls.forEach(url => URL.revokeObjectURL(url)); },
    select(key, files) {
        const state = this.states[key] || (this.states[key] = {files: [], existing: [], urls: []});
        const selected = Array.from(files);
        try {
            if (state.files.length + state.existing.length + selected.length > 10) throw new Error('Maximum 10 images per vehicle or report.');
            selected.forEach(file => {
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose JPG, PNG or WebP images.');
                if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('Each image must be non-empty and 5 MB or smaller.');
            });
            state.files.push(...selected);
            this.renderSelection(key);
        } catch (err) { App.showToast(err.message, 'danger'); }
        const input = document.getElementById(`${key}-images-input`);
        if (input) input.value = '';
    },
    removePending(key, index) { this.states[key].files.splice(index, 1); this.renderSelection(key); },
    renderSelection(key) {
        const target = document.getElementById(`${key}-images-preview`);
        if (!target) return;
        target.replaceChildren();
        const state = this.states[key];
        if (!state) return;
        this.clearUrls(state.urls); state.urls = [];
        state.files.forEach((file, index) => {
            const url = URL.createObjectURL(file); state.urls.push(url);
            const card = this.card(url, file.name);
            const remove = document.createElement('button');
            remove.type = 'button'; remove.textContent = 'Remove'; remove.className = 'text-red-600 text-xs p-1';
            remove.onclick = () => this.removePending(key, index);
            card.append(remove); target.append(card);
        });
    },
    card(url, name) {
        const card = document.createElement('div'); card.className = 'border rounded-lg p-2 w-40 bg-white';
        const image = document.createElement('img'); image.src = url; image.alt = name;
        image.className = 'w-full h-28 object-cover rounded';
        image.onclick = () => {
            const viewer = document.getElementById('image-viewer-photo'); viewer.src = url; viewer.alt = name;
            App.openModal('image-viewer-modal');
        };
        image.style.cursor = 'zoom-in';
        const label = document.createElement('p'); label.textContent = name; label.className = 'text-xs truncate mt-1';
        card.append(image, label); return card;
    },
    form(key, metadata = null, part = null) {
        const body = new FormData();
        if (metadata && part) body.append(part, new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        (this.states[key]?.files || []).forEach(file => body.append('images', file));
        return body;
    },
    hasFiles(key) { return !!this.states[key]?.files.length; },
    async gallery(targetId, images, ownerType = null, ownerId = null, onRemove = null) {
        const target = document.getElementById(targetId);
        if (!target) return;
        this.clearUrls(this.galleries[targetId]?.urls || []);
        const generation = {urls: []}; this.galleries[targetId] = generation;
        target.replaceChildren();
        if (!images?.length) { target.textContent = 'No uploaded images.'; return; }
        for (const image of images) {
            try {
                const response = await fetch(image.url, {headers: App.token ? {Authorization: `Bearer ${App.token}`} : {}});
                if (!response.ok) throw new Error(`Image unavailable (${response.status})`);
                const blob = await response.blob();
                if (this.galleries[targetId] !== generation) return;
                const url = URL.createObjectURL(blob); generation.urls.push(url);
                const card = this.card(url, image.originalName);
                if (ownerType && ownerId) {
                    const remove = document.createElement('button'); remove.type = 'button';
                    remove.textContent = 'Delete image'; remove.className = 'text-red-600 text-xs p-1';
                    remove.onclick = async () => {
                        if (!confirm('Delete this uploaded image?')) return;
                        try {
                            const route = ownerType === 'vehicle' ? `/fleet/vehicles/${ownerId}/images/${image.id}` : `/inspections/${ownerId}/images/${image.id}`;
                            await App.apiFetch(route, {method: 'DELETE'});
                            if (onRemove) await onRemove(image.id);
                        } catch (err) { App.showToast(err.message, 'danger'); }
                    };
                    card.append(remove);
                }
                target.append(card);
            } catch (err) {
                if (this.galleries[targetId] !== generation) return;
                const message = document.createElement('p'); message.className = 'text-sm text-red-600';
                message.textContent = `${image.originalName}: ${err.message}`; target.append(message);
            }
        }
    },
    clearAll() {
        Object.values(this.states).forEach(state => this.clearUrls(state.urls));
        Object.values(this.galleries).forEach(gallery => this.clearUrls(gallery.urls));
        Object.keys(this.galleries).forEach(id => document.getElementById(id)?.replaceChildren());
        this.states = {}; this.galleries = {};
        const viewer = document.getElementById('image-viewer-photo'); if (viewer) viewer.removeAttribute('src');
        App.closeModal('image-viewer-modal');
    }
};
