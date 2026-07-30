import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../roles";
import { emailForUser } from "../services/authService";
import { getBookingsForUser } from "../services/bookingService";
import { getEquipment } from "../services/labService";
import {
  getTrainingRecordsForUser,
  type TrainingRecord,
} from "../services/trainingService";
import type { Booking, Equipment } from "../types";
import { formatDateRange, todayIso } from "../utils/dates";

interface Reservation {
  booking: Booking;
  equipment: Equipment | undefined;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayIso();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      if (!user) return;
      const [bookings, records] = await Promise.all([
        getBookingsForUser(user.id),
        getTrainingRecordsForUser(user.id),
      ]);
      const withEquipment = await Promise.all(
        bookings.map(async (booking) => ({
          booking,
          equipment: await getEquipment(booking.equipmentId),
        }))
      );
      if (!cancelled) {
        setReservations(withEquipment);
        setTrainingRecords(records);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const completedCount = trainingRecords.filter((r) => r.completed).length;

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page">
        <Link to="/labs" className="back-link">
          &larr; Main menu
        </Link>

        <section className="profile-card">
          <div className="profile-avatar">
            {user.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="profile-identity">
            <h2>{user.username}</h2>
            <p className="muted">{emailForUser(user)}</p>
            <span className={`badge badge-role-${user.role}`}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </section>

        <section className="detail-section">
          <h3>My reservations</h3>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : reservations.length === 0 ? (
            <p className="muted">
              You have no reservations yet. Browse a lab to reserve equipment.
            </p>
          ) : (
            <ul className="equipment-list">
              {reservations.map(({ booking, equipment }) => (
                <li key={booking.id} className="equipment-row">
                  <div className="equipment-info">
                    <div className="equipment-title">
                      <h4>
                        {equipment ? (
                          <Link to={`/equipment/${equipment.id}`}>
                            {equipment.name}
                          </Link>
                        ) : (
                          "Removed item"
                        )}
                      </h4>
                      <span
                        className={
                          booking.endDate >= today
                            ? "badge badge-complete"
                            : "badge badge-past"
                        }
                      >
                        {booking.endDate >= today ? "Upcoming" : "Past"}
                      </span>
                    </div>
                    <p className="muted">
                      {formatDateRange(booking.startDate, booking.endDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-section">
          <h3>My trainings</h3>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : (
            <>
              <p className="muted">
                {completedCount} of {trainingRecords.length} trainings completed.
              </p>
              <ul className="training-list">
                {trainingRecords.map((record) => (
                  <li key={record.training.id} className="training-row">
                    <div>
                      <strong>{record.training.name}</strong>
                      <p className="muted">{record.training.description}</p>
                    </div>
                    {record.completed ? (
                      <span className="badge badge-complete">
                        Completed {record.completedDate}
                      </span>
                    ) : (
                      <span className="badge badge-required">Not started</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {user.role !== "user" && (
          <p className="form-notice">
            {ROLE_LABELS[user.role]} tools will appear here as those
            capabilities are added.
          </p>
        )}
      </main>
    </div>
  );
}
