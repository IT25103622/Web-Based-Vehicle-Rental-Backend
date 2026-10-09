import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, Modal, SecureDocument, StatusPill, SuccessBanner, fmtDateTime, money } from "../../../components/ui";

const CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "POOR"];
const REPAIR_STATUSES = ["NOT_REQUIRED", "REQUIRED", "FIXED"];
const VEHICLE_STATUSES = ["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE", "OUT_OF_SERVICE"];

export default function InspectionsTab() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [viewingId, setViewingId] = useState(null);

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

  async function remove(i) {
    if (!window.confirm(`Delete this inspection of ${i.vehicleRegistrationNumber}? This cannot be undone.`)) return;
    try {
      await api.del(`/inspections/${i.id}`);
      setSuccess("Inspection deleted.");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

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
                  <th></th>
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
                      <td style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-sm" onClick={() => setViewingId(i.id)}>
                          View
                        </button>
                        <button className="btn btn-sm" onClick={() => remove(i)}>
                          Delete
                        </button>
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

        {viewingId && <InspectionDetailModal id={viewingId} onClose={() => setViewingId(null)} onChanged={load} />}
      </Card>
  );
}

function Row({ label, children }) {
  return (
      <div style={{ display: "flex", gap: 10, fontSize: 13, padding: "3px 0" }}>
        <span style={{ width: 170, color: "var(--text-muted)", flexShrink: 0 }}>{label}</span>
        <span>{children}</span>
      </div>
  );
}

function yesNo(v) {
  return v ? "Yes" : "No";
}

