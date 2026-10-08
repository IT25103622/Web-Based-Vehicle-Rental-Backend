export function StatCard({ label, value, color = "var(--accent-purple-strong)", foot }) {
  return (
    <div className="stat-card">
      <div className="stat-label" style={{ color }}>
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  );
}

const STATUS_COLORS = {
  AVAILABLE: { bg: "rgba(51,214,159,0.15)", fg: "#33d69f" },
  RESERVED: { bg: "rgba(79,141,255,0.15)", fg: "#4f8dff" },
  RENTED: { bg: "rgba(124,92,255,0.18)", fg: "#9478ff" },
  MAINTENANCE: { bg: "rgba(245,166,35,0.15)", fg: "#f5a623" },
  OUT_OF_SERVICE: { bg: "rgba(255,84,112,0.15)", fg: "#ff5470" },
  CONFIRMED: { bg: "rgba(51,214,159,0.15)", fg: "#33d69f" },
  MODIFIED: { bg: "rgba(245,166,35,0.15)", fg: "#f5a623" },
  CANCELLED: { bg: "rgba(255,84,112,0.15)", fg: "#ff5470" },
  OPEN: { bg: "rgba(79,141,255,0.15)", fg: "#4f8dff" },
  IN_PROGRESS: { bg: "rgba(245,166,35,0.15)", fg: "#f5a623" },
  RESOLVED: { bg: "rgba(51,214,159,0.15)", fg: "#33d69f" },
  CLOSED: { bg: "rgba(113,110,153,0.2)", fg: "#9f9cc2" },
  ACTIVE: { bg: "rgba(51,214,159,0.15)", fg: "#33d69f" },
  INACTIVE: { bg: "rgba(113,110,153,0.2)", fg: "#9f9cc2" },
  EXPIRED: { bg: "rgba(255,84,112,0.15)", fg: "#ff5470" },
  EXPIRING_SOON: { bg: "rgba(245,166,35,0.15)", fg: "#f5a623" },
  VALID: { bg: "rgba(51,214,159,0.15)", fg: "#33d69f" },
  HIGH: { bg: "rgba(255,84,112,0.15)", fg: "#ff5470" },
  MEDIUM: { bg: "rgba(245,166,35,0.15)", fg: "#f5a623" },
  LOW: { bg: "rgba(79,141,255,0.15)", fg: "#4f8dff" },
  EXCELLENT: { bg: "rgba(51,214,159,0.15)", fg: "#33d69f" },
  GOOD: { bg: "rgba(79,141,255,0.15)", fg: "#4f8dff" },
  FAIR: { bg: "rgba(245,166,35,0.15)", fg: "#f5a623" },
  POOR: { bg: "rgba(255,84,112,0.15)", fg: "#ff5470" },
};

export function StatusPill({ value }) {
  if (!value) return <span className="pill">—</span>;
  const colors = STATUS_COLORS[value] || { bg: "rgba(124,92,255,0.15)", fg: "#9478ff" };
  return (
    <span className="pill" style={{ background: colors.bg, color: colors.fg }}>
      {String(value).replaceAll("_", " ")}
    </span>
  );
}

export function Card({ title, actions, children }) {
  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h3>{title}</h3>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}

export function SubTabs({ tabs, active, onChange }) {
  return (
    <div className="subtabs">
      {tabs.map((t) => (
        <div key={t.key} className={`subtab ${active === t.key ? "active" : ""}`} onClick={() => onChange(t.key)}>
          {t.label}
        </div>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}

export function LoadingRow({ children = "Loading…" }) {
  return <div className="loading-row">{children}</div>;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="error-banner">{message}</div>;
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return <div className="success-banner">{message}</div>;
}

export function money(v) {
  if (v === null || v === undefined) return "—";
  return `$${Number(v).toFixed(2)}`;
}

export function fmtDate(v) {
  if (!v) return "—";
  return String(v).slice(0, 10);
}

export function fmtDateTime(v) {
  if (!v) return "—";
  return String(v).replace("T", " ").slice(0, 16);
}
