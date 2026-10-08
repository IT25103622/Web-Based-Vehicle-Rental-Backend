import { useEffect, useState } from "react";
import api from "../../../api/client";
import { Card, EmptyState, ErrorBanner, LoadingRow, StatusPill, SuccessBanner, fmtDate, money } from "../../../components/ui";

export default function MyBookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setBookings(await api.get("/bookings"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    try {
      await api.put(`/bookings/${id}/cancel`, {});
      setSuccess("Booking cancelled.");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Card title="My bookings">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {loading ? (
        <LoadingRow />
      ) : bookings.length === 0 ? (
        <EmptyState>You haven't made any bookings yet.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Dates</th>
                <th>Locations</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.bookingId}>
                  <td>
                    {b.vehicleName} <span style={{ color: "var(--text-muted)" }}>({b.vehicleRegistration})</span>
                  </td>
                  <td>
                    {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{b.rentalDays} day(s)</div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {b.pickupLocation} → {b.dropoffLocation}
                  </td>
                  <td>{money(b.totalAmount)}</td>
                  <td>
                    <StatusPill value={b.bookingStatus} />
                  </td>
                  <td>
                    {b.bookingStatus !== "CANCELLED" && (
                      <button className="btn btn-sm btn-danger" onClick={() => cancel(b.bookingId)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
