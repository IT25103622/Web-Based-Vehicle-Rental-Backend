let allBookingsList = [];

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

document.addEventListener('DOMContentLoaded', () => {
  // Check if token was provided in URL query
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    setStoredToken(tokenFromUrl);
  }

  loadBookings();

  // Setup modify modal live price update
  document.getElementById('modStartDate').addEventListener('change', recalculateModifyTotal);
  document.getElementById('modEndDate').addEventListener('change', recalculateModifyTotal);
});

function loadBookings() {
  const token = getStoredToken();
  const tbody = document.getElementById('bookingsTableBody');

  if (!token) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          🔒 Please <a href="/booking.html" style="color: var(--primary); font-weight: 600;">log in with your account</a> or set your authentication token to view your bookings.
        </td>
      </tr>
    `;
    return;
  }

  const emailInput = document.getElementById('filterEmail').value.trim();
  let url = '/api/bookings';
  if (emailInput) {
    url += `?email=${encodeURIComponent(emailInput)}`;
  }

  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading bookings...</td></tr>`;

  fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(async res => {
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }
        throw new Error('Could not retrieve bookings');
      }
      return res.json();
    })
    .then(bookings => {
      allBookingsList = bookings;
      renderBookingsTable(bookings);
    })
    .catch(err => {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 2rem;">Error: ${err.message}</td></tr>`;
      showToast(err.message, 'error');
    });
}

function resetEmailFilter() {
  document.getElementById('filterEmail').value = '';
  loadBookings();
}

