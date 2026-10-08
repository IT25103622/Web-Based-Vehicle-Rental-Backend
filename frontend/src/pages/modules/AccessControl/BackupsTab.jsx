import { useEffect, useState } from "react";
import api from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { PermissionCodes } from "../../../constants/permissions";
import { Card, EmptyState, ErrorBanner, LoadingRow, StatusPill, SuccessBanner, fmtDateTime } from "../../../components/ui";

export default function BackupsTab() {
  const { hasPermission } = useAuth();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [running, setRunning] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setBackups(await api.get("/backups", { limit: 20 }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runNow() {
    setRunning(true);
    setError("");
    try {
      await api.post("/backups/run", {});
      setSuccess("Backup triggered.");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card
      title="Backup history"
      actions={
        hasPermission(PermissionCodes.TRIGGER_MANUAL_BACKUP) && (
          <button className="btn btn-primary btn-sm" disabled={running} onClick={runNow}>
            {running ? "Running…" : "Run backup now"}
          </button>
        )
      }
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {loading ? (
        <LoadingRow />
      ) : backups.length === 0 ? (
        <EmptyState>No backups have run yet.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Completed</th>
                <th>Result</th>
                <th>File</th>
                <th>Size</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id}>
                  <td>{fmtDateTime(b.startedAt)}</td>
                  <td>{fmtDateTime(b.completedAt)}</td>
                  <td>
                    <StatusPill value={b.result === "SUCCESS" ? "AVAILABLE" : "OUT_OF_SERVICE"} />
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.filePath || "—"}</td>
                  <td>{b.fileSizeBytes ? `${(b.fileSizeBytes / 1024).toFixed(1)} KB` : "—"}</td>
                  <td style={{ color: "var(--accent-red)" }}>{b.errorMessage || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
