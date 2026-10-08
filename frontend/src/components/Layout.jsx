import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PermissionCodes } from "../constants/permissions";

const MODULES = [
  { to: "/access-control", label: "Access Control", icon: "🛡️", perms: [PermissionCodes.VIEW_USERS, PermissionCodes.VIEW_ROLES, PermissionCodes.VIEW_AUDIT_LOG, PermissionCodes.CONFIGURE_MFA, PermissionCodes.VIEW_BACKUP_STATUS] },
  { to: "/fleet", label: "Fleet & Inspection", icon: "🚗", perms: [PermissionCodes.MANAGE_FLEET, PermissionCodes.INSPECT_VEHICLE] },
  { to: "/booking", label: "Booking", icon: "📅", perms: [] }, // everyone (customers browse too)
  { to: "/support", label: "Support", icon: "🎧", perms: [] }, // everyone can view own tickets
  { to: "/pricing", label: "Pricing & Promotions", icon: "💲", perms: [] }, // public quote + staff management
];

export default function Layout() {
  const { user, logout, hasAnyPermission } = useAuth();
  const navigate = useNavigate();

  function doLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="topnav">
        <NavLink to="/" className="brand">
          <div className="brand-badge">🚙</div>
          <div className="brand-text">
            <div className="brand-title">SLIIT Vehicle Rental</div>
            <div className="brand-sub">Unified Platform</div>
          </div>
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Home
          </NavLink>
          {MODULES.filter((m) => m.perms.length === 0 || hasAnyPermission(m.perms)).map((m) => (
            <NavLink key={m.to} to={m.to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <span>{m.icon}</span> {m.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-right">
          {user ? (
            <>
              <div className="user-chip">
                <div className="name">{user.fullName}</div>
                <div className="role">{user.role?.replaceAll("_", " ")}</div>
              </div>
              <button className="btn" onClick={doLogout}>
                ⇥ Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary">
              Sign in
            </NavLink>
          )}
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </main>
    </div>
  );
}
