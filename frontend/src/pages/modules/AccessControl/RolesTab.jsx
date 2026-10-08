import { useEffect, useState } from "react";
import api from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { PermissionCodes } from "../../../constants/permissions";
import { Card, EmptyState, ErrorBanner, LoadingRow, SuccessBanner } from "../../../components/ui";

export default function RolesTab() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRoles(await api.get("/roles"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function togglePermLocal(roleId, permId) {
    setRoles((rs) =>
      rs.map((r) => (r.id !== roleId ? r : { ...r, permissions: r.permissions.map((p) => (p.id === permId ? { ...p, granted: !p.granted } : p)) }))
    );
  }

  async function saveRole(role) {
    setSaving(role.id);
    setError("");
    try {
      const permissionCodes = role.permissions.filter((p) => p.granted).map((p) => p.code);
      const updated = await api.put(`/roles/${role.id}/permissions`, { permissionCodes });
      setRoles((rs) => rs.map((r) => (r.id === role.id ? updated : r)));
      setSuccess(`Permissions updated for ${role.name}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  const canEdit = hasPermission(PermissionCodes.MANAGE_ROLE_PERMISSIONS);

  if (loading) return <LoadingRow />;
  if (roles.length === 0) return <EmptyState>No roles found.</EmptyState>;

  return (
    <>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {roles.map((role) => (
        <Card
          key={role.id}
          title={`${role.name?.replaceAll("_", " ")} — ${role.permissions?.filter((p) => p.granted).length || 0} permissions granted`}
          actions={
            canEdit && (
              <button className="btn btn-primary btn-sm" disabled={saving === role.id} onClick={() => saveRole(role)}>
                {saving === role.id ? "Saving…" : "Save changes"}
              </button>
            )
          }
        >
          {role.description && <p className="page-subtitle" style={{ marginTop: -6, marginBottom: 14 }}>{role.description}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {(role.permissions || []).map((p) => (
              <label key={p.id} className="checkbox-row" style={{ background: "var(--bg-panel)", padding: "10px 12px", borderRadius: 8 }}>
                <input type="checkbox" disabled={!canEdit} checked={!!p.granted} onChange={() => togglePermLocal(role.id, p.id)} />
                <span>
                  <strong style={{ fontSize: 12.5 }}>{p.code}</strong>
                  {p.description && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.description}</div>}
                </span>
              </label>
            ))}
          </div>
        </Card>
      ))}
    </>
  );
}
