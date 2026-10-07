let currentVehiclesList = [];

// Initialize dates and parse URL search params on page load
document.addEventListener('DOMContentLoaded', () => {
  setupDatePickers();
  readUrlParamsAndSearch();
});

function setupDatePickers() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const future = new Date(tomorrow);
  future.setDate(future.getDate() + 3);

  const startInput = document.getElementById('startDate');
  const endInput = document.getElementById('endDate');

  startInput.min = tomorrow.toISOString().split('T')[0];
  endInput.min = tomorrow.toISOString().split('T')[0];

  if (!startInput.value) {
    startInput.value = tomorrow.toISOString().split('T')[0];
  }
  if (!endInput.value) {
    endInput.value = future.toISOString().split('T')[0];
  }

  startInput.addEventListener('change', () => {
    if (startInput.value) {
      const newMinEnd = new Date(startInput.value);
      newMinEnd.setDate(newMinEnd.getDate() + 1);
      endInput.min = newMinEnd.toISOString().split('T')[0];
      if (endInput.value && endInput.value <= startInput.value) {
        endInput.value = newMinEnd.toISOString().split('T')[0];
      }
    }
  });
}

function readUrlParamsAndSearch() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('startDate')) document.getElementById('startDate').value = params.get('startDate');
  if (params.get('endDate')) document.getElementById('endDate').value = params.get('endDate');
  if (params.get('pickupLocation')) document.getElementById('pickupLocation').value = params.get('pickupLocation');
  if (params.get('dropoffLocation')) document.getElementById('dropoffLocation').value = params.get('dropoffLocation');
  if (params.get('vehicleType')) document.getElementById('vehicleType').value = params.get('vehicleType');
  if (params.get('maxPrice')) document.getElementById('maxPrice').value = params.get('maxPrice');

  executeVehicleSearch();
}

function resetSearchFilters() {
  document.getElementById('pickupLocation').value = '';
  document.getElementById('dropoffLocation').value = '';
  document.getElementById('vehicleType').value = '';
  document.getElementById('maxPrice').value = '';
  setupDatePickers();
  executeVehicleSearch();
}

function executeVehicleSearch(event) {
  if (event) event.preventDefault();

  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const pickup = document.getElementById('pickupLocation').value;
  const dropoff = document.getElementById('dropoffLocation').value;
  const vehicleType = document.getElementById('vehicleType').value;
  const maxPrice = document.getElementById('maxPrice').value;

  if (startDate && endDate && endDate <= startDate) {
    showToast('Drop-off date must be after pickup date.', 'error');
    return;
  }

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  if (vehicleType) queryParams.append('vehicleType', vehicleType);
  if (maxPrice) queryParams.append('maxPrice', maxPrice);
  if (pickup) queryParams.append('pickupLocation', pickup);

  const container = document.getElementById('vehiclesContainer');
  container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">Querying vehicle availability from MySQL...</div>';

  fetch(`/api/vehicles/search?${queryParams.toString()}`)
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => { throw new Error(err.message || 'Error fetching vehicles'); });
      }
      return res.json();
    })
    .then(vehicles => {
      currentVehiclesList = vehicles;
      renderVehicleCards(vehicles, startDate, endDate, pickup, dropoff);
    })
    .catch(err => {
      showToast(err.message, 'error');
      container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 2rem;">Failed to load vehicles: ${err.message}</div>`;
    });
}

