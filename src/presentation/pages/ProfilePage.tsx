/**
 * Your profile: who you are, your reservations, and trainings you enrolled in.
 * Completions are split into incomplete vs completed so it is easy to see
 * what is still blocking a booking.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import TrainingEquipmentAccess from "../components/TrainingEquipmentAccess";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../../shared/roles";
import { emailForUser } from "../../business/auth";
import { getBookingsForUser } from "../../business/bookings";
import { getEquipment } from "../../business/labs";
import {
  getTrainingCatalog,
  type TrainingCatalogEntry,
} from "../../business/trainings";
import type { Booking, Equipment } from "../../shared/types";
import { todayIso } from "../../shared/utils/dates";
import { formatBookingWhen } from "../../shared/utils/timeSlots";

interface Reservation {
  booking: Booking;
  equipment: Equipment | undefined;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [trainings, setTrainings] = useState<TrainingCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayIso();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      if (!user) return;
      const [bookings, enrolled] = await Promise.all([
        getBookingsForUser(user.id),
        getTrainingCatalog(user.id, {
          enrolledOnly: true,
          sort: "incompleteFirst",
        }),
      ]);
      const withEquipment = await Promise.all(
        bookings.map(async (booking) => ({
          booking,
          equipment: await getEquipment(booking.equipmentId),
        }))
      );
      if (!cancelled) {
        setReservations(withEquipment);
        setTrainings(enrolled);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const incomplete = trainings.filter((entry) => !entry.completed);
  const completed = trainings.filter((entry) => entry.completed);

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
                    <p className="muted">{formatBookingWhen(booking)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-section">
          <div className="section-heading-row">
            <h3>My trainings</h3>
            <Link to="/trainings?view=yours" className="btn btn-outline">
              Open Your trainings
            </Link>
          </div>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : trainings.length === 0 ? (
            <p className="muted">
              No trainings added yet. Open equipment and click{" "}
              <strong>Add training</strong> to track what you need for access.
            </p>
          ) : (
            <>
              <p className="muted">
                {completed.length} of {trainings.length} completed. Each
                training lists the equipment it unlocks.
              </p>

              <h4 className="profile-training-subtitle">
                Incomplete ({incomplete.length})
              </h4>
              {incomplete.length === 0 ? (
                <p className="muted">Nothing incomplete right now.</p>
              ) : (
                <ul className="training-list profile-training-list">
                  {incomplete.map((entry) => (
                    <li key={entry.training.id} className="training-row training-row-stack">
                      <div className="training-row-top">
                        <div>
                          <strong>
                            <Link to={`/trainings/${entry.training.id}`}>
                              {entry.training.name}
                            </Link>
                          </strong>
                          <p className="muted">{entry.training.description}</p>
                        </div>
                        <span className="badge badge-required">Incomplete</span>
                      </div>
                      <TrainingEquipmentAccess
                        equipment={entry.equipment}
                        completed={false}
                      />
                    </li>
                  ))}
                </ul>
              )}

              <h4 className="profile-training-subtitle">
                Completed ({completed.length})
              </h4>
              {completed.length === 0 ? (
                <p className="muted">
                  Finished trainings and their equipment access will appear
                  here.
                </p>
              ) : (
                <ul className="training-list profile-training-list">
                  {completed.map((entry) => (
                    <li key={entry.training.id} className="training-row training-row-stack">
                      <div className="training-row-top">
                        <div>
                          <strong>
                            <Link to={`/trainings/${entry.training.id}`}>
                              {entry.training.name}
                            </Link>
                          </strong>
                          <p className="muted">{entry.training.description}</p>
                        </div>
                        <span className="badge badge-complete">
                          Completed
                          {entry.completedDate
                            ? ` ${entry.completedDate}`
                            : ""}
                        </span>
                      </div>
                      <TrainingEquipmentAccess
                        equipment={entry.equipment}
                        completed
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
