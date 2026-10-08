import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, StatCard, StatusPill, fmtDate, money } from "../../../components/ui";

const STATUSES = ["CONFIRMED", "MODIFIED", "CANCELLED"];

export default function ManageBookingsTab() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        api.get("/manager/stats").catch(() => null),
        api.get("/manager/bookings", { status: status || undefined }),
      ]);
      setStats(statsRes);
      setBookings(bookingsRes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <>
      {stats && (
        <div className="stat-grid">
          <StatCard label="Total Fleet" value={stats.totalVehicles} color="#9478ff" />
          <StatCard label="Available" value={stats.availableVehicles} color="#33d69f" />
          <StatCard label="Reserved" value={stats.reservedVehicles} color="#4f8dff" />
          <StatCard label="Needs Attention" value={stats.maintenanceVehicles} color="#f5a623" />
          <StatCard label="Active Bookings" value={stats.activeBookings} color="#33d69f" />
          <StatCard label="Cancelled" value={stats.cancelledBookings} color="#ff5470" />
          <StatCard label="Total Revenue" value={money(stats.totalRevenue)} color="#ff8a3d" />
        </div>
      )}

      <Card title={`All bookings (${bookings.length})`}>
        <ErrorBanner message={error} />
        <div className="field" style={{ maxWidth: 220, marginBottom: 16 }}>
          <label>Filter by status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingRow />
        ) : bookings.length === 0 ? (
          <EmptyState>No bookings found.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Dates</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.bookingId}>
                    <td>
                      {b.customerName}
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{b.customerEmail}</div>
                    </td>
                    <td>
                      {b.vehicleName} ({b.vehicleRegistration})
                    </td>
                    <td>
                      {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
                    </td>
                    <td>{money(b.totalAmount)}</td>
                    <td>
                      <StatusPill value={b.bookingStatus} />
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