function InspectionDetailModal({ id, onClose, onChanged }) {
  const [insp, setInsp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState({ repairStatus: "NOT_REQUIRED", condition: "GOOD", notes: "" });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  function apply(data) {
    setInsp(data);
    setResult({ repairStatus: data.repairStatus || "NOT_REQUIRED", condition: data.condition || "GOOD", notes: data.notes || "" });
  }

  async function load() {
    setLoading(true);
    try {
      apply(await api.get(`/inspections/${id}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function run(fn, okMessage) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      setSuccess(okMessage);
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const updateResult = () =>
      run(async () => apply(await api.patch(`/inspections/${id}/result`, result)), "Repair result updated.");

  const saveNotes = () =>
      run(async () => apply(await api.put(`/inspections/${id}`, { notes: result.notes })), "Notes saved.");

  const uploadPhotos = () =>
      run(async () => {
        const fd = new FormData();
        for (const f of files) fd.append("images", f);
        await api.postForm(`/inspections/${id}/images`, fd);
        setFiles([]);
        apply(await api.get(`/inspections/${id}`));
      }, "Photos uploaded.");

  const removePhoto = (imageId) =>
      run(async () => {
        await api.del(`/inspections/${id}/images/${imageId}`);
        apply(await api.get(`/inspections/${id}`));
      }, "Photo removed.");

  const cmp = insp?.comparison;
  const dmg = insp?.damageReport;

  return (
      <Modal title="Inspection details" onClose={onClose}>
        <ErrorBanner message={error} />
        <SuccessBanner message={success} />
        {loading || !insp ? (
            <LoadingRow />
        ) : (
            <>
              <Row label="Vehicle">
                {insp.vehicleRegistrationNumber} — {insp.vehicleBrand} {insp.vehicleModel}
              </Row>
              <Row label="Type">{insp.inspectionType?.replaceAll("_", " ")}</Row>
              <Row label="Booking reference">{insp.bookingReference || "—"}</Row>
              <Row label="Inspector">{insp.inspectorName}</Row>
              <Row label="Date">{fmtDateTime(insp.inspectionDate)}</Row>
              <Row label="Odometer / fuel">
                {insp.odometerReading?.toLocaleString()} km · {insp.fuelLevel}%
              </Row>
              <Row label="Cleanliness">{insp.cleanliness}</Row>
              <Row label="Items present">
                Spare tire: {yesNo(insp.spareTirePresent)} · Jack &amp; tools: {yesNo(insp.jackAndToolsPresent)} · Reg. docs:{" "}
                {yesNo(insp.registrationDocPresent)} · First-aid: {yesNo(insp.firstAidKitPresent)}
              </Row>
              <Row label="Resulting vehicle status">
                <StatusPill value={insp.resultingVehicleStatus} />
              </Row>

              {cmp && (
                  <>
                    <h4 style={{ margin: "16px 0 6px" }}>Return comparison report</h4>
                    <Row label="Mileage">
                      {cmp.previousOdometer?.toLocaleString()} → {cmp.finalOdometer?.toLocaleString()} km (
                      {cmp.mileageDifference >= 0 ? "+" : ""}
                      {cmp.mileageDifference?.toLocaleString()} km)
                    </Row>
                    <Row label="Fuel">
                      {cmp.previousFuelLevel}% → {cmp.finalFuelLevel}% ({cmp.fuelDifference >= 0 ? "+" : ""}
                      {cmp.fuelDifference}%)
                    </Row>
                    <Row label="Condition">
                      <StatusPill value={cmp.previousCondition} /> → <StatusPill value={cmp.finalCondition} />
                    </Row>
                    <Row label="Missing items">{cmp.missingItems && cmp.missingItems.length > 0 ? cmp.missingItems.join(", ") : "None"}</Row>
                    <Row label="New damage">{cmp.newDamageDetected ? `Yes — ${cmp.damageSummary || ""}` : "No"}</Row>
                    <Row label="Estimated repair cost">{money(cmp.estimatedRepairCost)}</Row>
                    <Row label="Recommended vehicle status">
                      <StatusPill value={cmp.recommendedVehicleStatus} />
                    </Row>
                    <Row label="Deposit refund">{cmp.depositRefundEligibility?.replaceAll("_", " ")}</Row>
                  </>
              )}

              {dmg && (
                  <>
                    <h4 style={{ margin: "16px 0 6px" }}>Damage report</h4>
                    <Row label="Severity">{dmg.damageSeverity}</Row>
                    <Row label="Description">{dmg.damageDescription}</Row>
                    {dmg.damagedParts && <Row label="Damaged parts">{dmg.damagedParts}</Row>}
                    <Row label="Estimated repair cost">{money(dmg.estimatedRepairCost)}</Row>
                    <Row label="Immediate repair">{yesNo(dmg.requiresImmediateRepair)}</Row>
                  </>
              )}

              <h4 style={{ margin: "16px 0 6px" }}>Photos ({(insp.images || []).length})</h4>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                {(insp.images || []).map((img) => (
                    <div key={img.id} style={{ width: 120, position: "relative" }}>
                      <SecureDocument url={img.url} contentType={img.contentType} originalName={img.originalName} height={90} />
                      <button
                          type="button"
                          className="btn btn-sm"
                          disabled={busy}
                          onClick={() => removePhoto(img.id)}
                          style={{ position: "absolute", top: 4, right: 4, padding: "2px 6px", lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                <button className="btn btn-sm" disabled={busy || files.length === 0} onClick={uploadPhotos}>
                  Upload {files.length > 0 ? `${files.length} photo${files.length > 1 ? "s" : ""}` : "photos"}
                </button>
              </div>

              <h4 style={{ margin: "16px 0 6px" }}>Update repair result</h4>
              <div className="form-grid">
                <div className="field">
                  <label>Repair status</label>
                  <select value={result.repairStatus} onChange={(e) => setResult((r) => ({ ...r, repairStatus: e.target.value }))}>
                    {REPAIR_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Condition</label>
                  <select value={result.condition} onChange={(e) => setResult((r) => ({ ...r, condition: e.target.value }))}>
                    {CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Notes</label>
                  <textarea value={result.notes} onChange={(e) => setResult((r) => ({ ...r, notes: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary btn-sm" disabled={busy} onClick={updateResult}>
                  Update result
                </button>
                <button className="btn btn-sm" disabled={busy} onClick={saveNotes}>
                  Save notes only
                </button>
              </div>
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

function RecordInspectionModal({ onClose, onSaved }) {
  const [vehicles, setVehicles] = useState([]);
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
    repairRequired: false,
    resultingVehicleStatus: "",
    damageDescription: "",
    damageSeverity: "MINOR",
    estimatedRepairCost: "",
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
        .get("/fleet/vehicles", { size: 200 })
        .then((d) => setVehicles(d.content || []))
        .catch((e) => setError(e.message));
  }, []);

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
        repairRequired: form.repairRequired,
        resultingVehicleStatus: form.resultingVehicleStatus || null,
        damageReport: form.hasDamage
            ? {
              damageSeverity: form.damageSeverity,
              damageDescription: form.damageDescription,
              estimatedRepairCost: form.estimatedRepairCost ? Number(form.estimatedRepairCost) : 0,
              requiresImmediateRepair: form.damageSeverity === "SEVERE",
            }
            : null,
      };
      const created = await api.post("/inspections", payload);
      if (files.length > 0) {
        const fd = new FormData();
        for (const f of files) fd.append("images", f);
        await api.postForm(`/inspections/${created.id}/images`, fd);
      }
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
              <label>Vehicle</label>
              <select required value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
                <option value="">Select a vehicle…</option>
                {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.brand} {v.model}
                    </option>
                ))}
              </select>
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
            <div className="field">
              <label>Cleanliness</label>
              <select value={form.cleanliness} onChange={(e) => set("cleanliness", e.target.value)}>
                <option value="CLEAN">CLEAN</option>
                <option value="DIRTY">DIRTY</option>
              </select>
            </div>
            <div className="field">
              <label>Resulting vehicle status (post-rental)</label>
              <select value={form.resultingVehicleStatus} onChange={(e) => set("resultingVehicleStatus", e.target.value)}>
                <option value="">Automatic</option>
                {VEHICLE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
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

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.hasDamage} onChange={(e) => set("hasDamage", e.target.checked)} />
              Damage detected
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.repairRequired} onChange={(e) => set("repairRequired", e.target.checked)} />
              Repair required
            </label>
          </div>

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
                  <label>Estimated repair cost (LKR)</label>
                  <input type="number" step="0.01" min="0" value={form.estimatedRepairCost} onChange={(e) => set("estimatedRepairCost", e.target.value)} />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Damage description</label>
                  <textarea required={form.hasDamage} value={form.damageDescription} onChange={(e) => set("damageDescription", e.target.value)} />
                </div>
              </div>
          )}

          <div className="field" style={{ margin: "16px 0" }}>
            <label>Photos (optional)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </div>

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