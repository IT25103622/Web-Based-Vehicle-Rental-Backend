import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, SuccessBanner } from "../../../components/ui";

export default function SecuritySettingsTab() {
  const [settings, setSettings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/security-settings");
      setSettings(data);
      setDrafts(Object.fromEntries(data.map((s) => [s.key, s.value])));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(key) {
    setSaving(key);
    setError("");
    try {
      await api.put(`/security-settings/${key}`, { value: drafts[key] });
      setSuccess(`Updated ${key}.`);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <LoadingRow />;

  return (
    <Card title="Security settings">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {settings.length === 0 ? (
        <EmptyState>No configurable settings found.</EmptyState>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {settings.map((s) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--bg-panel)", padding: "12px 16px", borderRadius: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <strong style={{ fontSize: 13 }}>{s.key}</strong>
                {s.description && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.description}</div>}
              </div>
              <input
                value={drafts[s.key] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", width: 160 }}
              />
              <button className="btn btn-primary btn-sm" disabled={saving === s.key} onClick={() => save(s.key)}>
                {saving === s.key ? "Saving…" : "Save"}
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
