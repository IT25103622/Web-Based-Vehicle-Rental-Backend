import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PermissionCodes } from "../constants/permissions";

const TILES = [
  {
    to: "/access-control",
    icon: "🛡️",
    color: "#7c5cff",
    title: "Access Control & Security",
    desc: "User accounts, roles & permissions, MFA, audit log, and database backups.",
    perms: [PermissionCodes.VIEW_USERS, PermissionCodes.VIEW_ROLES, PermissionCodes.VIEW_AUDIT_LOG, PermissionCodes.VIEW_BACKUP_STATUS],
  },
  {
    to: "/fleet",
    icon: "🚗",
    color: "#4f8dff",
    title: "Fleet & Inspection",
    desc: "Vehicle inventory, operational status, renewal alerts, pre/post-rental inspections.",
    perms: [PermissionCodes.MANAGE_FLEET, PermissionCodes.INSPECT_VEHICLE],
  },
  {
    to: "/booking",
    icon: "📅",
    color: "#33d69f",
    title: "Booking",
    desc: "Browse the fleet, reserve a vehicle, and manage reservations.",
    perms: [],
  },
  {
    to: "/support",
    icon: "🎧",
    color: "#f5a623",
    title: "Support Tickets",
    desc: "Raise issues about a booking or vehicle and track resolution.",
    perms: [],
  },
  {
    to: "/pricing",
    icon: "💲",
    color: "#ff8a3d",
    title: "Pricing & Promotions",
    desc: "Discount rules, seasonal promotions, and live quote calculation.",
    perms: [],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, hasAnyPermission } = useAuth();

  const visibleTiles = TILES.filter((t) => t.perms.length === 0 || hasAnyPermission(t.perms));

  return (
    <div className="page">
      <div className="landing-hero">
        <h1>SLIIT Vehicle Rental Platform</h1>
        <p>
          {user
            ? `Welcome back, ${user.fullName.split(" ")[0]}. Jump into any module below.`
            : "A unified system for fleet management, bookings, support, pricing, and access control — built by Group 26."}
        </p>
      </div>

      <div className="module-grid">
        {visibleTiles.map((t) => (
          <div key={t.to} className="module-tile" onClick={() => navigate(t.to)} style={{ cursor: "pointer" }}>
            <div className="icon" style={{ background: `${t.color}22`, color: t.color }}>
              {t.icon}
            </div>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: t.color }}>Open module →</span>
          </div>
        ))}
      </div>

      {!user && (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Sign in to get started
          </button>
        </div>
      )}
    </div>
  );
}
