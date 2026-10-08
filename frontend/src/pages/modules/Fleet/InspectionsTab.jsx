import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, Modal, StatusPill, SuccessBanner, fmtDateTime } from "../../../components/ui";

const CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "POOR"];

export default function InspectionsTab() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await api.get("/inspections", { page, size: 15 }));
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

  const rows = data.content || [];

  return (
    <Card
      title="Inspection records"
      actions={
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          + Record inspection
        </button>
      }
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {loading ? (
        <LoadingRow />
      ) : rows.length === 0 ? (
        <EmptyState>No inspections recorded yet.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Inspector</th>
                <th>Condition</th>
                <th>Repair Status</th>
                <th>Resulting Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td>{fmtDateTime(i.inspectionDate)}</td>
                  <td>
                    {i.vehicleRegistrationNumber} — {i.vehicleBrand} {i.vehicleModel}
                  </td>
                  <td>{i.inspectionType?.replaceAll("_", " ")}</td>
                  <td>{i.inspectorName}</td>
                  <td>
                    <StatusPill value={i.condition} />
                  </td>
                  <td>
                    <StatusPill value={i.repairStatus} />
                  </td>
                  <td>
                    <StatusPill value={i.resultingVehicleStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <RecordInspectionModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setSuccess("Inspection recorded.");
            load();
          }}
        />
      )}
    </Card>
  );
}

function RecordInspectionModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    vehicleId: "",
    bookingReference: "",
    inspectionType: "PRE_RENTAL",
    odometerReading: "",
    fuelLevel: 100,
    condition: "GOOD",
    spareTirePresent: true,
    jackAndToolsPresent: true,
    registrationDocPresent: true,
    firstAidKitPresent: true,
    cleanliness: "CLEAN",
    notes: "",
    hasDamage: false,
    damageDescription: "",
    damageSeverity: "MINOR",
    estimatedRepairCost: "",
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
      const payload = {
        vehicleId: Number(form.vehicleId),
        bookingReference: form.bookingReference || null,
        inspectionType: form.inspectionType,
        odometerReading: Number(form.odometerReading),
        fuelLevel: Number(form.fuelLevel),
        condition: form.condition,
        spareTirePresent: form.spareTirePresent,
        jackAndToolsPresent: form.jackAndToolsPresent,
        registrationDocPresent: form.registrationDocPresent,
        firstAidKitPresent: form.firstAidKitPresent,
        cleanliness: form.cleanliness,
        notes: form.notes,
        hasDamage: form.hasDamage,
        damageReport: form.hasDamage
          ? {
              damageSeverity: form.damageSeverity,
              damageDescription: form.damageDescription,
              estimatedRepairCost: form.estimatedRepairCost ? Number(form.estimatedRepairCost) : 0,
              requiresImmediateRepair: form.damageSeverity === "SEVERE",
            }
          : null,
      };
      await api.post("/inspections", payload);
      onSaved();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Record inspection" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label>Vehicle ID</label>
            <input type="number" required value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} />
          </div>
          <div className="field">
            <label>Booking reference (optional)</label>
            <input value={form.bookingReference} onChange={(e) => set("bookingReference", e.target.value)} />
          </div>
          <div className="field">
            <label>Inspection type</label>
            <select value={form.inspectionType} onChange={(e) => set("inspectionType", e.target.value)}>
              <option value="PRE_RENTAL">PRE_RENTAL</option>
              <option value="POST_RENTAL">POST_RENTAL</option>
            </select>
          </div>
          <div className="field">
            <label>Odometer reading (km)</label>
            <input type="number" min="0" required value={form.odometerReading} onChange={(e) => set("odometerReading", e.target.value)} />
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
        </div>

        <div style={{ margin: "16px 0", display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            ["spareTirePresent", "Spare tire present"],
            ["jackAndToolsPresent", "Jack & tools present"],
            ["registrationDocPresent", "Registration docs present"],
            ["firstAidKitPresent", "First-aid kit present"],
          ].map(([key, label]) => (
            <label key={key} className="checkbox-row">
              <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Notes</label>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <label className="checkbox-row" style={{ marginBottom: 12 }}>
          <input type="checkbox" checked={form.hasDamage} onChange={(e) => set("hasDamage", e.target.checked)} />
          Damage detected
        </label>

        {form.hasDamage && (
          <div className="form-grid">
            <div className="field">
              <label>Damage severity</label>
              <select value={form.damageSeverity} onChange={(e) => set("damageSeverity", e.target.value)}>
                <option value="MINOR">MINOR</option>
                <option value="MODERATE">MODERATE</option>
                <option value="SEVERE">SEVERE</option>
              </select>
            </div>
            <div className="field">
              <label>Estimated repair cost</label>
              <input type="number" step="0.01" min="0" value={form.estimatedRepairCost} onChange={(e) => set("estimatedRepairCost", e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Damage description</label>
              <textarea required={form.hasDamage} value={form.damageDescription} onChange={(e) => set("damageDescription", e.target.value)} />
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Record inspection"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