function renderBookingsTable(bookings) {
  const tbody = document.getElementById('bookingsTableBody');
  const countBadge = document.getElementById('bookingsCountBadge');
  countBadge.textContent = `${bookings.length} Booking${bookings.length === 1 ? '' : 's'}`;

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          No booking records found. <a href="/search.html" style="color: var(--primary); font-weight: 600;">Search and book a vehicle</a>.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    let statusBadgeClass = 'badge-confirmed';
    if (b.bookingStatus === 'MODIFIED') statusBadgeClass = 'badge-modified';
    if (b.bookingStatus === 'CANCELLED') statusBadgeClass = 'badge-cancelled';

    const isCancelled = b.bookingStatus === 'CANCELLED';
    const commentHtml = b.comment ? `
      <div style="font-size: 0.8rem; background: #f8fafc; border-left: 2px solid var(--primary); padding: 0.25rem 0.5rem; margin-top: 0.35rem; color: #475569; font-style: italic;">
        💬 "${b.comment}"
      </div>
    ` : '';

    return `
      <tr>
        <td style="font-weight: 700; color: var(--secondary);">#${b.bookingId}</td>
        <td>
          <div style="font-weight: 600;">${b.customerName}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${b.customerEmail}</div>
          <div style="margin-top: 0.2rem;"><span class="badge badge-modified" style="font-size: 0.72rem;">Customer ID: #${b.customerId || '--'}</span></div>
          ${commentHtml}
        </td>
        <td>
          <div style="font-weight: 600;">${b.vehicleName || 'Vehicle #' + b.vehicleId}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">${b.vehicleRegistration || ''}</div>
        </td>
        <td>
          <div>${b.startDate} ➔ ${b.endDate}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${b.rentalDays} day${b.rentalDays > 1 ? 's' : ''}</div>
        </td>
        <td>
          <div style="font-size: 0.85rem;">From: ${b.pickupLocation}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">To: ${b.dropoffLocation}</div>
        </td>
        <td style="font-weight: 700; color: var(--primary);">
          Rs. ${Number(b.totalAmount).toLocaleString()}
        </td>
        <td>
          <span class="badge ${statusBadgeClass}">${b.bookingStatus}</span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          ${!isCancelled ? `
            <button type="button" class="btn btn-secondary btn-sm" onclick="openModifyModal(${b.bookingId})">
              ✏️ Modify
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="openCancelModal(${b.bookingId}, '${b.vehicleName || ''}')">
              ❌ Cancel
            </button>
          ` : `
            <span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Released</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function openModifyModal(bookingId) {
  const booking = allBookingsList.find(b => b.bookingId === bookingId);
  if (!booking) return;

  document.getElementById('modBookingId').value = booking.bookingId;
  document.getElementById('modBookingIdDisplay').textContent = booking.bookingId;
  document.getElementById('modVehicleId').value = booking.vehicleId;
  document.getElementById('modRentalRate').value = booking.rentalRate || 0;
  document.getElementById('modVehicleName').textContent = `${booking.vehicleName} (${booking.vehicleRegistration})`;

  const startInput = document.getElementById('modStartDate');
  const endInput = document.getElementById('modEndDate');

  startInput.value = booking.startDate;
  endInput.value = booking.endDate;

  document.getElementById('modPickup').value = booking.pickupLocation;
  document.getElementById('modDropoff').value = booking.dropoffLocation;

  document.getElementById('modifyErrorAlert').style.display = 'none';

  recalculateModifyTotal();
  document.getElementById('modifyModal').classList.add('active');
}

function closeModifyModal() {
  document.getElementById('modifyModal').classList.remove('active');
}

function recalculateModifyTotal() {
  const startVal = document.getElementById('modStartDate').value;
  const endVal = document.getElementById('modEndDate').value;
  const rate = Number(document.getElementById('modRentalRate').value) || 0;
  const totalDisplay = document.getElementById('modEstimatedTotal');

  if (!startVal || !endVal) return;

  const start = new Date(startVal);
  const end = new Date(endVal);

  if (end <= start) {
    totalDisplay.textContent = 'Invalid dates';
    return;
  }

  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const newTotal = diffDays * rate;
  totalDisplay.textContent = `Rs. ${newTotal.toLocaleString()} (${diffDays} days)`;
}

function submitBookingModification(e) {
  e.preventDefault();

  const token = getStoredToken();
  const bookingId = document.getElementById('modBookingId').value;
  const errorAlert = document.getElementById('modifyErrorAlert');
  const saveBtn = document.getElementById('saveModifyBtn');

  errorAlert.style.display = 'none';

  const payload = {
    startDate: document.getElementById('modStartDate').value,
    endDate: document.getElementById('modEndDate').value,
    pickupLocation: document.getElementById('modPickup').value,
    dropoffLocation: document.getElementById('modDropoff').value
  };

  if (payload.endDate <= payload.startDate) {
    errorAlert.style.display = 'block';
    errorAlert.textContent = 'Drop-off date must be after pickup date.';
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Validating Availability...';

  fetch(`/api/bookings/${bookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  .then(async res => {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to modify booking');
    }
    return data;
  })
  .then(updated => {
    closeModifyModal();
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
    showToast(`Booking #${updated.bookingId} modified successfully! Status: MODIFIED`, 'success');
    loadBookings();
  })
  .catch(err => {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
    errorAlert.style.display = 'block';
    errorAlert.textContent = err.message;
    showToast(err.message, 'error');
  });
}

function openCancelModal(bookingId, vehicleName) {
  document.getElementById('cancelBookingId').value = bookingId;
  document.getElementById('cancelBookingIdDisplay').textContent = `#${bookingId}`;
  document.getElementById('cancelVehicleDisplay').textContent = vehicleName || 'selected vehicle';
  document.getElementById('cancelModal').classList.add('active');
}

function closeCancelModal() {
  document.getElementById('cancelModal').classList.remove('active');
}

function executeCancelBooking() {
  const token = getStoredToken();
  const bookingId = document.getElementById('cancelBookingId').value;
  const cancelBtn = document.getElementById('confirmCancelBtn');

  cancelBtn.disabled = true;
  cancelBtn.textContent = 'Cancelling...';

  fetch(`/api/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(async res => {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to cancel booking');
    }
    return data;
  })
  .then(cancelled => {
    closeCancelModal();
    cancelBtn.disabled = false;
    cancelBtn.textContent = 'Yes, Cancel Booking';
    showToast(`Booking #${cancelled.bookingId} cancelled successfully. Dates are now released.`, 'success');
    loadBookings();
  })
  .catch(err => {
    cancelBtn.disabled = false;
    cancelBtn.textContent = 'Yes, Cancel Booking';
    showToast(err.message, 'error');
  });
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

function promptSessionToken() {
  const token = getStoredToken() || '';
  document.getElementById('tokenInput').value = token;
  document.getElementById('tokenModal').classList.add('active');
}

function closeTokenModal() {
  document.getElementById('tokenModal').classList.remove('active');
}

function applySessionToken() {
  const token = document.getElementById('tokenInput').value.trim();
  if (!token) {
    alert('Please enter a valid JWT token.');
    return;
  }
  setStoredToken(token);
  closeTokenModal();
  showToast('Session token saved. Reloading bookings...', 'info');
  loadBookings();
}
