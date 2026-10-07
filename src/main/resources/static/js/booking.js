let selectedVehicle = null;
let currentAuthToken = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const vehicleId = params.get('vehicleId');

  if (!vehicleId) {
    alert('Please select a vehicle to book first.');
    window.location.href = '/search.html';
    return;
  }

  document.getElementById('vehicleId').value = vehicleId;

  const startInput = document.getElementById('startDate');
  const endInput = document.getElementById('endDate');

  // Set min dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDropoff = new Date(tomorrow);
  defaultDropoff.setDate(defaultDropoff.getDate() + 3);

  startInput.min = tomorrow.toISOString().split('T')[0];
  endInput.min = tomorrow.toISOString().split('T')[0];

  // Prefill values from URL query parameters if present
  startInput.value = params.get('startDate') || tomorrow.toISOString().split('T')[0];
  endInput.value = params.get('endDate') || defaultDropoff.toISOString().split('T')[0];

  if (params.get('pickupLocation')) {
    document.getElementById('pickupLocation').value = params.get('pickupLocation');
  }
  if (params.get('dropoffLocation')) {
    document.getElementById('dropoffLocation').value = params.get('dropoffLocation');
  }

  // Load Vehicle Details
  loadVehicleData(vehicleId);

  // Load Authenticated Customer Session
  initCustomerSession();

  // Attach event listeners for real-time recalculation
  startInput.addEventListener('change', onDateInputsChanged);
  endInput.addEventListener('change', onDateInputsChanged);
});

function getStoredToken() {
  return sessionStorage.getItem('auth_token') ||
         localStorage.getItem('auth_token') ||
         sessionStorage.getItem('token') ||
         localStorage.getItem('token');
}

function setStoredToken(token) {
  sessionStorage.setItem('auth_token', token);
  localStorage.setItem('auth_token', token);
}

function initCustomerSession() {
  const token = getStoredToken();
  if (token) {
    currentAuthToken = token;
    loadUserProfile(token);
  } else {
    // Check if token was provided in URL query (convenient for cross-project redirect from Friend_Project)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      currentAuthToken = tokenFromUrl;
      setStoredToken(tokenFromUrl);
      loadUserProfile(tokenFromUrl);
    } else {
      showUnauthenticatedState();
    }
  }
}

function loadUserProfile(token) {
  fetch('/api/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => {
    if (!res.ok) throw new Error('Session expired or invalid token');
    return res.json();
  })
  .then(profile => {
    showAuthenticatedState(profile);
  })
  .catch(err => {
    console.warn('Customer session could not be verified:', err);
    showUnauthenticatedState();
  });
}

function showAuthenticatedState(profile) {
  // Populate read-only fields
  document.getElementById('customerName').value = profile.fullName || '';
  document.getElementById('customerEmail').value = profile.email || '';
  document.getElementById('customerPhone').value = profile.phone || '';

  // Update status banner
  document.getElementById('sessionCustomerName').textContent = profile.fullName;
  document.getElementById('sessionCustomerIdBadge').textContent = `Customer ID: #${profile.id}`;
  document.getElementById('sessionCustomerEmail').textContent = profile.email;

  document.getElementById('authStatusBanner').style.display = 'flex';
  document.getElementById('unauthAlert').style.display = 'none';

  const confirmBtn = document.getElementById('confirmBookingBtn');
  confirmBtn.disabled = false;
  confirmBtn.textContent = 'Confirm & Create Booking';
}

