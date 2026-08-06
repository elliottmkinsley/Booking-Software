import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import PersonCard from "../components/PersonCard";
import { useAuth } from "../context/AuthContext";
import { canRequestTrainings } from "../roles";
import { getEquipment } from "../services/labService";
import {
  getTrainingCatalogEntry,
  requestTrainingAccess,
  type TrainingCatalogEntry,
} from "../services/trainingService";
import { getTrainersByIds } from "../services/trainerService";
import type { Account, Equipment, Person } from "../types";
import { equipmentImage } from "../utils/images";

function accountAsPerson(account: Account): Person {
  return {
    id: account.id,
    name: account.displayName,
    title: `@${account.username}`,
    email: account.email,
  };
}

export default function TrainingDetailPage() {
  const { trainingId } = useParams<{ trainingId: string }>();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  // ?from=<equipmentId> sends the user back where they came from.
  const fromEquipmentId = searchParams.get("from");
  const [fromEquipment, setFromEquipment] = useState<Equipment | null>(null);
  const [entry, setEntry] = useState<TrainingCatalogEntry | null>(null);
  const [trainers, setTrainers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justRequested, setJustRequested] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !trainingId) return;
    const result = await getTrainingCatalogEntry(user.id, trainingId);
    if (!result) {
      setEntry(null);
      setLoading(false);
      return;
    }
    const trainerIds = Array.from(
      new Set(result.equipment.flatMap((item) => item.trainerIds))
    );
    const trainerAccounts = await getTrainersByIds(trainerIds);
    setEntry(result);
    setTrainers(trainerAccounts);
    setLoading(false);
  }, [user, trainingId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    if (!fromEquipmentId) {
      setFromEquipment(null);
      return;
    }
    getEquipment(fromEquipmentId).then((item) => {
      if (!cancelled) setFromEquipment(item ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [fromEquipmentId]);

  async function handleRequest(event: FormEvent) {
    event.preventDefault();
    if (!user || !entry) return;
    setSubmitting(true);
    setError("");
    try {
      await requestTrainingAccess(entry.training.id, message, user);
      setJustRequested(true);
      setMessage("");
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit access request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const howToSteps = (entry?.training.howToComplete ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const canRequest = canRequestTrainings(user);

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page">
        <Link
          to={
            fromEquipment ? `/equipment/${fromEquipment.id}` : "/trainings"
          }
          className="back-link"
        >
          &larr; {fromEquipment ? `Back to ${fromEquipment.name}` : "All trainings"}
        </Link>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : !entry ? (
          <p className="muted">Training not found.</p>
        ) : (
          <>
            <section className="detail-section training-detail-hero">
              <div className="section-heading-row">
                <h2>{entry.training.name}</h2>
                {entry.completed ? (
                  <span className="badge badge-complete">Completed</span>
                ) : (
                  <span className="badge badge-required">Not completed</span>
                )}
              </div>
              <p className="muted">{entry.training.description}</p>
              {entry.labs.length > 0 && (
                <p className="training-catalog-meta">
                  Related labs:{" "}
                  {entry.labs.map((lab, index) => (
                    <span key={lab.id}>
                      {index > 0 && ", "}
                      <Link to={`/labs/${lab.id}`}>{lab.name}</Link>
                    </span>
                  ))}
                </p>
              )}
            </section>

            <section className="detail-section">
              <h3>How to complete this training</h3>
              <ol className="training-howto-list">
                {howToSteps.map((step) => (
                  <li key={step}>{step.replace(/^\d+\.\s*/, "")}</li>
                ))}
              </ol>
            </section>

            <section className="detail-section">
              <h3>Equipment this unlocks</h3>
              {entry.equipment.length === 0 ? (
                <p className="muted">
                  No equipment currently requires this training.
                </p>
              ) : (
                <div className="card-grid">
                  {entry.equipment.map((item) => (
                    <Link
                      key={item.id}
                      to={`/equipment/${item.id}`}
                      className="media-card"
                    >
                      <img
                        className="media-card-image"
                        src={equipmentImage(item)}
                        alt={item.name}
                      />
                      <div className="media-card-body">
                        <h3>{item.name}</h3>
                        <div className="badge-row">
                          <span className={`badge badge-${item.category}`}>
                            {item.category}
                          </span>
                        </div>
                        <p>{item.description}</p>
                        <span className="media-card-meta">
                          View details &rarr;
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {(entry.owners.length > 0 || trainers.length > 0) && (
              <section className="detail-section">
                <h3>Owners and trainers</h3>
                <p className="muted">
                  Reach out to schedule the hands-on portion, then request
                  access from an admin below.
                </p>
                <div className="people-grid">
                  {entry.owners.map((owner) => (
                    <PersonCard
                      key={`owner-${owner.id}`}
                      person={owner}
                      roleLabel="Equipment owner"
                    />
                  ))}
                  {trainers.map((trainer) => (
                    <PersonCard
                      key={`trainer-${trainer.id}`}
                      person={accountAsPerson(trainer)}
                      roleLabel="Certified trainer"
                    />
                  ))}
                </div>
              </section>
            )}

            {canRequest && (
            <section className="detail-section">
              <h3>Request this training</h3>
              {entry.completed ? (
                <p className="muted">
                  You already have this training marked complete. No access
                  request is needed.
                </p>
              ) : entry.pendingRequest || justRequested ? (
                <p className="form-notice">
                  Your access request is pending admin review
                  {entry.pendingRequest?.createdAt
                    ? ` (submitted ${new Date(
                        entry.pendingRequest.createdAt
                      ).toLocaleString()})`
                    : ""}
                  . You will be able to reserve related equipment once it is
                  approved.
                </p>
              ) : (
                <>
                  <p className="muted">
                    After you finish the steps above, send a short request so an
                    admin can confirm your training and grant booking access.
                  </p>
                  <form onSubmit={handleRequest} className="add-equipment-form">
                    <label className="field">
                      <span>Message to admin (optional)</span>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. Completed UAS Flight Operations with Dr. Reyes on Monday."
                        rows={3}
                      />
                    </label>
                    {error && <p className="form-error">{error}</p>}
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Request training"}
                    </button>
                  </form>
                </>
              )}
            </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
