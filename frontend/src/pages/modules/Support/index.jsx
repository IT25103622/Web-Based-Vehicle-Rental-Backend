import { useEffect, useState } from "react";
import api from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { PermissionCodes } from "../../../constants/permissions";
import { Card, EmptyState, ErrorBanner, LoadingRow, Modal, StatusPill, SuccessBanner, fmtDateTime } from "../../../components/ui";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export default function SupportModule() {
  const { user, hasPermission } = useAuth();
  const isStaff = hasPermission(PermissionCodes.MANAGE_SUPPORT_TICKETS);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setTickets(await api.get("/support-tickets"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function updateStatus(id, status) {
    try {
      await api.put(`/support-tickets/${id}/status?status=${status}`, {});
      setSuccess("Ticket status updated.");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">
            {isStaff ? "All customer support tickets across the platform." : "Raise an issue about a booking or vehicle and track its resolution."}
          </p>
        </div>
        {user && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + New ticket
            </button>
          </div>
        )}
      </div>

      {!user ? (
        <p className="page-subtitle">Sign in to view or raise support tickets.</p>
      ) : (
        <Card title={`${isStaff ? "All tickets" : "My tickets"} (${tickets.length})`}>
          <ErrorBanner message={error} />
          <SuccessBanner message={success} />
          {loading ? (
            <LoadingRow />
          ) : tickets.length === 0 ? (
            <EmptyState>No tickets yet.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {isStaff && <th>Customer</th>}
                    <th>Subject</th>
                    <th>Section</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Raised</th>
                    {isStaff && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.ticketId}>
                      {isStaff && <td>{t.customerName}</td>}
                      <td>
                        {t.subject}
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", maxWidth: 320 }}>{t.description}</div>
                      </td>
                      <td>{t.section || "—"}</td>
                      <td>
                        <StatusPill value={t.priority} />
                      </td>
                      <td>
                        <StatusPill value={t.status} />
                      </td>
                      <td>{fmtDateTime(t.dateIssued)}</td>
                      {isStaff && (
                        <td>
                          <select className="btn btn-sm" value="" onChange={(e) => e.target.value && updateStatus(t.ticketId, e.target.value)}>
                            <option value="">Change status…</option>
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {showForm && (
        <NewTicketModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            setSuccess("Ticket submitted.");
            load();
          }}
        />
      )}
    </div>
  );
}

function NewTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ subject: "", description: "", section: "", priority: "MEDIUM", bookingId: "", vehicleId: "" });
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
      await api.post("/support-tickets", {
        subject: form.subject,
        description: form.description,
        section: form.section || null,
        priority: form.priority,
        bookingId: form.bookingId ? Number(form.bookingId) : null,
        vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
      });
      onCreated();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Raise a support ticket" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Subject</label>
            <input required value={form.subject} onChange={(e) => set("subject", e.target.value)} />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Description</label>
            <textarea required value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="field">
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Section (optional)</label>
            <input value={form.section} onChange={(e) => set("section", e.target.value)} placeholder="e.g. Billing, Vehicle condition" />
          </div>
          <div className="field">
            <label>Related booking ID (optional)</label>
            <input type="number" value={form.bookingId} onChange={(e) => set("bookingId", e.target.value)} />
          </div>
          <div className="field">
            <label>Related vehicle ID (optional)</label>
            <input type="number" value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Submitting…" : "Submit ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
