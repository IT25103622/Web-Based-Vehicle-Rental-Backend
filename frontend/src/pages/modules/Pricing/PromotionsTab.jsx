import { useEffect, useState } from "react";
import api from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { PermissionCodes } from "../../../constants/permissions";
import { Card, EmptyState, ErrorBanner, LoadingRow, Modal, StatCard, StatusPill, SuccessBanner, fmtDate, money } from "../../../components/ui";

const PROMO_TYPES = ["CATEGORY_DISCOUNT", "SEASONAL_OFFER", "FESTIVAL_OFFER", "FLASH_SALE", "WEEKEND_OFFER", "LONG_TERM_RENTAL"];
const STATUSES = ["ACTIVE", "INACTIVE", "EXPIRED"];

// Promotion images are stored as plain URL strings. Full http(s)/data URLs are
// used as-is; anything starting with "/" is treated as a path on our backend.
function resolveImage(url) {
  if (!url) return null;
  return /^(https?:|data:)/i.test(url) ? url : api.imageUrl(url.startsWith("/") ? url : `/${url}`);
}

function PromoImage({ url, alt, height = 120 }) {
  const [failed, setFailed] = useState(false);
  const src = resolveImage(url);
  if (!src || failed) return null;
  return (
      <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          style={{ height, width: "100%", objectFit: "cover", borderRadius: 10, display: "block" }}
      />
  );
}

export default function PromotionsTab({ canManage }) {
  const { hasPermission } = useAuth();
  const canViewAnalytics = hasPermission(PermissionCodes.VIEW_ANALYTICS);
  const [promotions, setPromotions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [promos, stats] = await Promise.all([api.get("/promotions"), canViewAnalytics ? api.get("/promotions/analytics").catch(() => null) : Promise.resolve(null)]);
      setPromotions(promos);
      setAnalytics(stats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(id) {
    try {
      await api.del(`/promotions/${id}`);
      setSuccess("Promotion deleted.");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
      <>
        {analytics && (
            <div className="stat-grid">
              <StatCard label="Total Promotions" value={analytics.totalPromotions} color="#9478ff" />
              <StatCard label="Active" value={analytics.activePromotions} color="#33d69f" />
              <StatCard label="Total Uses" value={analytics.totalUsageCount} color="#4f8dff" />
              <StatCard label="Total Discount Granted" value={money(analytics.totalDiscountGranted)} color="#ff8a3d" />


            </div>
        )}

        <Card
            title={`Promotions (${promotions.length})`}
            actions={
                canManage && (
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setEditing(null);
                          setShowForm(true);
                        }}
                    >
                      + New promotion
                    </button>
                )
            }
        >
          <ErrorBanner message={error} />
          <SuccessBanner message={success} />
          {loading ? (
              <LoadingRow />
          ) : promotions.length === 0 ? (
              <EmptyState>No promotions found.</EmptyState>
          ) : (
              <div className="card-grid">
                {promotions.map((p) => (
                    <div key={p.id} className="vehicle-card">
                      <PromoImage url={p.bannerImage || p.promotionImage} alt={p.promotionName} />
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <h4>{p.promotionName}</h4>
                        <StatusPill value={p.status} />
                      </div>




                      <div className="vehicle-meta">
                        <span>{p.promotionCode}</span>
                        <span>{p.promotionType?.replaceAll("_", " ")}</span>
                      </div>
                      <div className="vehicle-meta">
                        <span>Target: {p.vehicleCategory}</span>
                        <span>Min {p.minimumRentalDays} day(s)</span>
                      </div>
                      <div className="vehicle-price">{p.discountPercentage}% off</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                        {fmtDate(p.startDate)} → {fmtDate(p.endDate)}
                      </div>
                      {p.description && <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{p.description}</p>}
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                        Used {p.usageCount || 0}x · {money(p.totalDiscountGranted)} granted
                      </div>
                      {canManage && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                                className="btn btn-sm"
                                onClick={() => {
                                  setEditing(p);
                                  setShowForm(true);
                                }}
                            >
                              Edit
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => remove(p.id)}>
                              Delete
                            </button>
                          </div>
                      )}
                    </div>
                ))}
              </div>
          )}
        </Card>

        {showForm && (
            <PromoFormModal
                promo={editing}
                onClose={() => setShowForm(false)}
                onSaved={() => {
                  setShowForm(false);
                  setSuccess(editing ? "Promotion updated." : "Promotion created.");
                  load();
                }}
            />
        )}
      </>
  );
}



