// Global Application State & Helper Utilities
const API_BASE = '/api';

const App = {
    token: localStorage.getItem('auth_token') || localStorage.getItem('vr_token') || null,
    user: JSON.parse(localStorage.getItem('vr_user') || 'null'),

    async init() {
        this.bindNavigation();
        await this.checkAuth();
        if (this.token) this.switchView('dashboard');
    },

    bindNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                this.switchView(view);
            });
        });

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    },

    async checkAuth() {
        if (!this.token) {
            this.updateUserUI();
            this.openModal("login-modal");
        } else {
            this.updateUserUI();
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Login failed');
            }

            const data = await res.json();
            if (data.mfaRequired || !data.token) {
                throw new Error("This account requires email verification. Please complete verification before signing in here.");
            }
            this.token = data.token;
            this.user = {
                id: data.userId,
                fullName: data.fullName,
                email: data.email,
                role: data.role,
                permissions: data.permissions
            };

            localStorage.setItem('vr_token', this.token);
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('vr_user', JSON.stringify(this.user));

            this.updateUserUI();
            this.closeModal('login-modal');
            this.showToast('Login successful!', 'success');
            this.switchView('dashboard');
        } catch (err) {
            this.showToast(err.message, 'danger');
        }
    },

    handleLogout() {
        if (typeof ImageUploads !== 'undefined') ImageUploads.clearAll();
        this.token = null;
        this.user = null;
        localStorage.removeItem('vr_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('vr_user');
        this.updateUserUI();
        this.showToast('Logged out successfully', 'info');
        this.openModal('login-modal');
    },

    updateUserUI() {
        const userDisplay = document.getElementById('user-display-name');
        const roleDisplay = document.getElementById('user-display-role');
        if (this.user) {
            if (userDisplay) userDisplay.textContent = this.user.fullName;
            if (roleDisplay) roleDisplay.textContent = this.user.role;
        } else {
            if (userDisplay) userDisplay.textContent = 'Guest User';
            if (roleDisplay) roleDisplay.textContent = 'Unauthenticated';
        }
    },

    switchView(viewName) {
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.add('hidden');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-blue-800', 'text-white');
            link.classList.add('text-slate-300', 'hover:bg-slate-800');
            if (link.getAttribute('data-view') === viewName) {
                link.classList.add('bg-blue-800', 'text-white');
                link.classList.remove('text-slate-300', 'hover:bg-slate-800');
            }
        });

        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('animate-fade-in');

            if (viewName === 'dashboard') {
                Fleet.loadDashboard();
            } else if (viewName === 'vehicles') {
                Fleet.loadVehicles();
            } else if (viewName === 'inspections') {
                Inspection.loadInspections();
            }
        }
    },

    async apiFetch(endpoint, options = {}) {
        const headers = {
            ...(options.body instanceof FormData ? {} : {'Content-Type': 'application/json'}),
            ...(options.headers || {})
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (!res.ok) {
            let errorMsg = `Request failed (${res.status})`;
            try {
                const errData = await res.json();
                errorMsg = errData.message || errorMsg;
            } catch (e) {}
            throw new Error(errorMsg);
        }

        if (res.status === 204) return null;
        return await res.json();
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const colors = {
            success: 'bg-green-600 text-white',
            danger: 'bg-red-600 text-white',
            warning: 'bg-amber-600 text-white',
            info: 'bg-blue-600 text-white'
        };

        const toast = document.createElement('div');
        toast.className = `p-4 rounded-lg shadow-lg flex items-center justify-between space-x-3 text-sm font-medium transition-all transform duration-300 ${colors[type] || colors.info}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="text-white hover:opacity-75 focus:outline-none" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