function showUnauthenticatedState() {
  document.getElementById('customerName').value = '';
  document.getElementById('customerEmail').value = '';
  document.getElementById('customerPhone').value = '';

  document.getElementById('authStatusBanner').style.display = 'none';
  document.getElementById('unauthAlert').style.display = 'block';

  const confirmBtn = document.getElementById('confirmBookingBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = '🔒 Log In to Confirm Booking';
}

function promptTokenLogin() {
  const token = getStoredToken() || '';
  document.getElementById('tokenInput').value = token;
  document.getElementById('tokenErrorMsg').style.display = 'none';
  document.getElementById('tokenModal').classList.add('active');
}

function closeTokenModal() {
  document.getElementById('tokenModal').classList.remove('active');
}

function applyTokenAndLoadProfile() {
  const token = document.getElementById('tokenInput').value.trim();
  const errorMsg = document.getElementById('tokenErrorMsg');

  if (!token) {
    errorMsg.style.display = 'block';
    errorMsg.textContent = 'Please enter a valid JWT token.';
    return;
  }

  fetch('/api/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error('Token rejected: invalid signature, expired, or user not found.');
    return res.json();
  })
  .then(profile => {
    currentAuthToken = token;
    setStoredToken(token);
    showAuthenticatedState(profile);
    closeTokenModal();
    showToast(`Logged in as ${profile.fullName} (Customer ID: #${profile.id})`, 'success');
  })
  .catch(err => {
    errorMsg.style.display = 'block';
    errorMsg.textContent = err.message;
  });
}

