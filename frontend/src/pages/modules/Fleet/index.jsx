import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { PermissionCodes } from "../../../constants/permissions";
import { SubTabs } from "../../../components/ui";
import DashboardTab from "./DashboardTab";
import CatalogTab from "./CatalogTab";
import InspectionsTab from "./InspectionsTab";

const ALL_TABS = [
  { key: "dashboard", label: "Dashboard", perm: PermissionCodes.MANAGE_FLEET },
  { key: "catalog", label: "Vehicle Catalog", perm: PermissionCodes.MANAGE_FLEET },
  { key: "inspections", label: "Inspections", perm: PermissionCodes.INSPECT_VEHICLE },
];

export default function FleetModule() {
  const { hasPermission } = useAuth();
  const visibleTabs = ALL_TABS.filter((t) => hasPermission(t.perm));
  const [active, setActive] = useState(visibleTabs[0]?.key || "dashboard");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet & Inspection</h1>
          <p className="page-subtitle">Vehicle inventory, operational status, renewal alerts, and inspections.</p>
        </div>
      </div>

      {visibleTabs.length === 0 ? (
        <p className="page-subtitle">You don't have permission to view this module.</p>
      ) : (
        <>
          <SubTabs tabs={visibleTabs} active={active} onChange={setActive} />
          {active === "dashboard" && <DashboardTab />}
          {active === "catalog" && <CatalogTab />}
          {active === "inspections" && <InspectionsTab />}
        </>
      )}
    </div>
  );
}
