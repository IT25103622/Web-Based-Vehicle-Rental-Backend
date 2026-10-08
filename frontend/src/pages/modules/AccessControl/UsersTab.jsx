import { useEffect, useState } from "react";
import api from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { PermissionCodes, RoleNames } from "../../../constants/permissions";
import { Card, EmptyState, ErrorBanner, LoadingRow, Modal, StatusPill, SuccessBanner, fmtDateTime } from "../../../components/ui";

export default function UsersTab() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/users");
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(u) {
    try {
      const action = u.status === "ACTIVE" ? "deactivate" : "reactivate";
      await api.patch(`/users/${u.id}/${action}`);
      setSuccess(`User ${action}d.`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function resetPassword(u) {
    try {
      await api.post(`/users/${u.id}/reset-password`, {});
      setSuccess(`Password reset for ${u.email}. A temporary password has been issued.`);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Card
      title={`Users (${users.length})`}
      actions={
        hasPermission(PermissionCodes.CREATE_USER) && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            + New user
          </button>
        )
      }
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {loading ? (
        <LoadingRow />
      ) : users.length === 0 ? (
        <EmptyState>No users found.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>MFA</th>
                <th>Last Login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.role?.replaceAll("_", " ")}</td>
                  <td>
                    <StatusPill value={u.status === "ACTIVE" ? "AVAILABLE" : "OUT_OF_SERVICE"} />
                  </td>
                  <td>{u.mfaEnabled ? "✅" : "—"}</td>
                  <td>{fmtDateTime(u.lastLoginAt)}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    {hasPermission(PermissionCodes.DEACTIVATE_USER) && (
                      <button className="btn btn-sm" onClick={() => toggleActive(u)}>
                        {u.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                      </button>
                    )}
                    {hasPermission(PermissionCodes.RESET_USER_PASSWORD) && (
                      <button className="btn btn-sm" onClick={() => resetPassword(u)}>
                        Reset PW
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setSuccess("User created.");
            load();
          }}
        />
      )}
    </Card>
  );
}

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", role: "JUNIOR_EMPLOYEE", initialPassword: "", mfaEnabled: false });
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
      await api.post("/users", form);
      onCreated();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create user" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label>Full name</label>
            <input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={(e) => set("role", e.target.value)}>
              {RoleNames.map((r) => (
                <option key={r} value={r}>
                  {r.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Initial password (optional)</label>
            <input type="password" value={form.initialPassword} onChange={(e) => set("initialPassword", e.target.value)} placeholder="Auto-generated if blank" />
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.mfaEnabled} onChange={(e) => set("mfaEnabled", e.target.checked)} />
              Enable MFA for this user
            </label>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
