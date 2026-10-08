import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, Modal, StatusPill, SuccessBanner, money } from "../../../components/ui";

const VEHICLE_TYPES = ["SEDAN", "SUV", "HATCHBACK", "VAN", "LUXURY", "TRUCK", "WAGON", "ELECTRIC", "BIKE"];
const CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "POOR"];
const STATUSES = ["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE", "OUT_OF_SERVICE"];

const BLANK_FORM = {
  registrationNumber: "",
  vehicleType: "SEDAN",
  brand: "",
  model: "",
  seatingCapacity: 5,
  rentalRate: "",
  mileage: 0,
  fuelLevel: 100,
  condition: "EXCELLENT",
  insurancePolicyNumber: "",
  insuranceExpiryDate: "",
  licenseNumber: "",
  licenseExpiryDate: "",
};

export default function CatalogTab() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 1 });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await api.get("/fleet/vehicles", { query: query || undefined, status: status || undefined, page, size: 12 }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function search(e) {
    e.preventDefault();
    setPage(0);
    load();
  }

  async function quickStatus(v, newStatus) {
    try {
      await api.patch(`/fleet/vehicles/${v.id}/status`, { status: newStatus, reason: `Set to ${newStatus} from catalog` });
      setSuccess(`${v.registrationNumber} set to ${newStatus}.`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  const rows = data.content || [];

  return (
    <Card
      title={`Vehicle catalog (${data.totalElements ?? rows.length})`}
      actions={
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Add vehicle
        </button>
      }
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <form onSubmit={search} className="form-grid" style={{ marginBottom: 18 }}>
        <div className="field">
          <label>Search</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Reg number, brand, model…" />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" type="submit">
            Filter
          </button>
        </div>
      </form>

      {loading ? (
        <LoadingRow />
      ) : rows.length === 0 ? (
        <EmptyState>No vehicles match your filters.</EmptyState>
      ) : (
        <div className="card-grid">
          {rows.map((v) => (
            <div key={v.id} className="vehicle-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h4>
                  {v.brand} {v.model}
                </h4>
                <StatusPill value={v.operationalStatus} />
              </div>
              <div className="vehicle-meta">
                <span>{v.registrationNumber}</span>
                <span>{v.vehicleType}</span>
                <span>{v.seatingCapacity} seats</span>
                <span>{v.mileage?.toLocaleString()} km</span>
              </div>
              <div className="vehicle-meta">
                <span>Fuel {v.fuelLevel}%</span>
                <StatusPill value={v.condition} />
                {!v.active && <StatusPill value="OUT_OF_SERVICE" />}
              </div>
              <div className="vehicle-price">{money(v.rentalRate)}/day</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setEditing(v);
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <select
                  className="btn btn-sm"
                  value=""
                  onChange={(e) => e.target.value && quickStatus(v, e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  <option value="">Set status…</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button className="btn btn-sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span style={{ alignSelf: "center", fontSize: 12.5, color: "var(--text-muted)" }}>
            Page {page + 1} of {data.totalPages || 1}
          </span>
          <button className="btn btn-sm" disabled={page + 1 >= (data.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}

      {showForm && (
        <VehicleFormModal
          vehicle={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setSuccess(editing ? "Vehicle updated." : "Vehicle added.");
            load();
          }}
        />
      )}
    </Card>
  );
}

function VehicleFormModal({ vehicle, onClose, onSaved }) {
  const [form, setForm] = useState(
    vehicle
      ? {
          registrationNumber: vehicle.registrationNumber,
          vehicleType: vehicle.vehicleType,
          brand: vehicle.brand,
          model: vehicle.model,
          seatingCapacity: vehicle.seatingCapacity,
          rentalRate: vehicle.rentalRate,
          mileage: vehicle.mileage,
          fuelLevel: vehicle.fuelLevel,
          condition: vehicle.condition,
          insurancePolicyNumber: vehicle.insurancePolicyNumber,
          insuranceExpiryDate: vehicle.insuranceExpiryDate,
          licenseNumber: vehicle.licenseNumber,
          licenseExpiryDate: vehicle.licenseExpiryDate,
          operationalStatus: vehicle.operationalStatus,
        }
      : BLANK_FORM
  );
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
      const payload = {
        ...form,
        seatingCapacity: Number(form.seatingCapacity),
        rentalRate: Number(form.rentalRate),
        mileage: Number(form.mileage),
        fuelLevel: Number(form.fuelLevel),
      };
      if (vehicle) {
        await api.put(`/fleet/vehicles/${vehicle.id}`, payload);
      } else {
        await api.post("/fleet/vehicles", payload);
      }
      onSaved();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={vehicle ? `Edit ${vehicle.registrationNumber}` : "Add vehicle"} onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label>Registration number</label>
            <input required value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} />
          </div>
          <div className="field">
            <label>Vehicle type</label>
            <select value={form.vehicleType} onChange={(e) => set("vehicleType", e.target.value)}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Brand</label>
            <input required value={form.brand} onChange={(e) => set("brand", e.target.value)} />
          </div>
          <div className="field">
            <label>Model</label>
            <input required value={form.model} onChange={(e) => set("model", e.target.value)} />
          </div>
          <div className="field">
            <label>Seating capacity</label>
            <input type="number" min="1" required value={form.seatingCapacity} onChange={(e) => set("seatingCapacity", e.target.value)} />
          </div>
          <div className="field">
            <label>Rental rate / day</label>
            <input type="number" step="0.01" min="0.01" required value={form.rentalRate} onChange={(e) => set("rentalRate", e.target.value)} />
          </div>
          <div className="field">
            <label>Mileage (km)</label>
            <input type="number" min="0" required value={form.mileage} onChange={(e) => set("mileage", e.target.value)} />
          </div>
          <div className="field">
            <label>Fuel level (%)</label>
            <input type="number" min="0" max="100" required value={form.fuelLevel} onChange={(e) => set("fuelLevel", e.target.value)} />
          </div>
          <div className="field">
            <label>Condition</label>
            <select value={form.condition} onChange={(e) => set("condition", e.target.value)}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {vehicle && (
            <div className="field">
              <label>Operational status</label>
              <select value={form.operationalStatus} onChange={(e) => set("operationalStatus", e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label>Insurance policy number</label>
            <input required value={form.insurancePolicyNumber} onChange={(e) => set("insurancePolicyNumber", e.target.value)} />
          </div>
          <div className="field">
            <label>Insurance expiry</label>
            <input type="date" required value={form.insuranceExpiryDate?.slice?.(0, 10) || form.insuranceExpiryDate} onChange={(e) => set("insuranceExpiryDate", e.target.value)} />
          </div>
          <div className="field">
            <label>License number</label>
            <input required value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
          </div>
          <div className="field">
            <label>License expiry</label>
            <input type="date" required value={form.licenseExpiryDate?.slice?.(0, 10) || form.licenseExpiryDate} onChange={(e) => set("licenseExpiryDate", e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : vehicle ? "Save changes" : "Add vehicle"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
