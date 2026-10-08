import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, fmtDateTime } from "../../../components/ui";

export default function AuditLogTab() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 1 });
  const [actorEmail, setActorEmail] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/audit-logs", { actorEmail: actorEmail || undefined, action: action || undefined, page, size: 25 });
      setData(res);
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

  const rows = data.content || [];

  return (
    <Card title="Audit log">
      <ErrorBanner message={error} />
      <form onSubmit={search} className="form-grid" style={{ marginBottom: 18 }}>
        <div className="field">
          <label>Actor email</label>
          <input value={actorEmail} onChange={(e) => setActorEmail(e.target.value)} placeholder="filter by email" />
        </div>
        <div className="field">
          <label>Action</label>
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. USER_CREATED" />
        </div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <LoadingRow />
      ) : rows.length === 0 ? (
        <EmptyState>No audit entries found.</EmptyState>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDateTime(r.timestamp)}</td>
                    <td>{r.actorEmail || "system"}</td>
                    <td>{r.action}</td>
                    <td>
                      {r.entityType} #{r.entityId}
                    </td>
                    <td style={{ maxWidth: 360 }}>{r.details}</td>
                    <td>{r.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
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
        </>
      )}
    </Card>
  );
}
