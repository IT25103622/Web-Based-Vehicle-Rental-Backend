import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, ErrorBanner, money } from "../../../components/ui";

export default function QuoteTab() {
  return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        <DiscountCalculator />
        <PromotionEvaluator />
      </div>
  );
}

function DiscountCalculator() {
  const [form, setForm] = useState({ dailyPrice: "", rentalDays: "", brand: "", membershipTier: "", manualDiscountPercentage: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = {
        dailyPrice: Number(form.dailyPrice),
        rentalDays: form.rentalDays ? Number(form.rentalDays) : undefined,
        brand: form.brand || undefined,
        membershipTier: form.membershipTier || undefined,
        manualDiscountPercentage: form.manualDiscountPercentage ? Number(form.manualDiscountPercentage) : undefined,
      };
      setResult(await api.post("/discounts/calculate", payload));
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }


  return (
      <Card title="Discount calculator">
        <ErrorBanner message={error} />
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Daily price</label>
              <input type="number" step="0.01" min="0" required value={form.dailyPrice} onChange={(e) => set("dailyPrice", e.target.value)} />
            </div>
            <div className="field">
              <label>Rental days</label>
              <input type="number" min="1" value={form.rentalDays} onChange={(e) => set("rentalDays", e.target.value)} />
            </div>
            <div className="field">
              <label>Brand (optional)</label>
              <input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="BMW, Toyota…" />
            </div>
            <div className="field">
              <label>Membership tier (optional)</label>
              <select value={form.membershipTier} onChange={(e) => set("membershipTier", e.target.value)}>
                <option value="">None</option>
                <option value="SILVER">SILVER</option>
                <option value="GOLD">GOLD</option>
                <option value="PLATINUM">PLATINUM</option>
              </select>
            </div>
            <div className="field">
              <label>Manual override % (optional)</label>
              <input type="number" min="0" max="100" value={form.manualDiscountPercentage} onChange={(e) => set("manualDiscountPercentage", e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? "Calculating…" : "Calculate"}
          </button>
        </form>

        {result && (
            <div style={{ marginTop: 18, background: "var(--bg-panel)", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Original amount</span>
                <strong>{money(result.originalAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Discount ({result.effectiveDiscountPercentage}%)</span>
                <strong style={{ color: "var(--accent-green)" }}>-{money(result.discountAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
                <span>Final amount</span>
                <strong style={{ color: "var(--accent-purple-strong)" }}>{money(result.finalAmount)}</strong>
              </div>
              {result.appliedRules?.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                    Rule applied: {result.appliedRules.map((r) => `${r.ruleName} (${r.discountPercentage}%)`).join(", ")}
                  </div>
              )}
            </div>
        )}
      </Card>
  );
}


function PromotionEvaluator() {
  const [form, setForm] = useState({ vehicleId: "", pickupDate: "", returnDate: "" });
  const [vehicles, setVehicles] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
        .get("/vehicles/search")
        .then((list) => setVehicles(Array.isArray(list) ? list : []))
        .catch(() => setVehicles([]));
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(
          await api.post("/promotions/evaluate", {
            vehicleId: Number(form.vehicleId),
            pickupDate: form.pickupDate,
            returnDate: form.returnDate,
          })
      );
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
      <Card title="Promotion evaluator">
        <ErrorBanner message={error} />
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Vehicle</label>
              <select required value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
                <option value="">Select a vehicle…</option>
                {vehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      {v.brand} {v.model} — {money(v.rentalRate)}/day
                    </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Pickup date</label>
              <input type="date" required value={form.pickupDate} onChange={(e) => set("pickupDate", e.target.value)} />
            </div>
            <div className="field">
              <label>Return date</label>
              <input type="date" required value={form.returnDate} onChange={(e) => set("returnDate", e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? "Evaluating…" : "Evaluate best promotion"}
          </button>
        </form>

        {result && (
            <div style={{ marginTop: 18, background: "var(--bg-panel)", borderRadius: 10, padding: 16 }}>
              {result.appliedPromotion ? (
                  <>
                    <strong>{result.appliedPromotion.promotionName}</strong>
                    <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{result.savingsMessage}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span>Original amount</span>
                      <strong>{money(result.originalAmount)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span>Discount ({result.discountPercentage}%)</span>
                      <strong style={{ color: "var(--accent-green)" }}>-{money(result.discountAmount)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
                      <span>Final amount</span>
                      <strong style={{ color: "var(--accent-purple-strong)" }}>{money(result.finalAmount)}</strong>
                    </div>
                  </>
              ) : (
                  <p style={{ color: "var(--text-muted)", margin: 0 }}>{result.savingsMessage || "No active promotion applies to this booking."}</p>
              )}
            </div>
        )}
      </Card>
  );
}

