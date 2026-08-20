/**
 * Approve / deny training access requests (Trainings page → Requests tab).
 * Each card lists related equipment, labs, trainers, and lab managers so the
 * reviewer can email someone if they need more context.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  approveTrainingRequest,
  denyTrainingRequest,
  getTrainingRequestReviews,
  type TrainingRequestReview,
} from "../../business/trainings";
import type { Account } from "../../shared/types";

type RequestFilter = "pending" | "all";

/** Mailto chips for trainers or managers listed on a request card. */
function ContactList({ label, people }: { label: string; people: Account[] }) {
  if (people.length === 0) return null;
  return (
    <div className="request-contacts">
      <span className="request-contacts-label">{label}</span>
      <div className="request-contacts-chips">
        {people.map((person) => (
          <a
            key={person.id}
            className="request-contact-chip"
            href={`mailto:${person.email}`}
            title={person.email}
          >
            {person.displayName}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function TrainingRequestsPanel() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<TrainingRequestReview[]>([]);
  const [filter, setFilter] = useState<RequestFilter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const list = await getTrainingRequestReviews(user);
    setReviews(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleReview(requestId: string, approve: boolean) {
    if (!user) return;
    setBusyId(requestId);
    setError(null);
    try {
      if (approve) {
        await approveTrainingRequest(requestId, user);
      } else {
        await denyTrainingRequest(requestId, user);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update request.");
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  const pendingCount = reviews.filter(
    (review) => review.request.status === "pending"
  ).length;
  const visible =
    filter === "pending"
      ? reviews.filter((review) => review.request.status === "pending")
      : reviews;

  return (
    <section className="detail-section">
      <div className="section-heading-row">
        <div>
          <h3>Training requests ({pendingCount} pending)</h3>
          <p className="muted">
            Requests for trainings tied to your labs or the equipment you train
            on. Approving marks the training complete for that person.
          </p>
        </div>
        <div className="training-view-switch" role="tablist" aria-label="Request filter">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "pending"}
            className={
              filter === "pending"
                ? "training-view-btn training-view-btn-active"
                : "training-view-btn"
            }
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            className={
              filter === "all"
                ? "training-view-btn training-view-btn-active"
                : "training-view-btn"
            }
            onClick={() => setFilter("all")}
          >
            All requests
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading requests...</p>
      ) : visible.length === 0 ? (
        <p className="muted">
          {filter === "pending"
            ? "No pending training requests right now."
            : "No training requests have come in yet."}
        </p>
      ) : (
        <ul className="request-list">
          {visible.map((review) => {
            const { request } = review;
            const busy = busyId === request.id;
            return (
              <li key={request.id} className="request-row">
                <div className="request-main">
                  <div className="request-header">
                    <Link
                      to={`/trainings/${review.training.id}`}
                      className="request-training-link"
                    >
                      {review.training.name}
                    </Link>
                    <span
                      className={
                        request.status === "pending"
                          ? "badge badge-pending"
                          : request.status === "approved"
                            ? "badge badge-complete"
                            : "badge badge-required"
                      }
                    >
                      {request.status === "pending"
                        ? "Pending"
                        : request.status === "approved"
                          ? "Approved"
                          : "Denied"}
                    </span>
                  </div>
                  <p className="request-meta">
                    <strong>{request.userName}</strong> ·{" "}
                    {new Date(request.createdAt).toLocaleString()}
                    {request.reviewedByUserName &&
                      ` · reviewed by ${request.reviewedByUserName}`}
                  </p>
                  {request.message && (
                    <p className="request-message">"{request.message}"</p>
                  )}
                  {review.labs.length > 0 && (
                    <p className="muted request-labs">
                      {review.labs.map((lab) => lab.name).join(" · ")}
                    </p>
                  )}
                  <ContactList label="Trainers" people={review.trainers} />
                  <ContactList label="Lab managers" people={review.managers} />
                </div>
                <div className="request-actions">
                  {request.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busy}
                        onClick={() => handleReview(request.id, true)}
                      >
                        {busy ? "Working..." : "Approve request"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={busy}
                        onClick={() => handleReview(request.id, false)}
                      >
                        Deny
                      </button>
                    </>
                  ) : (
                    <span className="muted request-reviewed-at">
                      {request.reviewedAt
                        ? new Date(request.reviewedAt).toLocaleDateString()
                        : ""}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
