import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { PermissionCodes } from "../../../constants/permissions";
import { SubTabs } from "../../../components/ui";
import UsersTab from "./UsersTab";
import RolesTab from "./RolesTab";
import AuditLogTab from "./AuditLogTab";
import SecuritySettingsTab from "./SecuritySettingsTab";
import BackupsTab from "./BackupsTab";

const ALL_TABS = [
  { key: "users", label: "Users", perm: PermissionCodes.VIEW_USERS },
  { key: "roles", label: "Roles & Permissions", perm: PermissionCodes.VIEW_ROLES },
  { key: "audit", label: "Audit Log", perm: PermissionCodes.VIEW_AUDIT_LOG },
  { key: "security", label: "Security Settings", perm: PermissionCodes.CONFIGURE_MFA },
  { key: "backups", label: "Backups", perm: PermissionCodes.VIEW_BACKUP_STATUS },
];

export default function AccessControlModule() {
  const { hasPermission } = useAuth();
  const visibleTabs = ALL_TABS.filter((t) => hasPermission(t.perm));
  const [active, setActive] = useState(visibleTabs[0]?.key || "users");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Access Control & Security</h1>
          <p className="page-subtitle">User accounts, role-based permissions, MFA, audit trail, and backups.</p>
        </div>
      </div>

      {visibleTabs.length === 0 ? (
        <p className="page-subtitle">You don't have permission to view this module.</p>
      ) : (
        <>
          <SubTabs tabs={visibleTabs} active={active} onChange={setActive} />
          {active === "users" && <UsersTab />}
          {active === "roles" && <RolesTab />}
          {active === "audit" && <AuditLogTab />}
          {active === "security" && <SecuritySettingsTab />}
          {active === "backups" && <BackupsTab />}
        </>
      )}
    </div>
  );
}
