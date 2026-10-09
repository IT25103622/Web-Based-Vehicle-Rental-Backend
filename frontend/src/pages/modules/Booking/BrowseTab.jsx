import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, Modal, StatusPill, SuccessBanner, VehiclePhoto, money } from "../../../components/ui";

const VEHICLE_TYPES = ["SEDAN", "SUV", "HATCHBACK", "VAN", "LUXURY", "TRUCK", "WAGON", "ELECTRIC", "BIKE"];

export default function BrowseTab({ canBook }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({ startDate: "", endDate: "", vehicleType: "", maxPrice: "", pickupLocation: "" });
  const [booking, setBooking] = useState(null);

  async function load(withDates = false) {
    setLoading(true);
    setError("");
    try {
      const params = {
        startDate: withDates ? filters.startDate || undefined : undefined,
        endDate: withDates ? filters.endDate || undefined : undefined,
        vehicleType: filters.vehicleType || undefined,
        maxPrice: filters.maxPrice || undefined,
        pickupLocation: filters.pickupLocation || undefined,
      };
      setVehicles(await api.get("/vehicles/search", params));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function search(e) {
    e.preventDefault();
    load(true);
  }

  return (
      <Card title={`Available vehicles (${vehicles.length})`}>
        <ErrorBanner message={error} />
        <SuccessBanner message={success} />
        <form onSubmit={search} className="form-grid" style={{ marginBottom: 18 }}>
          <div className="field">
            <label>Pickup date</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="field">
            <label>Drop-off date</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="field">
            <label>Vehicle type</label>
            <select value={filters.vehicleType} onChange={(e) => setFilters((f) => ({ ...f, vehicleType: e.target.value }))}>
              <option value="">Any</option>
              {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Max price / day</label>
            <input type="number" min="0" value={filters.maxPrice} onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))} />
          </div>
          <div className="field">
            <label>Pickup location</label>
            <input value={filters.pickupLocation} onChange={(e) => setFilters((f) => ({ ...f, pickupLocation: e.target.value }))} />
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </div>
        </form>

        {loading ? (
            <LoadingRow />
        ) : vehicles.length === 0 ? (
            <EmptyState>No vehicles match your search.</EmptyState>
        ) : (
            <div className="card-grid">
              {vehicles.map((v) => (
                  <div key={v.vehicleId} className="vehicle-card">
                    <VehiclePhoto url={v.imageUrl} alt={`${v.brand} ${v.model}`} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4>
                        {v.brand} {v.model}
                      </h4>
                      <StatusPill value={v.available ? "AVAILABLE" : "RENTED"} />
                    </div>
                    <div className="vehicle-meta">
                      <span>{v.vehicleType}</span>
                      <span>{v.seatingCapacity} seats</span>
                      <StatusPill value={v.condition} />
                    </div>
                    {v.description && <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: 0 }}>{v.description}</p>}
                    {!v.available && v.availabilityMessage && <p style={{ fontSize: 12, color: "var(--accent-amber)", margin: 0 }}>{v.availabilityMessage}</p>}
                    <div className="vehicle-price">{money(v.rentalRate)}/day</div>
                    <button className="btn btn-primary btn-sm" disabled={!canBook} onClick={() => setBooking(v)}>
                      {canBook ? "Book this vehicle" : "Sign in to book"}
                    </button>
                  </div>
              ))}
            </div>
        )}

        {booking && (
            <BookModal
                vehicle={booking}
                defaultDates={filters}
                onClose={() => setBooking(null)}
                onBooked={() => {
                  setBooking(null);
                  setSuccess(`Booked ${booking.brand} ${booking.model}. See "My Bookings" for details.`);
                }}
            />
        )}
      </Card>
  );
}

function BookModal({ vehicle, defaultDates, onClose, onBooked }) {
  const [form, setForm] = useState({
    pickupLocation: defaultDates.pickupLocation || "",
    dropoffLocation: "",
    startDate: defaultDates.startDate || "",
    endDate: defaultDates.endDate || "",
    comment: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/bookings", { vehicleId: vehicle.vehicleId, ...form });
      onBooked();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
      <Modal
          title={`Book ${vehicle.brand} ${vehicle.model}`}
          onClose={onClose}
      >
        <ErrorBanner message={error} />
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Pickup date</label>
              <input type="date" required value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div className="field">
              <label>Drop-off date</label>
              <input type="date" required value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
            <div className="field">
              <label>Pickup location</label>
              <input required value={form.pickupLocation} onChange={(e) => set("pickupLocation", e.target.value)} />
            </div>
            <div className="field">
              <label>Drop-off location</label>
              <input required value={form.dropoffLocation} onChange={(e) => set("dropoffLocation", e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Comment (optional)</label>
              <textarea value={form.comment} onChange={(e) => set("comment", e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Booking…" : "Confirm booking"}
            </button>
          </div>
        </form>
      </Modal>
  );
}