function loadVehicleData(vehicleId) {
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;

  let url = `/api/vehicles/${vehicleId}`;
  if (start && end) {
    url += `?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
  }

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Vehicle not found');
      return res.json();
    })
    .then(vehicle => {
      selectedVehicle = vehicle;
      renderVehicleSummary(vehicle);
      recalculateAmounts();
    })
    .catch(err => {
      showToast(err.message, 'error');
      document.getElementById('vehicleSummaryCard').innerHTML = `<p style="color: var(--danger);">Failed to load vehicle info: ${err.message}</p>`;
    });
}

function renderVehicleSummary(v) {
  document.getElementById('summaryVehicleName').textContent = `${v.brand} ${v.model}`;
  document.getElementById('summaryVehicleReg').textContent = v.registrationNumber;
  document.getElementById('summaryVehicleImg').src = v.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
  document.getElementById('vehicleTypeBadge').textContent = v.vehicleType;
  document.getElementById('summaryRate').textContent = `Rs. ${Number(v.rentalRate).toLocaleString()} / day`;
  document.getElementById('summarySeats').textContent = `${v.seatingCapacity} Passengers`;

  const notice = document.getElementById('availabilityNotice');
  if (v.available) {
    notice.innerHTML = `<span style="color: var(--success); font-weight: 600;">✔ Available for requested dates</span>`;
  } else {
    notice.innerHTML = `<span style="color: var(--danger); font-weight: 600;">✖ ${v.availabilityMessage}</span>`;
  }
}

function onDateInputsChanged() {
  const startInput = document.getElementById('startDate');
  const endInput = document.getElementById('endDate');

  if (startInput.value) {
    const minEnd = new Date(startInput.value);
    minEnd.setDate(minEnd.getDate() + 1);
    endInput.min = minEnd.toISOString().split('T')[0];
    if (endInput.value && endInput.value <= startInput.value) {
      endInput.value = minEnd.toISOString().split('T')[0];
    }
  }

  recalculateAmounts();
  checkBackendAvailability();
}

function recalculateAmounts() {
  if (!selectedVehicle) return;

  const startVal = document.getElementById('startDate').value;
  const endVal = document.getElementById('endDate').value;
  const errorAlert = document.getElementById('bookingErrorAlert');

  if (!startVal || !endVal) return;

  const start = new Date(startVal);
  const end = new Date(endVal);

  if (end <= start) {
    errorAlert.style.display = 'block';
    errorAlert.textContent = 'Drop-off date must be after pickup date.';
    document.getElementById('confirmBookingBtn').disabled = true;
    return;
  } else {
    errorAlert.style.display = 'none';
    if (currentAuthToken) {
      document.getElementById('confirmBookingBtn').disabled = false;
    }
  }

  const diffTime = end.getTime() - start.getTime();
  let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (days <= 0) days = 1;

  const rate = Number(selectedVehicle.rentalRate);
  const total = rate * days;

  document.getElementById('summaryDays').textContent = `${days} day${days > 1 ? 's' : ''}`;
  document.getElementById('summaryTotalAmount').textContent = `Rs. ${total.toLocaleString()}`;
}

function checkBackendAvailability() {
  if (!selectedVehicle) return;
  const vehicleId = selectedVehicle.vehicleId;
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;

  if (!start || !end || end <= start) return;

  fetch(`/api/vehicles/${vehicleId}?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`)
    .then(res => res.json())
    .then(data => {
      const notice = document.getElementById('availabilityNotice');
      const submitBtn = document.getElementById('confirmBookingBtn');

      if (data.available) {
        notice.innerHTML = `<span style="color: var(--success); font-weight: 600;">✔ Available for requested dates</span>`;
        if (currentAuthToken) submitBtn.disabled = false;
      } else {
        notice.innerHTML = `<span style="color: var(--danger); font-weight: 600;">✖ ${data.availabilityMessage}</span>`;
        submitBtn.disabled = true;
      }
    })
    .catch(console.error);
}

function submitBooking(e) {
  e.preventDefault();

  const token = currentAuthToken || getStoredToken();
  if (!token) {
    promptTokenLogin();
    return;
  }

  const submitBtn = document.getElementById('confirmBookingBtn');
  const errorAlert = document.getElementById('bookingErrorAlert');
  errorAlert.style.display = 'none';

  // Customer ID is NOT sent from frontend; server identifies customer from JWT token
  const payload = {
    vehicleId: Number(document.getElementById('vehicleId').value),
    pickupLocation: document.getElementById('pickupLocation').value,
    dropoffLocation: document.getElementById('dropoffLocation').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    comment: document.getElementById('bookingComment').value.trim()
  };

  if (payload.endDate <= payload.startDate) {
    errorAlert.style.display = 'block';
    errorAlert.textContent = 'Drop-off date must be after pickup date.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifying Availability & Saving...';

  // POST /api/bookings - Spring Boot backend extracts user ID from JWT, verifies availability & saves
  fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  .then(async res => {
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      }
      throw new Error(data.message || 'Booking could not be confirmed.');
    }
    return data;
  })
  .then(booking => {
    openSuccessModal(booking);
  })
  .catch(err => {
    errorAlert.style.display = 'block';
    errorAlert.textContent = err.message;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirm & Create Booking';
    showToast(err.message, 'error');
  });
}

function openSuccessModal(booking) {
  const modal = document.getElementById('successModal');
  const body = document.getElementById('successModalBody');

  const commentHtml = booking.comment ? `
    <div><strong>Customer Comment:</strong> <span style="font-style: italic; color: #1e293b;">"${booking.comment}"</span></div>
  ` : '';

  body.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div style="font-size: 3rem; margin-bottom: 0.5rem;">🚗</div>
      <h4 style="font-size: 1.25rem; font-weight: 700; color: var(--secondary);">Reservation #${booking.bookingId}</h4>
      <p style="color: var(--text-muted);">
        Status: <span class="badge badge-confirmed">${booking.bookingStatus}</span> • 
        Customer ID: <span class="badge badge-modified">#${booking.customerId}</span>
      </p>
    </div>

    <div style="background: #f8fafc; padding: 1.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border); font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.6rem;">
      <div><strong>Customer:</strong> ${booking.customerName} (${booking.customerEmail})</div>
      <div><strong>Vehicle:</strong> ${booking.vehicleName} (${booking.vehicleRegistration})</div>
      <div><strong>Rental Dates:</strong> ${booking.startDate} to ${booking.endDate} (${booking.rentalDays} days)</div>
      <div><strong>Route:</strong> ${booking.pickupLocation} ➔ ${booking.dropoffLocation}</div>
      ${commentHtml}
      <div style="border-top: 1px dashed var(--border); padding-top: 0.6rem; display: flex; justify-content: space-between; font-size: 1.05rem;">
        <strong>Total Amount:</strong>
        <strong style="color: var(--primary);">Rs. ${Number(booking.totalAmount).toLocaleString()}</strong>
      </div>
    </div>
    <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 1rem; text-align: center;">
      This reservation is linked to your customer account and stored in the central MySQL database.
    </p>
  `;

  modal.classList.add('active');
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
  setTimeout(() => toast.remove(), 4500);
}
