/**
 * Inbox modal from the header bell.
 *
 * Training-request notices can be approved or denied here if this user is a
 * reviewer. Marking a row read only affects this user, not everyone else.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../business/notifications";
import {
  approveTrainingRequest,
  canReviewRequest,
  denyTrainingRequest,
  getTrainingRequest,
} from "../../business/trainings";
import type { AppNotification, TrainingAccessRequest } from "../../shared/types";

interface NotificationsModalProps {
  onClose: () => void;
  onChanged: () => void;
}

export default function NotificationsModal({
  onClose,
  onChanged,
}: NotificationsModalProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [requests, setRequests] = useState<
    Record<string, TrainingAccessRequest>
  >({});
  const [reviewable, setReviewable] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const list = await getNotificationsForUser(user);

    const byRequestId: Record<string, TrainingAccessRequest> = {};
    const allowed = new Set<string>();
    for (const notification of list) {
      if (notification.type !== "trainingRequest" || !notification.requestId) {
        continue;
      }
      const request = await getTrainingRequest(notification.requestId);
      if (!request) continue;
      byRequestId[request.id] = request;
      if (await canReviewRequest(user, request)) {
        allowed.add(request.id);
      }
    }

    setItems(list);
    setRequests(byRequestId);
    setReviewable(allowed);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleMarkRead(notification: AppNotification) {
    if (!user) return;
    await markNotificationRead(notification.id, user);
    await refresh();
    onChanged();
  }

  async function handleMarkAll() {
    if (!user) return;
    await markAllNotificationsRead(user);
    await refresh();
    onChanged();
  }

  async function handleReview(
    notification: AppNotification,
    requestId: string,
    approve: boolean
  ) {
    if (!user) return;
    setBusyId(requestId);
    setError(null);
    try {
      if (approve) {
        await approveTrainingRequest(requestId, user);
      } else {
        await denyTrainingRequest(requestId, user);
      }
      await markNotificationRead(notification.id, user);
      await refresh();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-toolbar">
          <div>
            <h3>Notifications</h3>
            <p className="muted">
              Training requests and low-stock alerts for labs you oversee.
            </p>
          </div>
          {items.some((item) => user && !item.readByUserIds.includes(user.id)) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleMarkAll}
            >
              Mark all read
            </button>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}

        {loading ? (
          <p className="muted">Loading...</p>
        ) : items.length === 0 ? (
          <p className="muted">No notifications yet.</p>
        ) : (
          <ul className="notification-list">
            {items.map((item) => {
              const unread = user
                ? !item.readByUserIds.includes(user.id)
                : false;
              const request = item.requestId ? requests[item.requestId] : null;
              const canReview =
                request !== null &&
                request !== undefined &&
                reviewable.has(request.id);
              return (
                <li
                  key={item.id}
                  className={
                    unread
                      ? "notification-row notification-row-unread"
                      : "notification-row"
                  }
                >
                  <div>
                    <span
                      className={
                        item.type === "trainingRequest"
                          ? "badge badge-pending"
                          : "badge badge-required"
                      }
                    >
                      {item.type === "trainingRequest"
                        ? "Training request"
                        : "Consumable low"}
                    </span>
                    {request && request.status !== "pending" && (
                      <span
                        className={
                          request.status === "approved"
                            ? "badge badge-complete"
                            : "badge badge-required"
                        }
                      >
                        {request.status === "approved" ? "Approved" : "Denied"}
                        {request.reviewedByUserName
                          ? ` by ${request.reviewedByUserName}`
                          : ""}
                      </span>
                    )}
                    <p className="notification-summary">{item.summary}</p>
                    <p className="muted notification-time">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="notification-actions">
                    {canReview && request.status === "pending" && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={busyId === request.id}
                          onClick={() => handleReview(item, request.id, true)}
                        >
                          {busyId === request.id ? "Working..." : "Approve request"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={busyId === request.id}
                          onClick={() => handleReview(item, request.id, false)}
                        >
                          Deny
                        </button>
                      </>
                    )}
                    {unread && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => handleMarkRead(item)}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
