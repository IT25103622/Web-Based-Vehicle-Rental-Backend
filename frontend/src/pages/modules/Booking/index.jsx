import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { PermissionCodes } from "../../../constants/permissions";
import { SubTabs } from "../../../components/ui";
import BrowseTab from "./BrowseTab";
import MyBookingsTab from "./MyBookingsTab";
import ManageBookingsTab from "./ManageBookingsTab";

export default function BookingModule() {
  const { user, hasPermission } = useAuth();
  const isStaff = user && hasPermission(PermissionCodes.MANAGE_BOOKINGS);

  const tabs = [
    { key: "browse", label: "Browse & Book" },
    ...(user ? [{ key: "mine", label: "My Bookings" }] : []),
    ...(isStaff ? [{ key: "manage", label: "Manage Bookings" }] : []),
  ];
  const [active, setActive] = useState("browse");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Booking</h1>
          <p className="page-subtitle">Browse the fleet, reserve a vehicle, and manage reservations.</p>
        </div>
      </div>

      <SubTabs tabs={tabs} active={active} onChange={setActive} />
      {active === "browse" && <BrowseTab canBook={!!user} />}
      {active === "mine" && user && <MyBookingsTab />}
      {active === "manage" && isStaff && <ManageBookingsTab />}
    </div>
  );
}
