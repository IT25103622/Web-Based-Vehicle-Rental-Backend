import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, StatCard, StatusPill, fmtDate } from "../../../components/ui";

export default function DashboardTab() {
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setDash(await api.get("/fleet/vehicles/dashboard"));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingRow />;
  if (error) return <ErrorBanner message={error} />;
  if (!dash) return null;

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Total Fleet" value={dash.totalVehicles} color="#9478ff" foot="Master records" />
        <StatCard label="Available" value={dash.availableVehicles} color="#33d69f" foot="Ready for booking" />
        <StatCard label="Reserved" value={dash.reservedVehicles} color="#4f8dff" foot="Pending handover" />
        <StatCard label="Rented" value={dash.rentedVehicles} color="#9478ff" foot="On the road" />
        <StatCard label="Maintenance" value={dash.maintenanceVehicles} color="#f5a623" foot="In workshop" />
        <StatCard label="Out of Service" value={dash.outOfServiceVehicles} color="#ff5470" foot="Unusable" />
        <StatCard label="Alerts" value={dash.documentsRequiringAttentionCount} color="#ff8a3d" foot="Renewals due" />
      </div>

      <Card title="Insurance & license renewal alerts">
        {!dash.alerts || dash.alerts.length === 0 ? (
          <EmptyState>Nothing needs renewal right now.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reg Number</th>
                  <th>Vehicle</th>
                  <th>Document Type</th>
                  <th>Policy / License No</th>
                  <th>Expiry Date</th>
                  <th>Days Remaining</th>
                </tr>
              </thead>
              <tbody>
                {dash.alerts.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{a.registrationNumber}</td>
                    <td>
                      {a.brand} {a.model}
                    </td>
                    <td>
                      <span className="pill" style={{ background: "rgba(255,255,255,0.06)" }}>
                        {a.documentType}
                      </span>
                    </td>
                    <td>{a.documentNumber}</td>
                    <td>{fmtDate(a.expiryDate)}</td>
                    <td>
                      <StatusPill value={a.alertSeverity === "EXPIRED" ? "EXPIRED" : "EXPIRING_SOON"} />{" "}
                      {a.daysRemaining >= 0 ? `${a.daysRemaining} days left` : "expired"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
