import { useEffect, useState } from "react";
import api from "../api/client";

// `url` is the relative path the backend returns (e.g. "/api/vehicle-images/5/content")
// or null/undefined if no image has been uploaded for this vehicle yet.
export function VehiclePhoto({ url, alt, height = 150 }) {
    if (!url) {
        return (
            <div
                style={{
                    height,
                    borderRadius: 10,
                    background: "var(--bg-panel)",
                    border: "1px dashed var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: 28,
                }}
                aria-label={alt || "No photo"}
            >
                🚗
            </div>
        );
    }
    return (
        <img
            src={api.imageUrl(url)}
            alt={alt || "Vehicle photo"}
            style={{ height, width: "100%", objectFit: "cover", borderRadius: 10, display: "block" }}
        />
    );
}

// Like VehiclePhoto, but for files behind an authenticated endpoint (e.g.
// verification documents, inspection photos) where a plain <img src> can't
// carry a Bearer token. Fetches the bytes once via api.getBlob() and renders
// an <img> for images or a "View PDF" link for anything else.
export function SecureDocument({ url, originalName, contentType, height = 90 }) {
    const [blobUrl, setBlobUrl] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let objectUrl;
        let cancelled = false;
        setError(false);
        setBlobUrl(null);
        api
            .getBlob(url)
            .then((blob) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
            })
            .catch(() => !cancelled && setError(true));
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [url]);

    const isImage = (contentType || "").startsWith("image/");

    if (error) {
        return <div style={{ fontSize: 12, color: "var(--accent-red, #ff5470)" }}>Could not load {originalName || "document"}</div>;
    }
    if (!blobUrl) {
        return (
            <div
                style={{
                    height,
                    borderRadius: 10,
                    background: "var(--bg-panel)",
                    border: "1px dashed var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: 12,
                }}
            >
                Loading…
            </div>
        );
    }
    if (isImage) {
        return (
            <img
                src={blobUrl}
                alt={originalName || "Document"}
                style={{ height, width: "100%", objectFit: "cover", borderRadius: 10, display: "block" }}
            />
        );
    }
    return (
        <a
            href={blobUrl}
            target="_blank"
            rel="noreferrer"
            style={{
                height,
                borderRadius: 10,
                background: "var(--bg-panel)",
                border: "1px dashed var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                textDecoration: "none",
            }}
        >
            📄 View PDF
        </a>
    );
}

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
    PENDING_VERIFICATION: { bg: "rgba(245,166,35,0.15)", fg: "#f5a623" },
    PENDING_APPROVAL: { bg: "rgba(79,141,255,0.15)", fg: "#4f8dff" },
    DEACTIVATED: { bg: "rgba(255,84,112,0.15)", fg: "#ff5470" },
    REQUIRED: { bg: "rgba(245,166,35,0.15)", fg: "#f5a623" },
    FIXED: { bg: "rgba(51,214,159,0.15)", fg: "#33d69f" },
    NOT_REQUIRED: { bg: "rgba(113,110,153,0.2)", fg: "#9f9cc2" },
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

const lkrFormatter = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function money(v) {
    if (v === null || v === undefined) return "—";
    // "LKR 12,345.00" — currencyDisplay: "code" avoids relying on a Rs.
    // glyph mapping that not every OS/browser font has for the LK locale.
    return lkrFormatter.format(Number(v));
}

export function fmtDate(v) {
    if (!v) return "—";
    return String(v).slice(0, 10);
}

export function fmtDateTime(v) {
    if (!v) return "—";
    return String(v).replace("T", " ").slice(0, 16);
}