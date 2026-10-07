// UC-03: Manage Fleet and Vehicle Records
const Fleet = {
    currentEditId: null,

    async loadDashboard() {
        try {
            const data = await App.apiFetch('/fleet/vehicles/dashboard');
            document.getElementById('stat-total').textContent = data.totalVehicles;
            document.getElementById('stat-available').textContent = data.availableVehicles;
            document.getElementById('stat-reserved').textContent = data.reservedVehicles;
            document.getElementById('stat-rented').textContent = data.rentedVehicles;
            document.getElementById('stat-maintenance').textContent = data.maintenanceVehicles;
            document.getElementById('stat-out-of-service').textContent = data.outOfServiceVehicles;
            document.getElementById('stat-alerts').textContent = data.documentsRequiringAttentionCount;

            this.renderRenewalAlerts(data.alerts);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
            App.showToast(err.message, 'danger');
        }
    },

    renderRenewalAlerts(alerts) {
        const container = document.getElementById('dashboard-alerts-body');
        if (!container) return;

        if (!alerts || alerts.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-sm text-slate-500">
                        <i class="fa-solid fa-circle-check text-green-500 text-2xl mb-2 block"></i>
                        All vehicle insurance and license renewals are up to date!
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = alerts.map(a => {
            const isExpired = a.alertSeverity === 'EXPIRED';
            const badgeClass = isExpired ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800';
            const statusLabel = a.alertSeverity === "MISSING" ? "DOCUMENT MISSING" : (isExpired ? "EXPIRED" : `${a.daysRemaining} days left`);

            return `
                <tr class="hover:bg-slate-50 border-b">
                    <td class="px-6 py-4 font-semibold text-slate-900">${a.registrationNumber}</td>
                    <td class="px-6 py-4 text-slate-600">${a.brand} ${a.model}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700">
                            ${a.documentType}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-slate-600 font-mono text-sm">${a.documentNumber || "Not recorded"}</td>
                    <td class="px-6 py-4 text-slate-600">${a.expiryDate || "Not recorded"}</td>
                    <td class="px-6 py-4">
                        <span class="px-2.5 py-1 text-xs font-bold rounded-full ${badgeClass}">
                            ${statusLabel}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async loadVehicles() {
        const query = document.getElementById('filter-search')?.value || '';
        const status = document.getElementById('filter-status')?.value || '';
        const vehicleType = document.getElementById('filter-type')?.value || '';
        const active = document.getElementById('filter-active')?.value || '';

        let url = `/fleet/vehicles?page=0&size=50`;
        if (query) url += `&query=${encodeURIComponent(query)}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;
        if (vehicleType) url += `&vehicleType=${encodeURIComponent(vehicleType)}`;
        if (active) url += `&active=${encodeURIComponent(active)}`;

        try {
            const data = await App.apiFetch(url);
            this.renderVehicleTable(data.content || []);
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    renderVehicleTable(vehicles) {
        const tbody = document.getElementById('vehicles-table-body');
        if (!tbody) return;

        if (vehicles.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-slate-500">
                    No vehicles found matching the search criteria.
                </td>
            </tr>
        `;
            return;
        }

        tbody.innerHTML = vehicles.map(v => {
            const statusClass = `status-${v.operationalStatus}`;
            const activeBadge = v.active
                ? `<span class="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Active</span>`
                : `<span class="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">Deactivated</span>`;

            return `
            <tr class="hover:bg-slate-50 border-b">
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-900">${v.registrationNumber}</div>
                    <div class="text-xs text-slate-500">${v.vehicleType}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="font-medium text-slate-800">${v.brand} ${v.model}</div>
                    <div class="text-xs text-slate-500">${v.seatingCapacity} Seats • Cond: ${v.condition}</div>
                </td>
                <td class="px-6 py-4 text-slate-900 font-semibold">
                    LKR ${v.rentalRate?.toLocaleString()} / day
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-slate-700">${v.mileage?.toLocaleString()} km</div>
                    <div class="w-24 mt-1">
                        <div class="fuel-gauge-container">
                            <div class="fuel-gauge-bar ${v.fuelLevel > 30 ? 'bg-blue-600' : 'bg-red-500'}" style="width: ${v.fuelLevel}%;"></div>
                        </div>
                        <span class="text-xs text-slate-500">${v.fuelLevel}% Fuel</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="status-badge ${statusClass}">${v.operationalStatus.replace('_', ' ')}</span>
                </td>
                <td class="px-6 py-4">
                    ${activeBadge}
                </td>
                <td class="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                    <button onclick="Fleet.viewVehicleDetails(${v.id})" class="text-slate-600 hover:text-blue-600 p-1.5" title="View Details">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button onclick="Fleet.openBookingHistory(${v.id})" class="text-blue-600 hover:text-blue-800 p-1.5 font-medium text-xs bg-blue-50 rounded" title="View Past Bookings">
                        Booking History
                    </button>
                    <button onclick="Fleet.openEditVehicleModal(${v.id})" class="text-slate-600 hover:text-amber-600 p-1.5" title="Edit Vehicle">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="Fleet.openStatusModal(${v.id}, '${v.registrationNumber}', '${v.operationalStatus}')" class="text-slate-600 hover:text-purple-600 p-1.5" title="Change Operational Status">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                    ${v.active
                ? `<button onclick="Fleet.deactivateVehicle(${v.id}, '${v.registrationNumber}')" class="text-slate-600 hover:text-red-600 p-1.5" title="Deactivate Vehicle">
                               <i class="fa-solid fa-ban"></i>
                           </button>`
                : `<button onclick="Fleet.reactivateVehicle(${v.id}, '${v.registrationNumber}')" class="text-slate-600 hover:text-green-600 p-1.5" title="Reactivate Vehicle">
                               <i class="fa-solid fa-check"></i>
                           </button>`
            }
                    
                    <!-- NEW DELETE BUTTON -->
                    <button onclick="Fleet.deleteVehiclePermanently(${v.id}, '${v.registrationNumber}')" class="text-slate-600 hover:text-red-700 p-1.5" title="Delete Permanently">
                        <i class="fa-solid fa-trash"></i>
                    </button>

                    <button onclick="Inspection.openPreRentalModal(${v.id})" class="text-blue-600 hover:text-blue-800 p-1.5 font-medium text-xs bg-blue-50 rounded" title="Inspect">
                        Inspect
                    </button>
                </td>
            </tr>
        `;
        }).join('');
    },

    async openBookingHistory(id) {
        const summary = document.getElementById('booking-history-vehicle');
        const body = document.getElementById('booking-history-body');
        summary.textContent = 'Loading vehicle booking history…';
        document.getElementById('booking-history-cutoff').textContent = '';
        body.replaceChildren();
        App.openModal('booking-history-modal');
        try {
            const data = await App.apiFetch(`/fleet/vehicles/${id}/booking-history`);
            const v = data.vehicle;
            summary.textContent = `${v.registrationNumber} • ${v.brand} ${v.model} • ${v.vehicleType} • ${v.operationalStatus.replaceAll('_', ' ')} • ${v.active ? 'Active' : 'Deactivated'}`;
            document.getElementById('booking-history-cutoff').textContent =
                `Bookings with a scheduled return date before ${data.asOfDate}, including cancellations. Newest return dates first.`;
            if (!data.bookings.length) {
                const row = body.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 8;
                cell.className = 'px-6 py-8 text-center text-slate-500';
                cell.textContent = 'No past bookings found.';
                return;
            }
            data.bookings.forEach(b => {
                const row = body.insertRow();
                row.className = 'border-b hover:bg-slate-50';
                [b.bookingId, b.customerName, b.startDate, b.endDate,
                    b.bookingStatus, `LKR ${Number(b.totalAmount).toLocaleString('en-LK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                    b.pickupLocation, b.dropoffLocation].forEach(value => {
                    const cell = row.insertCell();
                    cell.className = 'px-4 py-3 text-sm';
                    cell.textContent = value ?? '—';
                });
            });
        } catch (err) {
            summary.textContent = 'Unable to load booking history. Close this window and try again.';
            App.showToast(err.message, 'danger');
        }
    },

    openAddVehicleModal() {
        this.currentEditId = null;
        ImageUploads.reset('vehicle');
        document.getElementById('vehicle-existing-images').replaceChildren();
        document.getElementById('vehicle-modal-title').textContent = 'Add New Vehicle';
        document.getElementById('vehicle-form').reset();
        document.getElementById('vehicle-operational-status-group').classList.add('hidden');
        App.openModal('vehicle-form-modal');
    },

    async openEditVehicleModal(id) {
        try {
            this.currentEditId = id;
            document.getElementById('vehicle-modal-title').textContent = 'Edit Vehicle Information';
            const v = await App.apiFetch(`/fleet/vehicles/${id}`);
            ImageUploads.reset('vehicle', v.images || [], id);
            this.refreshEditImages(id);

            document.getElementById('v-reg-number').value = v.registrationNumber;
            document.getElementById('v-type').value = v.vehicleType;
            document.getElementById('v-brand').value = v.brand;
            document.getElementById('v-model').value = v.model;
            document.getElementById('v-seating').value = v.seatingCapacity;
            document.getElementById('v-rate').value = v.rentalRate;
            document.getElementById('v-mileage').value = v.mileage;
            document.getElementById('v-fuel').value = v.fuelLevel;
            document.getElementById('v-condition').value = v.condition;
            document.getElementById('v-ins-policy').value = v.insurancePolicyNumber;
            document.getElementById('v-ins-expiry').value = v.insuranceExpiryDate;
            document.getElementById('v-lic-number').value = v.licenseNumber;
            document.getElementById('v-lic-expiry').value = v.licenseExpiryDate;

            const statusGroup = document.getElementById('vehicle-operational-status-group');
            statusGroup.classList.remove('hidden');
            document.getElementById('v-status').value = v.operationalStatus;

            App.openModal('vehicle-form-modal');
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    async refreshEditImages(id) {
        const updated = await App.apiFetch(`/fleet/vehicles/${id}`);
        if (this.currentEditId !== id) return;
        ImageUploads.states.vehicle.existing = updated.images || [];
        ImageUploads.gallery('vehicle-existing-images', updated.images, 'vehicle', id, () => this.refreshEditImages(id));
    },

    async saveVehicle(e) {
        e.preventDefault();

        const payload = {
            registrationNumber: document.getElementById('v-reg-number').value,
            vehicleType: document.getElementById('v-type').value,
            brand: document.getElementById('v-brand').value,
            model: document.getElementById('v-model').value,
            seatingCapacity: parseInt(document.getElementById('v-seating').value, 10),
            rentalRate: parseFloat(document.getElementById('v-rate').value),
            mileage: parseFloat(document.getElementById('v-mileage').value),
            fuelLevel: parseInt(document.getElementById('v-fuel').value, 10),
            condition: document.getElementById('v-condition').value,
            insurancePolicyNumber: document.getElementById('v-ins-policy').value,
            insuranceExpiryDate: document.getElementById('v-ins-expiry').value,
            licenseNumber: document.getElementById('v-lic-number').value,
            licenseExpiryDate: document.getElementById('v-lic-expiry').value,
            operationalStatus: document.getElementById('v-status')?.value || 'AVAILABLE'
        };

        try {
            if (this.currentEditId) {
                await App.apiFetch(`/fleet/vehicles/${this.currentEditId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                if (ImageUploads.hasFiles('vehicle')) {
                    try {
                        await App.apiFetch(`/fleet/vehicles/${this.currentEditId}/images`, {method: 'POST', body: ImageUploads.form('vehicle')});
                    } catch (err) {
                        App.showToast(`Vehicle details saved, but images were not uploaded: ${err.message}`, 'danger');
                        return;
                    }
                }
                App.showToast('Vehicle updated successfully!', 'success');
            } else {
                await App.apiFetch('/fleet/vehicles', {
                    method: 'POST',
                    body: ImageUploads.form('vehicle', payload, 'vehicle')
                });
                App.showToast('Vehicle added successfully!', 'success');
            }

            ImageUploads.reset('vehicle');
            App.closeModal('vehicle-form-modal');
            this.loadVehicles();
            this.loadDashboard();
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    async deactivateVehicle(id, reg) {
        if (!confirm(`Are you sure you want to deactivate vehicle [${reg}]?\n\nNote: Permanent deletion is disabled to preserve rental history. The vehicle will no longer be selectable for new bookings.`)) {
            return;
        }

        try {
            await App.apiFetch(`/fleet/vehicles/${id}/deactivate`, { method: 'PATCH' });
            App.showToast(`Vehicle ${reg} deactivated successfully.`, 'warning');
            this.loadVehicles();
            this.loadDashboard();
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    async reactivateVehicle(id, reg) {
        try {
            await App.apiFetch(`/fleet/vehicles/${id}/reactivate`, { method: 'PATCH' });
            App.showToast(`Vehicle ${reg} reactivated successfully.`, 'success');
            this.loadVehicles();
            this.loadDashboard();
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    async deleteVehiclePermanently(id, reg) {
        if (!confirm(`Are you sure you want to PERMANENTLY delete vehicle [${reg}]?\n\nWARNING: This action cannot be undone.`)) {
            return;
        }

        try {
            await App.apiFetch(`/fleet/vehicles/${id}/permanent`, { method: 'DELETE' });
            App.showToast(`Vehicle ${reg} permanently deleted successfully.`, 'warning');
            this.loadVehicles();
            this.loadDashboard();
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    openStatusModal(id, reg, currentStatus) {
        document.getElementById('status-vehicle-id').value = id;
        document.getElementById('status-vehicle-reg').textContent = reg;
        document.getElementById('status-new-select').value = currentStatus;
        document.getElementById('status-reason').value = '';
        App.openModal('status-change-modal');
    },

    async submitStatusChange(e) {
        e.preventDefault();
        const id = document.getElementById('status-vehicle-id').value;
        const status = document.getElementById('status-new-select').value;
        const reason = document.getElementById('status-reason').value;

        try {
            await App.apiFetch(`/fleet/vehicles/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status, reason })
            });
            App.showToast('Operational status updated successfully!', 'success');
            App.closeModal('status-change-modal');
            this.loadVehicles();
            this.loadDashboard();
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    async viewVehicleDetails(id) {
        try {
            const v = await App.apiFetch(`/fleet/vehicles/${id}`);
            ImageUploads.gallery('detail-vehicle-images', v.images);
            document.getElementById('detail-reg').textContent = v.registrationNumber;
            document.getElementById('detail-brand-model').textContent = `${v.brand} ${v.model} (${v.vehicleType})`;
            document.getElementById('detail-status').className = `status-badge status-${v.operationalStatus}`;
            document.getElementById('detail-status').textContent = v.operationalStatus.replace('_', ' ');
            document.getElementById('detail-rate').textContent = `LKR ${v.rentalRate?.toLocaleString()} / day`;
            document.getElementById('detail-seating').textContent = `${v.seatingCapacity} Passengers`;
            document.getElementById('detail-mileage').textContent = `${v.mileage?.toLocaleString()} km`;
            document.getElementById('detail-fuel').textContent = `${v.fuelLevel}%`;
            document.getElementById('detail-condition').textContent = v.condition;

            document.getElementById('detail-ins-policy').textContent = v.insurancePolicyNumber;
            document.getElementById('detail-ins-expiry').textContent = v.insuranceExpiryDate;
            document.getElementById('detail-ins-status').textContent = v.insuranceStatus;
            document.getElementById('detail-ins-status').className = `px-2 py-0.5 text-xs font-bold rounded alert-pill-${v.insuranceStatus}`;

            document.getElementById('detail-lic-number').textContent = v.licenseNumber;
            document.getElementById('detail-lic-expiry').textContent = v.licenseExpiryDate;
            document.getElementById('detail-lic-status').textContent = v.licenseStatus;
            document.getElementById('detail-lic-status').className = `px-2 py-0.5 text-xs font-bold rounded alert-pill-${v.licenseStatus}`;

            // Load inspections for this vehicle
            Inspection.loadVehicleInspections(id);

            App.switchView('vehicle-details');
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    }
};