function PromoFormModal({ promo, onClose, onSaved }) {
  const [form, setForm] = useState(
      promo
          ? {
            promotionCode: promo.promotionCode,
            promotionName: promo.promotionName,
            promotionType: promo.promotionType,
            vehicleCategory: promo.vehicleCategory,
            discountPercentage: promo.discountPercentage,
            startDate: promo.startDate,
            endDate: promo.endDate,
            minimumRentalDays: promo.minimumRentalDays,
            status: promo.status,
            description: promo.description || "",
            promotionImage: promo.promotionImage || "",
            bannerImage: promo.bannerImage || "",
          }
          : {
            promotionCode: "",
            promotionName: "",
            promotionType: "SEASONAL_OFFER",
            vehicleCategory: "",
            discountPercentage: "",
            startDate: "",
            endDate: "",
            minimumRentalDays: 1,
            status: "ACTIVE",
            description: "",
            promotionImage: "",
            bannerImage: "",
          }
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
      const payload = { ...form, discountPercentage: Number(form.discountPercentage), minimumRentalDays: Number(form.minimumRentalDays) };
      if (promo) await api.put(`/promotions/${promo.id}`, payload);
      else await api.post("/promotions", payload);
      onSaved();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }




  return (
      <Modal title={promo ? "Edit promotion" : "New promotion"} onClose={onClose}>
        <ErrorBanner message={error} />
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Promotion code (optional)</label>
              <input value={form.promotionCode} onChange={(e) => set("promotionCode", e.target.value)} placeholder="Auto-generated if blank" />
            </div>
            <div className="field">
              <label>Promotion name</label>
              <input required value={form.promotionName} onChange={(e) => set("promotionName", e.target.value)} />
            </div>
            <div className="field">
              <label>Type</label>
              <select value={form.promotionType} onChange={(e) => set("promotionType", e.target.value)}>
                {PROMO_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll("_", " ")}
                    </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Vehicle category / brand target</label>
              <input required value={form.vehicleCategory} onChange={(e) => set("vehicleCategory", e.target.value)} placeholder="e.g. SUV, BMW" />
            </div>
            <div className="field">
              <label>Discount %</label>
              <input type="number" min="0" max="100" required value={form.discountPercentage} onChange={(e) => set("discountPercentage", e.target.value)} />
            </div>
            <div className="field">
              <label>Minimum rental days</label>
              <input type="number" min="1" value={form.minimumRentalDays} onChange={(e) => set("minimumRentalDays", e.target.value)} />
            </div>
            <div className="field">
              <label>Start date</label>
              <input type="date" required value={form.startDate?.slice?.(0, 10) || form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div className="field">
              <label>End date</label>
              <input type="date" required value={form.endDate?.slice?.(0, 10) || form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Promotion image URL (optional)</label>
              <input value={form.promotionImage} onChange={(e) => set("promotionImage", e.target.value)} placeholder="https://… or /path/image.jpg" />
              <PromoImage url={form.promotionImage} alt="Promotion" height={80} />
            </div>
            <div className="field">
              <label>Banner image URL (optional)</label>
              <input value={form.bannerImage} onChange={(e) => set("bannerImage", e.target.value)} placeholder="https://… or /path/banner.jpg" />
              <PromoImage url={form.bannerImage} alt="Banner" height={80} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save promotion"}
            </button>
          </div>
        </form>
      </Modal>
  );
}


