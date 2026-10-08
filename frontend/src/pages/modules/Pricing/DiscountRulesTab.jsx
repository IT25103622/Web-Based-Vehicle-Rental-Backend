import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, Modal, StatusPill, SuccessBanner } from "../../../components/ui";

const RULE_TYPES = ["BRAND_DEFAULT", "MEMBERSHIP_TIER", "DURATION_TIER", "CUSTOM"];

export default function DiscountRulesTab({ canManage }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRules(await api.get("/discounts"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    try {
      await api.del(`/discounts/${id}`);
      setSuccess("Rule deleted.");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Card
      title={`Discount rules (${rules.length})`}
      actions={
        canManage && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + New rule
          </button>
        )
      }
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {loading ? (
        <LoadingRow />
      ) : rules.length === 0 ? (
        <EmptyState>No discount rules configured.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule name</th>
                <th>Type</th>
                <th>Target</th>
                <th>Discount %</th>
                <th>Active</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.ruleName}
                    {r.description && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.description}</div>}
                  </td>
                  <td>{r.ruleType?.replaceAll("_", " ")}</td>
                  <td>{r.targetIdentifier}</td>
                  <td>{r.discountPercentage}%</td>
                  <td>
                    <StatusPill value={r.active ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  {canManage && (
                    <td style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          setEditing(r);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(r.id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <RuleFormModal
          rule={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setSuccess(editing ? "Rule updated." : "Rule created.");
            load();
          }}
        />
      )}
    </Card>
  );
}

function RuleFormModal({ rule, onClose, onSaved }) {
  const [form, setForm] = useState(
    rule
      ? { ruleName: rule.ruleName, ruleType: rule.ruleType, targetIdentifier: rule.targetIdentifier, discountPercentage: rule.discountPercentage, isActive: rule.active, description: rule.description || "" }
      : { ruleName: "", ruleType: "BRAND_DEFAULT", targetIdentifier: "", discountPercentage: "", isActive: true, description: "" }
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
      const payload = { ...form, discountPercentage: Number(form.discountPercentage) };
      if (rule) await api.put(`/discounts/${rule.id}`, payload);
      else await api.post("/discounts", payload);
      onSaved();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={rule ? "Edit discount rule" : "New discount rule"} onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label>Rule name</label>
            <input required value={form.ruleName} onChange={(e) => set("ruleName", e.target.value)} />
          </div>
          <div className="field">
            <label>Rule type</label>
            <select value={form.ruleType} onChange={(e) => set("ruleType", e.target.value)}>
              {RULE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Target identifier</label>
            <input required placeholder="e.g. BMW, GOLD, 7days" value={form.targetIdentifier} onChange={(e) => set("targetIdentifier", e.target.value)} />
          </div>
          <div className="field">
            <label>Discount %</label>
            <input type="number" min="0" max="100" required value={form.discountPercentage} onChange={(e) => set("discountPercentage", e.target.value)} />
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
              Active
            </label>
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Description (optional)</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save rule"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
