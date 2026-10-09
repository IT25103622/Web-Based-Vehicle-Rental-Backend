import { useEffect, useState } from "react";
import api from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { Card, EmptyState, ErrorBanner, LoadingRow, Modal, StatusPill, SuccessBanner, VehiclePhoto, money } from "../../../components/ui";

const VEHICLE_TYPES = ["SEDAN", "SUV", "HATCHBACK", "VAN", "LUXURY", "TRUCK", "WAGON", "ELECTRIC", "BIKE"];

function resolveImage(url) {
  if (!url) return null;
  return /^(https?:|data:)/i.test(url) ? url : api.imageUrl(url.startsWith("/") ? url : `/${url}`);
}

// "Current offers" strip: active, in-date promotions from the public
// GET /api/promotions endpoint, with their banner/promotion images.
function OffersStrip() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    api
        .get("/promotions")
        .then((list) => {
          const today = new Date().toISOString().slice(0, 10);
          setOffers(
              (list || []).filter(
                  (p) => p.status === "ACTIVE" && (!p.endDate || String(p.endDate).slice(0, 10) >= today) && (!p.startDate || String(p.startDate).slice(0, 10) <= today)
              )
          );
        })
        .catch(() => setOffers([]));
  }, []);

  if (offers.length === 0) return null;

  return (
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 10px" }}>Current offers</h4>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {offers.map((p) => {
            const img = resolveImage(p.bannerImage || p.promotionImage);
            return (
                <div key={p.id} className="vehicle-card" style={{ width: 260 }}>
                  {img && (
                      <img
                          src={img}
                          alt={p.promotionName}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                          style={{ height: 110, width: "100%", objectFit: "cover", borderRadius: 10, display: "block" }}
                      />
                  )}
                  <h4 style={{ margin: 0 }}>{p.promotionName}</h4>
                  <div className="vehicle-price">{p.discountPercentage}% off</div>
                  <div className="vehicle-meta">
                    <span>{p.vehicleCategory}</span>
                    <span>Min {p.minimumRentalDays} day(s)</span>
                  </div>
                  {p.description && <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{p.description}</p>}
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    Valid until {String(p.endDate).slice(0, 10)}
                    {p.promotionCode ? ` · Code ${p.promotionCode}` : ""}
                  </div>
                </div>
            );
          })}
        </div>
      </div>
  );
}
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
        <OffersStrip />
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
  const { user } = useAuth();
  const [form, setForm] = useState({
    pickupLocation: defaultDates.pickupLocation || "",
    dropoffLocation: "",
    startDate: defaultDates.startDate || "",
    endDate: defaultDates.endDate || "",
    comment: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState(null);

  // Live price preview: the backend applies the best active promotion when the
  // booking is created, so show the customer exactly what they'll be charged.
  useEffect(() => {
    if (!form.startDate || !form.endDate || form.endDate <= form.startDate) {
      setQuote(null);
      return undefined;
    }
    let cancelled = false;
    api
        .post("/promotions/evaluate", { vehicleId: vehicle.vehicleId, pickupDate: form.startDate, returnDate: form.endDate })
        .then((r) => !cancelled && setQuote(r))
        .catch(() => !cancelled && setQuote(null));
    return () => {
      cancelled = true;
    };
  }, [vehicle.vehicleId, form.startDate, form.endDate]);

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
              <label>Booking for</label>
              <input value={user?.fullName || ""} disabled readOnly />

            </div>
            <div className="field">
              <label>Contact email</label>
              <input value={user?.email || ""} disabled readOnly title="This booking is tied to your account email and can't be changed here." />
            </div>
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
          {quote && (
              <div style={{ marginTop: 14, background: "var(--bg-panel)", borderRadius: 10, padding: 14, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>
                  {quote.rentalDays} day(s) × {money(quote.dailyPrice)}
                </span>
                  <span>{money(quote.originalAmount)}</span>
                </div>
                {quote.appliedPromotion ? (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--accent-green)" }}>
                  <span>
                    {quote.appliedPromotion.promotionName} ({quote.discountPercentage}% off)
                  </span>
                      <span>-{money(quote.discountAmount)}</span>
                    </div>
                ) : (
                    <div style={{ marginBottom: 4, color: "var(--text-muted)" }}>No promotion applies to these dates.</div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, borderTop: "1px solid var(--border-subtle)", paddingTop: 8 }}>
                  <strong>Total</strong>
                  <strong>{money(quote.finalAmount)}</strong>
                </div>
              </div>
          )}
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