function renderVehicleCards(vehicles, startDate, endDate, pickup, dropoff) {
  const container = document.getElementById('vehiclesContainer');
  const meta = document.getElementById('searchResultsMeta');
  const dateNotice = document.getElementById('dateNotice');

  meta.textContent = `Found ${vehicles.length} vehicle(s)`;
  if (startDate && endDate) {
    dateNotice.textContent = `Availability checked for: ${startDate} to ${endDate}`;
  } else {
    dateNotice.textContent = '';
  }

  if (vehicles.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--surface); border-radius: var(--radius); border: 1px dashed var(--border);">
        <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 1rem;">No vehicles matched your search and filter criteria.</p>
        <button class="btn btn-secondary" onclick="resetSearchFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = vehicles.map(v => {
    const isAvail = v.available;
    const badgeClass = isAvail ? 'badge-available' : 'badge-maintenance';
    const badgeText = isAvail ? 'AVAILABLE' : (v.operationalStatus !== 'AVAILABLE' ? v.operationalStatus : 'UNAVAILABLE');

    const bookParams = new URLSearchParams({
      vehicleId: v.vehicleId,
      startDate: startDate || '',
      endDate: endDate || '',
      pickupLocation: pickup || '',
      dropoffLocation: dropoff || ''
    }).toString();

    return `
      <div class="vehicle-card" id="card-${v.vehicleId}">
        <div class="vehicle-card-img-wrap">
          <img src="${v.imageUrl}" alt="${v.brand} ${v.model}" class="vehicle-card-img" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'">
          <span class="vehicle-status-tag ${badgeClass}">
            ${badgeText}
          </span>
        </div>
        <div class="vehicle-body">
          <div class="vehicle-header">
            <div>
              <h3 class="vehicle-title">${v.brand} ${v.model}</h3>
              <span class="vehicle-reg">${v.registrationNumber}</span>
            </div>
            <span class="spec-chip">${v.vehicleType}</span>
          </div>

          <div class="vehicle-specs">
            <span class="spec-chip">👥 ${v.seatingCapacity} Seats</span>
            <span class="spec-chip">⛽ ${v.fuelLevel}</span>
            <span class="spec-chip">✨ ${v.vehicleCondition}</span>
          </div>

          <p class="vehicle-desc">${v.description || 'Reliable rental vehicle with comprehensive insurance.'}</p>

          <div style="margin: 0.5rem 0; font-size: 0.8rem; color: ${isAvail ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
            ${isAvail ? '✔ ' + v.availabilityMessage : '✖ ' + v.availabilityMessage}
          </div>

          <div class="vehicle-footer">
            <div class="vehicle-price">
              Rs. ${Number(v.rentalRate).toLocaleString()}<span> / day</span>
            </div>
            <div class="vehicle-actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openVehicleModal(${v.vehicleId})">
                View Details
              </button>
              ${isAvail 
                ? `<a href="/booking.html?${bookParams}" class="btn btn-primary btn-sm">BOOK NOW</a>` 
                : `<button class="btn btn-secondary btn-sm" disabled title="Not available for selected dates">Unavailable</button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openVehicleModal(vehicleId) {
  const v = currentVehiclesList.find(item => item.vehicleId === vehicleId);
  if (!v) return;

  const modal = document.getElementById('vehicleModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const bookBtn = document.getElementById('modalBookBtn');

  title.textContent = `${v.brand} ${v.model} (${v.registrationNumber})`;

  body.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <img src="${v.imageUrl}" style="width: 100%; height: 220px; object-fit: cover; border-radius: var(--radius-sm);" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'">
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.9rem; margin-bottom: 1rem;">
      <div><strong>Registration:</strong> ${v.registrationNumber}</div>
      <div><strong>Category:</strong> ${v.vehicleType}</div>
      <div><strong>Seating:</strong> ${v.seatingCapacity} Passengers</div>
      <div><strong>Daily Rate:</strong> Rs. ${Number(v.rentalRate).toLocaleString()}</div>
      <div><strong>Odometer Mileage:</strong> ${Number(v.mileage).toLocaleString()} km</div>
      <div><strong>Fuel Level:</strong> ${v.fuelLevel}</div>
      <div><strong>Condition:</strong> ${v.vehicleCondition}</div>
      <div><strong>Operational Status:</strong> <span class="badge ${v.operationalStatus === 'AVAILABLE' ? 'badge-available' : 'badge-maintenance'}">${v.operationalStatus}</span></div>
    </div>
    <div style="border-top: 1px solid var(--border); padding-top: 0.75rem;">
      <h4 style="font-size: 0.9rem; margin-bottom: 0.25rem;">Description:</h4>
      <p style="font-size: 0.88rem; color: var(--text-muted);">${v.description || 'Clean and sanitized rental vehicle.'}</p>
    </div>
    <div style="margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: var(--radius-sm); font-size: 0.85rem;">
      <strong>Date Availability:</strong> ${v.available ? '<span style="color: var(--success); font-weight: 600;">Available for selected period</span>' : `<span style="color: var(--danger); font-weight: 600;">${v.availabilityMessage}</span>`}
    </div>
  `;

  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const pickup = document.getElementById('pickupLocation').value;
  const dropoff = document.getElementById('dropoffLocation').value;

  if (v.available) {
    bookBtn.disabled = false;
    bookBtn.onclick = () => {
      const bookParams = new URLSearchParams({
        vehicleId: v.vehicleId,
        startDate: startDate || '',
        endDate: endDate || '',
        pickupLocation: pickup || '',
        dropoffLocation: dropoff || ''
      }).toString();
      window.location.href = `/booking.html?${bookParams}`;
    };
  } else {
    bookBtn.disabled = true;
    bookBtn.onclick = null;
  }

  modal.classList.add('active');
}

function closeVehicleModal() {
  document.getElementById('vehicleModal').classList.remove('active');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="font-size: 1.1rem;">${type === 'error' ? '⚠️' : '✅'}</div>
    <div class="toast-message">${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}
