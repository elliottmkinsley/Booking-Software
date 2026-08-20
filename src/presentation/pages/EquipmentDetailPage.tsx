/**
 * Detail page for one instrument or software license.
 *
 * Equipment shows a booking calendar, required trainings, owner, and trainers.
 * Software skips the calendar and shows download / access / contact instead.
 * Managers can change which trainings and trainers are attached.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import BookingCalendar from "../components/BookingCalendar";
import BookingModal from "../components/BookingModal";
import ConsumablesPanel from "../components/ConsumablesPanel";
import PersonCard from "../components/PersonCard";
import { useAuth } from "../context/AuthContext";
import { canRequestTrainings } from "../../shared/roles";
import { getBookingsForEquipment } from "../../business/bookings";
import {
  getEquipment,
  getLab,
  setEquipmentTrainers,
  setEquipmentTrainings,
} from "../../business/labs";
import { getPerson } from "../../business/people";
import { canSetEquipmentTrainings } from "../../business/permissions";
import {
  addTrainingsFromEquipment,
  areEquipmentTrainingsEnrolled,
  getAllTrainings,
  getTrainingRecordsForUser,
  type TrainingRecord,
} from "../../business/trainings";
import { getTrainers, getTrainersByIds } from "../../business/trainers";
import type { Account, Booking, Equipment, Lab, Person, Training } from "../../shared/types";
import { accountAsPerson } from "../../shared/utils/identity";
import { equipmentImage } from "../../shared/utils/images";
import { RENTAL_GRANULARITY_LABELS } from "../../shared/utils/rental";

export default function EquipmentDetailPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [lab, setLab] = useState<Lab | null>(null);
  const [owner, setOwner] = useState<Person | null>(null);
  const [trainers, setTrainers] = useState<Account[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [canEditTrainings, setCanEditTrainings] = useState(false);
  const [allEnrolled, setAllEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState("");
  const [catalog, setCatalog] = useState<Training[]>([]);
  const [trainerCatalog, setTrainerCatalog] = useState<Account[]>([]);
  const [editingTrainings, setEditingTrainings] = useState(false);
  const [editingTrainers, setEditingTrainers] = useState(false);
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<string[]>([]);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReserve, setShowReserve] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!equipmentId) return;
    const item = await getEquipment(equipmentId);
    if (!item) {
      setEquipment(null);
      setLoading(false);
      return;
    }
    const [
      labResult,
      ownerResult,
      trainerResults,
      records,
      bookingResults,
      allowed,
      enrolled,
    ] = await Promise.all([
      item.labId ? getLab(item.labId) : Promise.resolve(undefined),
      item.ownerId ? getPerson(item.ownerId) : Promise.resolve(undefined),
      getTrainersByIds(item.trainerIds),
      user
        ? getTrainingRecordsForUser(user.id, item.trainingIds)
        : Promise.resolve([]),
      getBookingsForEquipment(item.id),
      canSetEquipmentTrainings(user, item.labId),
      user
        ? areEquipmentTrainingsEnrolled(user.id, item.id)
        : Promise.resolve(false),
    ]);
    setEquipment(item);
    setLab(labResult ?? null);
    setOwner(ownerResult ?? null);
    setTrainers(trainerResults);
    setTrainingRecords(records);
    setBookings(bookingResults);
    setCanEditTrainings(allowed);
    setAllEnrolled(enrolled);
    setSelectedTrainingIds([...item.trainingIds]);
    setSelectedTrainerIds([...item.trainerIds]);
    setLoading(false);
  }, [equipmentId, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!editingTrainings) return;
    let cancelled = false;
    getAllTrainings().then((trainings) => {
      if (!cancelled) setCatalog(trainings);
    });
    return () => {
      cancelled = true;
    };
  }, [editingTrainings]);

  useEffect(() => {
    if (!editingTrainers) return;
    let cancelled = false;
    getTrainers().then((list) => {
      if (!cancelled) setTrainerCatalog(list);
    });
    return () => {
      cancelled = true;
    };
  }, [editingTrainers]);

  function toggleTraining(trainingId: string) {
    setSelectedTrainingIds((current) =>
      current.includes(trainingId)
        ? current.filter((id) => id !== trainingId)
        : [...current, trainingId]
    );
  }

  function toggleTrainer(accountId: string) {
    setSelectedTrainerIds((current) =>
      current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId]
    );
  }

  async function handleSaveTrainings() {
    if (!user || !equipment) return;
    setSaving(true);
    setSaveError("");
    try {
      await setEquipmentTrainings(equipment.id, selectedTrainingIds, user);
      setEditingTrainings(false);
      await refresh();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save training requirements."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTrainers() {
    if (!user || !equipment) return;
    setSaving(true);
    setSaveError("");
    try {
      await setEquipmentTrainers(equipment.id, selectedTrainerIds, user);
      setEditingTrainers(false);
      await refresh();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save trainers."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTrainings() {
    if (!user || !equipment) return;
    setEnrolling(true);
    setEnrollMessage("");
    try {
      const result = await addTrainingsFromEquipment(equipment.id, user);
      if (result.added.length === 0) {
        setEnrollMessage("These trainings are already in Your trainings.");
      } else {
        setEnrollMessage(
          `Added ${result.added.length} training${result.added.length === 1 ? "" : "s"} to Your trainings.`
        );
      }
      await refresh();
    } catch (err) {
      setEnrollMessage(
        err instanceof Error ? err.message : "Could not add trainings."
      );
    } finally {
      setEnrolling(false);
    }
  }

  const backLink = lab ? `/labs/${lab.id}` : "/labs";
  const backLabel = lab ? `Back to ${lab.name}` : "Main menu";
  const isSoftware = equipment?.category === "software";
  const canRequestTraining = canRequestTrainings(user);
  const outstandingTrainings = trainingRecords.filter((r) => !r.completed);
  const canReserve =
    !isSoftware &&
    equipment?.status === "available" &&
    outstandingTrainings.length === 0;

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
                src={equipmentImage(equipment)}
                alt={equipment.name}
              />
              <div className="detail-hero-info">
                <div className="equipment-title">
                  <h2>{equipment.name}</h2>
                  <span className={`badge badge-${equipment.category}`}>
                    {equipment.category}
                  </span>
                  {!isSoftware && (
                    <span className="badge badge-rental">
                      {RENTAL_GRANULARITY_LABELS[equipment.rentalGranularity]}
                    </span>
                  )}
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
                    "Shared software — no reservation needed"
                  )}
                </p>
                <p className="detail-description">{equipment.description}</p>
              </div>
            </section>

            {isSoftware ? (
              <>
                <section className="detail-section">
                  <h3>How to get this software</h3>
                  {equipment.accessInstructions ? (
                    <p className="detail-description">
                      {equipment.accessInstructions}
                    </p>
                  ) : (
                    <p className="muted">
                      No access instructions posted yet. Use the contact below
                      or check the download link when available.
                    </p>
                  )}
                  {equipment.downloadUrl && (
                    <a
                      className="btn btn-primary"
                      href={equipment.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open download / portal
                    </a>
                  )}
                </section>

                <section className="detail-section">
                  <h3>Who to contact</h3>
                  {equipment.contactName || equipment.contactEmail ? (
                    <div className="people-grid">
                      <div className="person-card">
                        <span className="person-role">Software contact</span>
                        <strong className="person-name">
                          {equipment.contactName || "Software contact"}
                        </strong>
                        {equipment.contactEmail && (
                          <>
                            <span className="muted person-title">
                              {equipment.contactEmail}
                            </span>
                            <a
                              className="btn btn-outline btn-small"
                              href={`mailto:${equipment.contactEmail}`}
                            >
                              Email
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="muted">
                      No contact listed yet. Ask a lab manager or admin for
                      access help.
                    </p>
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
                    <p className="muted">
                      No user guide uploaded for this software yet.
                    </p>
                  )}
                </section>
              </>
            ) : (
              <>
            <section className="detail-section">
              <div className="section-heading-row">
                <h3>Training required</h3>
                <div className="section-heading-actions">
                  {user &&
                    equipment.trainingIds.length > 0 &&
                    !editingTrainings && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={enrolling || allEnrolled}
                        onClick={handleAddTrainings}
                      >
                        {allEnrolled
                          ? "In Your trainings"
                          : enrolling
                            ? "Adding..."
                            : "Add training"}
                      </button>
                    )}
                  {canEditTrainings && !editingTrainings && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setSelectedTrainingIds([...equipment.trainingIds]);
                        setEditingTrainings(true);
                        setSaveError("");
                      }}
                    >
                      Edit requirements
                    </button>
                  )}
                </div>
              </div>
              {enrollMessage && (
                <p className="form-notice">
                  {enrollMessage}{" "}
                  <Link to="/trainings?view=yours">Go to Your trainings</Link>
                </p>
              )}

              {editingTrainings ? (
                <>
                  <fieldset className="training-require-list">
                    <legend>Select trainings required to book</legend>
                    {catalog.length === 0 ? (
                      <p className="muted">
                        No trainings in the catalog yet. Ask an admin to add
                        trainings first.
                      </p>
                    ) : (
                      catalog.map((training) => (
                        <label key={training.id} className="checkbox-field">
                          <input
                            type="checkbox"
                            checked={selectedTrainingIds.includes(training.id)}
                            onChange={() => toggleTraining(training.id)}
                          />
                          <span>
                            <strong>{training.name}</strong>
                            {training.description && (
                              <small>{training.description}</small>
                            )}
                          </span>
                        </label>
                      ))
                    )}
                  </fieldset>
                  {saveError && <p className="form-error">{saveError}</p>}
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={saving}
                      onClick={handleSaveTrainings}
                    >
                      {saving ? "Saving..." : "Save requirements"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={saving}
                      onClick={() => {
                        setEditingTrainings(false);
                        setSelectedTrainingIds([...equipment.trainingIds]);
                        setSaveError("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : trainingRecords.length === 0 ? (
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
                        <div className="training-row-actions">
                          {record.completed ? (
                            <span className="badge badge-complete">
                              Completed
                            </span>
                          ) : (
                            <span className="badge badge-required">
                              Required
                            </span>
                          )}
                          {canRequestTraining && (
                            <Link
                              to={`/trainings/${record.training.id}?from=${equipment.id}`}
                              className="btn btn-outline btn-small"
                            >
                              {record.completed
                                ? "View training"
                                : "Request training"}
                            </Link>
                          )}
                        </div>
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

            <ConsumablesPanel
              labId={equipment.labId}
              equipmentId={equipment.id}
              canManage={canEditTrainings}
              title="Equipment consumables"
            />

            <section className="detail-section">
              <div className="section-heading-row">
                <h3>Owner and certified trainers</h3>
                {canEditTrainings && !editingTrainers && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setSelectedTrainerIds([...equipment.trainerIds]);
                      setEditingTrainers(true);
                      setSaveError("");
                    }}
                  >
                    Edit trainers
                  </button>
                )}
              </div>

              {editingTrainers ? (
                <>
                  <fieldset className="training-require-list">
                    <legend>Select trainers for this item</legend>
                    {trainerCatalog.length === 0 ? (
                      <p className="muted">
                        No trainers in the directory yet. Add trainers from the
                        Trainers menu in the header first.
                      </p>
                    ) : (
                      trainerCatalog.map((account) => (
                        <label key={account.id} className="checkbox-field">
                          <input
                            type="checkbox"
                            checked={selectedTrainerIds.includes(account.id)}
                            onChange={() => toggleTrainer(account.id)}
                          />
                          <span>
                            <strong>{account.displayName}</strong>
                            <small>
                              @{account.username} &middot; {account.email}
                            </small>
                          </span>
                        </label>
                      ))
                    )}
                  </fieldset>
                  {saveError && <p className="form-error">{saveError}</p>}
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={saving}
                      onClick={handleSaveTrainers}
                    >
                      {saving ? "Saving..." : "Save trainers"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={saving}
                      onClick={() => {
                        setEditingTrainers(false);
                        setSelectedTrainerIds([...equipment.trainerIds]);
                        setSaveError("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : !owner && trainers.length === 0 ? (
                <p className="muted">
                  No owner or trainers assigned to this item yet.
                </p>
              ) : (
                <div className="people-grid">
                  {owner && <PersonCard person={owner} roleLabel="Owner" />}
                  {trainers.map((trainer) => (
                    <PersonCard
                      key={trainer.id}
                      person={accountAsPerson(trainer)}
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
                disabled={!canReserve}
                onClick={() => setShowReserve(true)}
              >
                Reserve this {equipment.category}
              </button>
              {equipment.status !== "available" ? (
                <p className="muted">
                  This item is under maintenance and cannot be reserved right
                  now.
                </p>
              ) : outstandingTrainings.length > 0 ? (
                <p className="muted">
                  Complete the required trainings above before reserving.
                </p>
              ) : null}
            </div>

            <section className="detail-section">
              <h3>Reservation calendar</h3>
              <p className="muted">
                Existing reservations for {equipment.name}.
              </p>
              <BookingCalendar
                bookings={bookings}
                selectedDates={selectedDates}
                onToggleDate={(date) =>
                  setSelectedDates((current) =>
                    current.includes(date)
                      ? current.filter((entry) => entry !== date)
                      : [...current, date]
                  )
                }
                onClearDates={() => setSelectedDates([])}
                canReserve={canReserve}
                onReserveSelected={() => setShowReserve(true)}
              />
            </section>
              </>
            )}
          </>
        )}
      </main>

      {showReserve && equipment && !isSoftware && (
        <BookingModal
          equipment={equipment}
          initialDates={selectedDates}
          onClose={() => setShowReserve(false)}
          onBooked={() => {
            setSelectedDates([]);
            refresh();
          }}
        />
      )}
    </div>
  );
}
