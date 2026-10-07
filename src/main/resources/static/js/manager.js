document.addEventListener('DOMContentLoaded', () => {
  refreshDashboard();
});

function refreshDashboard() {
  loadStats();
  loadFleetTableAndDropdown();
  loadManagerBookings();
}

function loadStats() {
  fetch('/api/manager/stats')
    .then(res => res.json())
    .then(stats => {
      document.getElementById('statTotalVehicles').textContent = stats.totalVehicles;
      document.getElementById('statAvailVehicles').textContent = stats.availableVehicles;
      document.getElementById('statReservedVehicles').textContent = stats.reservedVehicles;
      document.getElementById('statActiveBookings').textContent = stats.activeBookings;
      document.getElementById('statCancelledBookings').textContent = stats.cancelledBookings;
    })
    .catch(console.error);
}

function loadFleetTableAndDropdown() {
  fetch('/api/manager/availability')
    .then(res => res.json())
    .then(vehicles => {
      // 1. Populate vehicle filter dropdown
      const select = document.getElementById('filterVehicle');
      const currentVal = select.value;
      select.innerHTML = '<option value="">All Vehicles</option>';
      vehicles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.vehicleId;
        opt.textContent = `${v.brand} ${v.model} (${v.registrationNumber})`;
        select.appendChild(opt);
      });
      select.value = currentVal;

      // 2. Populate fleet table
      const tbody = document.getElementById('managerFleetTableBody');
      tbody.innerHTML = vehicles.map(v => {
        let badgeClass = 'badge-available';
        if (v.operationalStatus === 'RESERVED' || v.operationalStatus === 'RENTED') badgeClass = 'badge-reserved';
        if (v.operationalStatus === 'MAINTENANCE' || v.operationalStatus === 'OUT_OF_SERVICE') badgeClass = 'badge-maintenance';

        return `
          <tr>
            <td style="font-weight: 700; color: var(--secondary);">#${v.vehicleId}</td>
            <td style="font-family: monospace; font-weight: 600;">${v.registrationNumber}</td>
            <td><strong>${v.brand}</strong> ${v.model}</td>
            <td><span class="spec-chip">${v.vehicleType}</span></td>
            <td style="font-weight: 700; color: var(--primary);">Rs. ${Number(v.rentalRate).toLocaleString()}</td>
            <td>${v.seatingCapacity} seats</td>
            <td>${Number(v.mileage).toLocaleString()} km</td>
            <td>${v.fuelLevel}</td>
            <td>${v.vehicleCondition}</td>
            <td><span class="badge ${badgeClass}">${v.operationalStatus}</span></td>
          </tr>
        `;
      }).join('');
    })
    .catch(console.error);
}

function loadManagerBookings() {
  const status = document.getElementById('filterStatus').value;
  const vehicleId = document.getElementById('filterVehicle').value;
  const date = document.getElementById('filterDate').value;

  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (vehicleId) params.append('vehicleId', vehicleId);
  if (date) params.append('date', date);

  const tbody = document.getElementById('managerBookingsTableBody');
  tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading bookings...</td></tr>`;

  fetch(`/api/manager/bookings?${params.toString()}`)
    .then(res => res.json())
    .then(bookings => {
      document.getElementById('managerBookingsCount').textContent = `${bookings.length} Record${bookings.length === 1 ? '' : 's'}`;

      if (bookings.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              No bookings matched the selected filters.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = bookings.map(b => {
        let badgeClass = 'badge-confirmed';
        if (b.bookingStatus === 'MODIFIED') badgeClass = 'badge-modified';
        if (b.bookingStatus === 'CANCELLED') badgeClass = 'badge-cancelled';

        return `
          <tr>
            <td style="font-weight: 700; color: var(--secondary);">#${b.bookingId}</td>
            <td>
              <div style="font-weight: 600;">${b.customerName}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${b.customerEmail}</div>
            </td>
            <td>
              <div style="font-weight: 600;">${b.vehicleName}</div>
              <div style="font-size: 0.8rem; font-family: monospace; color: var(--text-muted);">${b.vehicleRegistration}</div>
            </td>
            <td>${b.startDate}</td>
            <td>${b.endDate}</td>
            <td style="font-size: 0.85rem;">${b.pickupLocation}</td>
            <td style="font-size: 0.85rem;">${b.dropoffLocation}</td>
            <td style="font-weight: 700; color: var(--primary);">Rs. ${Number(b.totalAmount).toLocaleString()}</td>
            <td><span class="badge ${badgeClass}">${b.bookingStatus}</span></td>
          </tr>
        `;
      }).join('');
    })
    .catch(console.error);
}

function clearManagerFilters() {
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterVehicle').value = '';
  document.getElementById('filterDate').value = '';
  loadManagerBookings();
}
