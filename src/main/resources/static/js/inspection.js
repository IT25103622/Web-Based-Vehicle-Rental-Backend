// UC-04: Vehicle Return & Inspection
const Inspection = {
    currentReportId: null,
    currentVehicleId: null,
    async loadInspections() {
        try {
            const data = await App.apiFetch('/inspections?page=0&size=50');
            this.renderInspectionsTable(data.content || []);
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    renderInspectionsTable(inspections) {
        const tbody = document.getElementById('inspections-table-body');
        if (!tbody) return;

        if (inspections.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-slate-500">
                        No inspection records found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = inspections.map(i => {
            const typeBadge = i.inspectionType === 'PRE_RENTAL'
                ? `<span class="px-2.5 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">Pre-Rental Handover</span>`
                : `<span class="px-2.5 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">Post-Rental Return</span>`;

            const statusClass = `status-${i.resultingVehicleStatus}`;
            const damageBadge = i.damageReport
                ? `<span class="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-700">Damage (${i.damageReport.damageSeverity})</span>`
                : `<span class="text-xs text-green-700 font-medium">Clean</span>`;

            return `
                <tr class="hover:bg-slate-50 border-b">
                    <td class="px-6 py-4 font-bold text-slate-900">#${i.id}</td>
                    <td class="px-6 py-4">
                        <div class="font-semibold text-slate-800">${i.vehicleRegistrationNumber}</div>
                        <div class="text-xs text-slate-500">${i.vehicleBrand} ${i.vehicleModel}</div>
                    </td>
                    <td class="px-6 py-4">${typeBadge}</td>
                    <td class="px-6 py-4 text-sm text-slate-600">
                        <div>${i.odometerReading?.toLocaleString()} km</div>
                        <div class="text-xs text-slate-500">${i.fuelLevel}% Fuel • ${i.condition}</div>
                    </td>
                    <td class="px-6 py-4">${damageBadge}<div class="text-xs mt-1">Repair: ${(i.repairStatus || "NOT_REQUIRED").replaceAll("_", " ")}</div></td>
                    <td class="px-6 py-4">
                        <span class="status-badge ${statusClass}">${i.resultingVehicleStatus.replace('_', ' ')}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="Inspection.viewInspectionReport(${i.id})" class="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-blue-600 hover:text-white rounded transition">
                            View Report
                        </button>
                        <button onclick="Inspection.openEditResult(${i.id})" class="px-2 py-1.5 text-xs text-blue-600">Edit Result</button>
                        <button onclick="Inspection.deleteReport(${i.id})" class="px-2 py-1.5 text-xs text-red-600">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async loadVehicleInspections(vehicleId) {
        const container = document.getElementById('vehicle-inspections-list');
        if (!container) return;

        try {
            const inspections = await App.apiFetch(`/fleet/vehicles/${vehicleId}/inspections`);
            if (inspections.length === 0) {
                container.innerHTML = `<div class="p-6 text-center text-slate-500 text-sm">No prior inspections recorded for this vehicle.</div>`;
                return;
            }

            container.innerHTML = inspections.map(i => `
                <div class="p-4 border-b last:border-0 flex items-center justify-between hover:bg-slate-50">
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="font-semibold text-sm text-slate-800">Inspection #${i.id}</span>
                            <span class="text-xs px-2 py-0.5 rounded ${i.inspectionType === 'PRE_RENTAL' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
                                ${i.inspectionType.replace('_', ' ')}
                            </span>
                            <span class="status-badge status-${i.resultingVehicleStatus}">${i.resultingVehicleStatus}</span>
                        </div>
                        <div class="text-xs text-slate-500 mt-1">
                            Date: ${new Date(i.inspectionDate).toLocaleString()} • Odometer: ${i.odometerReading} km • Fuel: ${i.fuelLevel}% • Condition: ${i.condition}
                        </div>
                        ${i.damageReport ? `<div class="text-xs text-red-600 mt-1 font-medium"><i class="fa-solid fa-triangle-exclamation"></i> Damage Reported: ${i.damageReport.damageDescription} (Est. LKR ${i.damageReport.estimatedRepairCost})</div>` : ''}
                    </div>
                    <button onclick="Inspection.viewInspectionReport(${i.id})" class="text-xs text-blue-600 hover:underline">
                        Details <i class="fa-solid fa-arrow-right ml-1"></i>
                    </button>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = `<div class="p-4 text-red-500 text-sm">Error loading inspections: ${err.message}</div>`;
        }
    },

    async openPreRentalModal(vehicleId) {
        try {
            const v = await App.apiFetch(`/fleet/vehicles/${vehicleId}`);
            document.getElementById('inspection-form').reset();
            ImageUploads.reset('inspection');
            document.getElementById('insp-vehicle-id').value = v.id;
            document.getElementById('insp-vehicle-reg').textContent = `${v.registrationNumber} (${v.brand} ${v.model})`;
            document.getElementById('insp-current-odo-label').textContent = `${v.mileage} km`;
            document.getElementById('insp-current-fuel-label').textContent = `${v.fuelLevel}%`;

            document.getElementById('insp-type').value = v.operationalStatus === 'RENTED' ? 'POST_RENTAL' : 'PRE_RENTAL';
            document.getElementById('insp-type-title').textContent = v.operationalStatus === 'RENTED' ? 'Post-Rental Return Inspection' : 'Pre-Rental Handover Inspection';

            document.getElementById('insp-odometer').value = v.mileage;
            document.getElementById('insp-fuel').value = v.fuelLevel;
            document.getElementById('insp-condition').value = v.condition;
            document.getElementById('insp-booking-ref').value = '';
            document.getElementById('insp-notes').value = '';

            document.getElementById('insp-has-damage').checked = false;
            this.toggleDamageSection(false);

            App.openModal('inspection-modal');
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    toggleDamageSection(show) {
        const group = document.getElementById('damage-report-fields');
        if (show) {
            group.classList.remove('hidden');
        } else {
            group.classList.add('hidden');
        }
    },

    async submitInspection(e) {
        e.preventDefault();

        const hasDamage = document.getElementById('insp-has-damage').checked;
        let damageReport = null;

        if (hasDamage) {
            damageReport = {
                damageSeverity: document.getElementById('insp-damage-severity').value,
                damageDescription: document.getElementById('insp-damage-desc').value,
                damagedParts: document.getElementById('insp-damage-parts').value,
                photoUrl: null,
                estimatedRepairCost: parseFloat(document.getElementById('insp-repair-cost').value || '0'),
                requiresImmediateRepair: document.getElementById('insp-req-repair').checked
            };
        }

        const payload = {
            vehicleId: parseInt(document.getElementById('insp-vehicle-id').value, 10),
            bookingReference: document.getElementById('insp-booking-ref').value,
            inspectionType: document.getElementById('insp-type').value,
            odometerReading: parseFloat(document.getElementById('insp-odometer').value),
            fuelLevel: parseInt(document.getElementById('insp-fuel').value, 10),
            condition: document.getElementById('insp-condition').value,
            spareTirePresent: document.getElementById('insp-chk-tire').checked,
            jackAndToolsPresent: document.getElementById('insp-chk-tools').checked,
            registrationDocPresent: document.getElementById('insp-chk-docs').checked,
            firstAidKitPresent: document.getElementById('insp-chk-kit').checked,
            cleanliness: document.getElementById('insp-cleanliness').value,
            notes: document.getElementById('insp-notes').value,
            repairRequired: document.getElementById('insp-repair-required').checked,
            hasDamage: hasDamage,
            damageReport: damageReport
        };

        try {
            const res = await App.apiFetch('/inspections', {
                method: 'POST',
                body: ImageUploads.form('inspection', payload, 'inspection')
            });

            ImageUploads.reset('inspection');
            App.showToast(`Inspection #${res.id} recorded! Vehicle status is now: ${res.resultingVehicleStatus}`, 'success');
            App.closeModal('inspection-modal');

            Fleet.loadVehicles();
            Fleet.loadDashboard();
            this.loadInspections();
            this.viewInspectionReport(res.id);
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    async openEditResult(id) {
        try {
            const i = await App.apiFetch(`/inspections/${id}`);
            this.currentVehicleId = i.vehicleId;
            document.getElementById('edit-result-id').value = id;
            document.getElementById('edit-repair-status').value = i.repairStatus || 'NOT_REQUIRED';
            document.getElementById('edit-result-condition').value = i.condition;
            document.getElementById('edit-result-notes').value = i.notes || '';
            App.closeModal('inspection-report-modal');
            App.openModal('inspection-edit-result-modal');
        } catch (err) { App.showToast(err.message, 'danger'); }
    },

    async saveResult(e) {
        e.preventDefault();
        const id = document.getElementById('edit-result-id').value;
        const payload = {
            repairStatus: document.getElementById('edit-repair-status').value,
            condition: document.getElementById('edit-result-condition').value,
            notes: document.getElementById('edit-result-notes').value
        };
        try {
            const result = await App.apiFetch(`/inspections/${id}/result`, {method: 'PATCH', body: JSON.stringify(payload)});
            App.closeModal('inspection-edit-result-modal');
            App.showToast(`Result saved. Vehicle status: ${result.resultingVehicleStatus}`, 'success');
            this.refreshAfterReportChange(result.vehicleId);
            this.viewInspectionReport(result.id);
        } catch (err) { App.showToast(err.message, 'danger'); }
    },

    async deleteReport(id) {
        if (!confirm(`Delete inspection report #${id} and its damage report? This cannot be undone. Vehicle status will remain unchanged. Unresolved repairs must be marked Fixed first.`)) return;
        try {
            const report = await App.apiFetch(`/inspections/${id}`);
            await App.apiFetch(`/inspections/${id}`, {method: 'DELETE'});
            App.closeModal('inspection-report-modal');
            App.showToast('Inspection report deleted.', 'success');
            this.refreshAfterReportChange(report.vehicleId);
        } catch (err) { App.showToast(err.message, 'danger'); }
    },

    refreshAfterReportChange(vehicleId) {
        this.loadInspections();
        Fleet.loadVehicles();
        Fleet.loadDashboard();
        this.loadVehicleInspections(vehicleId);
    },

    async uploadReportImages() {
        if (!ImageUploads.hasFiles('report')) { App.showToast('Select images first.', 'warning'); return; }
        try {
            await App.apiFetch(`/inspections/${this.currentReportId}/images`, {method: 'POST', body: ImageUploads.form('report')});
            ImageUploads.reset('report');
            this.viewInspectionReport(this.currentReportId);
            App.showToast('Evidence images uploaded.', 'success');
        } catch (err) { App.showToast(err.message, 'danger'); }
    },

    async viewInspectionReport(id) {
        try {
            const i = await App.apiFetch(`/inspections/${id}`);
            this.currentReportId = i.id;
            this.currentVehicleId = i.vehicleId;
            ImageUploads.reset('report', i.images || [], id);
            ImageUploads.gallery('report-inspection-images', i.images, 'inspection', id, () => this.viewInspectionReport(id));
            document.getElementById('report-repair-status').textContent = (i.repairStatus || 'NOT_REQUIRED').replaceAll('_', ' ');
            document.getElementById('report-id').textContent = `#${i.id}`;
            document.getElementById('report-date').textContent = new Date(i.inspectionDate).toLocaleString();
            document.getElementById('report-type').textContent = i.inspectionType.replace('_', ' ');
            document.getElementById('report-inspector').textContent = i.inspectorName;
            document.getElementById('report-vehicle-reg').textContent = i.vehicleRegistrationNumber;
            document.getElementById('report-vehicle-model').textContent = `${i.vehicleBrand} ${i.vehicleModel}`;
            document.getElementById('report-booking-ref').textContent = i.bookingReference || 'N/A';

            document.getElementById('report-odometer').textContent = `${i.odometerReading?.toLocaleString()} km`;
            document.getElementById('report-fuel').textContent = `${i.fuelLevel}%`;
            document.getElementById('report-condition').textContent = i.condition;
            document.getElementById('report-cleanliness').textContent = i.cleanliness;
            document.getElementById('report-notes').textContent = i.notes || 'None';

            document.getElementById('report-chk-tire').textContent = i.spareTirePresent ? 'Present' : 'Missing!';
            document.getElementById('report-chk-tools').textContent = i.jackAndToolsPresent ? 'Present' : 'Missing!';
            document.getElementById('report-chk-docs').textContent = i.registrationDocPresent ? 'Present' : 'Missing!';
            document.getElementById('report-chk-kit').textContent = i.firstAidKitPresent ? 'Present' : 'Missing!';

            document.getElementById('report-status-badge').className = `status-badge status-${i.resultingVehicleStatus}`;
            document.getElementById('report-status-badge').textContent = i.resultingVehicleStatus.replace('_', ' ');

            // Comparison Section
            const cmpSection = document.getElementById('report-comparison-section');
            if (i.comparison) {
                cmpSection.classList.remove('hidden');
                document.getElementById('cmp-odo-prev').textContent = `${i.comparison.previousOdometer} km`;
                document.getElementById('cmp-odo-final').textContent = `${i.comparison.finalOdometer} km`;
                document.getElementById('cmp-odo-diff').textContent = `+${i.comparison.mileageDifference} km`;

                document.getElementById('cmp-fuel-prev').textContent = `${i.comparison.previousFuelLevel}%`;
                document.getElementById('cmp-fuel-final').textContent = `${i.comparison.finalFuelLevel}%`;
                document.getElementById('cmp-fuel-diff').textContent = `${i.comparison.fuelDifference}%`;

                document.getElementById('cmp-refund').textContent = i.comparison.depositRefundEligibility.replace('_', ' ');
            } else {
                cmpSection.classList.add('hidden');
            }

            // Damage Section
            const dmgSection = document.getElementById('report-damage-section');
            if (i.damageReport) {
                dmgSection.classList.remove('hidden');
                document.getElementById('report-damage-severity').textContent = i.damageReport.damageSeverity;
                document.getElementById('report-damage-desc').textContent = i.damageReport.damageDescription;
                document.getElementById('report-damage-parts').textContent = i.damageReport.damagedParts || 'General';
                document.getElementById('report-damage-cost').textContent = `LKR ${i.damageReport.estimatedRepairCost?.toLocaleString()}`;
            } else {
                dmgSection.classList.add('hidden');
            }

            App.openModal('inspection-report-modal');
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    }
};
