import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, Modal, StatusPill, SuccessBanner, VehiclePhoto, fmtDate, fmtDateTime, money } from "../../../components/ui";

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
  const [typeFilter, setTypeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(
          await api.get("/fleet/vehicles", {
            query: query || undefined,
            status: status || undefined,
            vehicleType: typeFilter || undefined,
            active: activeFilter || undefined,
            page,
            size: 12,
          })
      );
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

  async function setActive(v, active) {
    try {
      await api.patch(`/fleet/vehicles/${v.id}/${active ? "reactivate" : "deactivate"}`);
      setSuccess(`${v.registrationNumber} ${active ? "reactivated" : "deactivated"}.`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deletePermanently(v) {
    if (!window.confirm(`Permanently delete ${v.registrationNumber}? This cannot be undone and is blocked while bookings or inspections reference it.`)) return;
    try {
      await api.del(`/fleet/vehicles/${v.id}/permanent`);
      setSuccess(`${v.registrationNumber} deleted.`);
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
          <div className="field">
            <label>Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All</option>
              {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Record</label>
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
              <option value="">Active & deactivated</option>
              <option value="true">Active only</option>
              <option value="false">Deactivated only</option>
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
                    <VehiclePhoto url={v.images?.[0]?.url} alt={`${v.brand} ${v.model}`} />
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
                    <div className="vehicle-meta" style={{ fontSize: 11.5 }}>
                <span>
                  Insurance <StatusPill value={v.insuranceStatus} />{" "}
                  {v.insuranceDaysUntilExpiry != null && (v.insuranceDaysUntilExpiry >= 0 ? `${v.insuranceDaysUntilExpiry}d` : "expired")}
                </span>
                      <span>
                  License <StatusPill value={v.licenseStatus} />{" "}
                        {v.licenseDaysUntilExpiry != null && (v.licenseDaysUntilExpiry >= 0 ? `${v.licenseDaysUntilExpiry}d` : "expired")}
                </span>
                    </div>
                    <div className="vehicle-price">{money(v.rentalRate)}/day</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="btn btn-sm" onClick={() => setViewing(v)}>
                        Details
                      </button>
                      <button
                          className="btn btn-sm"
                          onClick={() => {
                            setEditing(v);
                            setShowForm(true);
                          }}
                      >
                        Edit
                      </button>
                      <button className="btn btn-sm" onClick={() => setActive(v, !v.active)}>
                        {v.active ? "Deactivate" : "Reactivate"}
                      </button>
                      <button className="btn btn-sm" onClick={() => deletePermanently(v)}>
                        Delete
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

        {viewing && <VehicleDetailModal vehicle={viewing} onClose={() => setViewing(null)} />}

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

function VehicleDetailModal({ vehicle, onClose }) {
  const [history, setHistory] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [h, i] = await Promise.all([
          api.get(`/fleet/vehicles/${vehicle.id}/booking-history`),
          api.get(`/fleet/vehicles/${vehicle.id}/inspections`),
        ]);
        setHistory(h);
        setInspections(i);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [vehicle.id]);

  const v = history?.vehicle || vehicle;
  const bookings = history?.bookings || [];

  return (
      <Modal title={`${v.brand} ${v.model} — ${v.registrationNumber}`} onClose={onClose}>
        <ErrorBanner message={error} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {(v.images || []).map((img) => (
              <div key={img.id} style={{ width: 110 }}>
                <VehiclePhoto url={img.url} alt={img.originalName} height={80} />
              </div>
          ))}
        </div>
        <div className="vehicle-meta" style={{ marginBottom: 8 }}>
          <span>{v.vehicleType}</span>
          <span>{v.seatingCapacity} seats</span>
          <span>{v.mileage?.toLocaleString()} km</span>
          <span>Fuel {v.fuelLevel}%</span>
          <StatusPill value={v.operationalStatus} />
          <StatusPill value={v.condition} />
          {!v.active && <StatusPill value="DEACTIVATED" />}
        </div>
        <p style={{ fontSize: 12.5, margin: "4px 0" }}>
          Insurance {v.insurancePolicyNumber} — expires {fmtDate(v.insuranceExpiryDate)} <StatusPill value={v.insuranceStatus} />
        </p>
        <p style={{ fontSize: 12.5, margin: "4px 0 14px" }}>
          License {v.licenseNumber} — expires {fmtDate(v.licenseExpiryDate)} <StatusPill value={v.licenseStatus} />
        </p>

        {loading ? (
            <LoadingRow />
        ) : (
            <>
              <h4 style={{ margin: "12px 0 6px" }}>Booking history ({bookings.length})</h4>
              {bookings.length === 0 ? (
                  <EmptyState>No bookings for this vehicle.</EmptyState>
              ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                      <tr>
                        <th>#</th>
                        <th>Customer</th>
                        <th>Dates</th>
                        <th>Route</th>
                        <th>Status</th>
                        <th>Total</th>
                      </tr>
                      </thead>
                      <tbody>
                      {bookings.map((b) => (
                          <tr key={b.bookingId}>
                            <td>{b.bookingId}</td>
                            <td>{b.customerName}</td>
                            <td>
                              {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
                            </td>
                            <td>
                              {b.pickupLocation} → {b.dropoffLocation}
                            </td>
                            <td>
                              <StatusPill value={b.bookingStatus} />
                            </td>
                            <td>{money(b.totalAmount)}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              )}

              <h4 style={{ margin: "16px 0 6px" }}>Inspection history ({inspections.length})</h4>
              {inspections.length === 0 ? (
                  <EmptyState>No inspections recorded for this vehicle.</EmptyState>
              ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Inspector</th>
                        <th>Condition</th>
                        <th>Repair</th>
                      </tr>
                      </thead>
                      <tbody>
                      {inspections.map((i) => (
                          <tr key={i.id}>
                            <td>{fmtDateTime(i.inspectionDate)}</td>
                            <td>{i.inspectionType?.replaceAll("_", " ")}</td>
                            <td>{i.inspectorName}</td>
                            <td>
                              <StatusPill value={i.condition} />
                            </td>
                            <td>
                              <StatusPill value={i.repairStatus} />
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              )}
            </>
        )}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
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
  const [images, setImages] = useState(vehicle?.images || []);
  const [newFiles, setNewFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function uploadImages(vehicleId, files) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (const f of files) formData.append("images", f);
    const uploaded = await api.postForm(`/fleet/vehicles/${vehicleId}/images`, formData);
    setImages((prev) => [...prev, ...uploaded]);
    setNewFiles([]);
  }

  async function removeExistingImage(vehicleId, imageId) {
    setDeletingImageId(imageId);
    setError("");
    try {
      await api.del(`/fleet/vehicles/${vehicleId}/images/${imageId}`);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingImageId(null);
    }
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
      let vehicleId = vehicle?.id;
      if (vehicle) {
        await api.put(`/fleet/vehicles/${vehicle.id}`, payload);
      } else {
        const created = await api.post("/fleet/vehicles", payload);
        vehicleId = created.id;
      }
      if (newFiles.length > 0) {
        setUploadingImages(true);
        await uploadImages(vehicleId, newFiles);
      }
      onSaved();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  }

  return (
      <Modal title={vehicle ? `Edit ${vehicle.registrationNumber}` : "Add vehicle"} onClose={onClose}>
        <ErrorBanner message={error} />
        <form onSubmit={submit}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Photos</label>
            {images.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  {images.map((img) => (
                      <div key={img.id} style={{ position: "relative", width: 110 }}>
                        <VehiclePhoto url={img.url} alt={img.originalName} height={80} />
                        <button
                            type="button"
                            className="btn btn-sm"
                            disabled={deletingImageId === img.id}
                            onClick={() => removeExistingImage(vehicle.id, img.id)}
                            style={{ position: "absolute", top: 4, right: 4, padding: "2px 6px", lineHeight: 1 }}
                        >
                          {deletingImageId === img.id ? "…" : "✕"}
                        </button>
                      </div>
                  ))}
                </div>
            )}
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
            />
            {newFiles.length > 0 && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>
                  {newFiles.length} new photo{newFiles.length > 1 ? "s" : ""} will be uploaded on save.
                </p>
            )}
            {!vehicle && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>
                  Photos are uploaded right after the vehicle is created.
                </p>
            )}
          </div>
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
              {uploadingImages ? "Uploading photos…" : saving ? "Saving…" : vehicle ? "Save changes" : "Add vehicle"}
            </button>
          </div>
        </form>
      </Modal>
  );
}