import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import BookingCalendar from "../components/BookingCalendar";
import BookingModal from "../components/BookingModal";
import PersonCard from "../components/PersonCard";
import { useAuth } from "../context/AuthContext";
import { getBookingsForEquipment } from "../services/bookingService";
import { getEquipment, getLab } from "../services/labService";
import { getPeopleByIds, getPerson } from "../services/peopleService";
import {
  getTrainingRecordsForUser,
  type TrainingRecord,
} from "../services/trainingService";
import type { Booking, Equipment, Lab, Person } from "../types";

const PLACEHOLDER_IMAGE = `${import.meta.env.BASE_URL}equipment-placeholder.svg`;

export default function EquipmentDetailPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [lab, setLab] = useState<Lab | null>(null);
  const [owner, setOwner] = useState<Person | null>(null);
  const [trainers, setTrainers] = useState<Person[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReserve, setShowReserve] = useState(false);

  const refresh = useCallback(async () => {
    if (!equipmentId) return;
    const item = await getEquipment(equipmentId);
    if (!item) {
      setEquipment(null);
      setLoading(false);
      return;
    }
    const [labResult, ownerResult, trainerResults, records, bookingResults] =
      await Promise.all([
        item.labId ? getLab(item.labId) : Promise.resolve(undefined),
        item.ownerId ? getPerson(item.ownerId) : Promise.resolve(undefined),
        getPeopleByIds(item.trainerIds),
        user
          ? getTrainingRecordsForUser(user.id, item.trainingIds)
          : Promise.resolve([]),
        getBookingsForEquipment(item.id),
      ]);
    setEquipment(item);
    setLab(labResult ?? null);
    setOwner(ownerResult ?? null);
    setTrainers(trainerResults);
    setTrainingRecords(records);
    setBookings(bookingResults);
    setLoading(false);
  }, [equipmentId, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const backLink = lab ? `/labs/${lab.id}` : "/labs";
  const backLabel = lab ? `Back to ${lab.name}` : "Main menu";
  const outstandingTrainings = trainingRecords.filter((r) => !r.completed);

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page">
        <Link to={backLink} className="back-link">
          &larr; {backLabel}
        </Link>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : !equipment ? (
          <p className="muted">Item not found.</p>
        ) : (
          <>
            <section className="detail-hero">
              <img
                className="detail-image"
                src={equipment.imageUrl ?? PLACEHOLDER_IMAGE}
                alt={equipment.name}
              />
              <div className="detail-hero-info">
                <div className="equipment-title">
                  <h2>{equipment.name}</h2>
                  <span className={`badge badge-${equipment.category}`}>
                    {equipment.category}
                  </span>
                  {equipment.status === "maintenance" && (
                    <span className="badge badge-maintenance">
                      Under maintenance
                    </span>
                  )}
                </div>
                <p className="detail-lab">
                  {lab ? (
                    <>
                      Belongs to <Link to={`/labs/${lab.id}`}>{lab.name}</Link>
                    </>
                  ) : (
                    "Shared software - not tied to a single lab"
                  )}
                </p>
                <p className="detail-description">{equipment.description}</p>
              </div>
            </section>

            <section className="detail-section">
              <h3>Training required</h3>
              {trainingRecords.length === 0 ? (
                <p className="muted">
                  No training requirements recorded for this item yet.
                </p>
              ) : (
                <>
                  <ul className="training-list">
                    {trainingRecords.map((record) => (
                      <li key={record.training.id} className="training-row">
                        <div>
                          <strong>{record.training.name}</strong>
                          <p className="muted">{record.training.description}</p>
                        </div>
                        {record.completed ? (
                          <span className="badge badge-complete">
                            Completed
                          </span>
                        ) : (
                          <span className="badge badge-required">Required</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {outstandingTrainings.length > 0 && (
                    <p className="form-notice">
                      You still need {outstandingTrainings.length} training
                      {outstandingTrainings.length === 1 ? "" : "s"} for this
                      item. Contact a certified trainer below to get scheduled.
                    </p>
                  )}
                </>
              )}
            </section>

            <section className="detail-section">
              <h3>Owner and certified trainers</h3>
              {!owner && trainers.length === 0 ? (
                <p className="muted">
                  No owner or trainers assigned to this item yet.
                </p>
              ) : (
                <div className="people-grid">
                  {owner && <PersonCard person={owner} roleLabel="Owner" />}
                  {trainers.map((trainer) => (
                    <PersonCard
                      key={trainer.id}
                      person={trainer}
                      roleLabel="Certified trainer"
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="detail-section">
              <h3>User guide</h3>
              {equipment.userGuideUrl ? (
                <a
                  className="btn btn-outline"
                  href={equipment.userGuideUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open user guide
                </a>
              ) : (
                <p className="muted">No user guide uploaded for this item yet.</p>
              )}
            </section>

            <div className="detail-reserve">
              <button
                type="button"
                className="btn btn-primary btn-large"
                disabled={equipment.status !== "available"}
                onClick={() => setShowReserve(true)}
              >
                Reserve this {equipment.category}
              </button>
              {equipment.status !== "available" && (
                <p className="muted">
                  This item is under maintenance and cannot be reserved right
                  now.
                </p>
              )}
            </div>

            <section className="detail-section">
              <h3>Reservation calendar</h3>
              <p className="muted">
                Existing reservations for {equipment.name}.
              </p>
              <BookingCalendar bookings={bookings} />
            </section>
          </>
        )}
      </main>

      {showReserve && equipment && (
        <BookingModal
          equipment={equipment}
          onClose={() => setShowReserve(false)}
          onBooked={refresh}
        />
      )}
    </div>
  );
}
