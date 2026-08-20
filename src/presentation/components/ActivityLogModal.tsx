/**
 * Admin-only audit log: filter by person, role, or action, and sort by recency.
 * Labels below turn internal action ids (createBooking, …) into plain English.
 */
import { useEffect, useState } from "react";
import {
  getActivities,
  type ActivitySort,
} from "../../business/activity";
import { ROLE_LABELS } from "../../shared/roles";
import type { ActivityAction, ActivityEvent, UserRole } from "../../shared/types";

const ACTION_LABELS: Record<ActivityAction, string> = {
  signIn: "Sign-in",
  createBooking: "Reservation",
  addLab: "Lab created",
  updateLab: "Lab updated",
  removeLab: "Lab removed",
  addEquipment: "Equipment added",
  updateEquipment: "Equipment updated",
  removeEquipment: "Equipment removed",
  importEquipment: "Equipment imported",
  addSoftware: "Software added",
  updateSoftware: "Software updated",
  removeSoftware: "Software removed",
  addLabManager: "Manager added",
  removeLabManager: "Manager removed",
  assignLabs: "Labs assigned",
  addTrainer: "Trainer added",
  removeTrainer: "Trainer removed",
  addTraining: "Training created",
  removeTraining: "Training removed",
  setEquipmentTrainings: "Training requirements",
  setEquipmentTrainers: "Equipment trainers",
  requestTrainingAccess: "Training access request",
  approveTrainingAccess: "Training request approved",
  denyTrainingAccess: "Training request denied",
  enrollTrainings: "Training enrolled",
  addConsumable: "Consumable added",
  updateConsumable: "Consumable updated",
  reportConsumableLow: "Consumable low",
  clearConsumableLow: "Consumable restocked",
};

const ACTION_OPTIONS = Object.entries(ACTION_LABELS) as [
  ActivityAction,
  string,
][];

const ROLE_OPTIONS: [UserRole, string][] = [
  ["user", ROLE_LABELS.user],
  ["labOwner", "Lab Manager"],
  ["admin", ROLE_LABELS.admin],
];

const SORT_OPTIONS: [ActivitySort, string][] = [
  ["lastUsed", "Last used"],
  ["oldest", "Oldest first"],
  ["actor", "By user (A–Z)"],
  ["role", "By role"],
];

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ActivityLogModalProps {
  onClose: () => void;
}

export default function ActivityLogModal({ onClose }: ActivityLogModalProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [role, setRole] = useState<UserRole | "all">("all");
  const [action, setAction] = useState<ActivityAction | "all">("all");
  const [sort, setSort] = useState<ActivitySort>("lastUsed");
  const [actorSearch, setActorSearch] = useState("");
  const [uniqueActors, setUniqueActors] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getActivities({ role, action, sort, actorSearch, uniqueActors }).then(
      (results) => {
        if (!cancelled) {
          setEvents(results);
          setLoading(false);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [role, action, sort, actorSearch, uniqueActors]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-toolbar">
          <div>
            <h3>Activity</h3>
            <p className="muted">
              Audit trail of sign-ins, reservations, labs, equipment, and
              manager changes.
            </p>
          </div>
        </div>

        <div className="activity-filters">
          <label className="field field-inline">
            <span>User</span>
            <input
              type="search"
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              placeholder="Search username"
              autoComplete="off"
            />
          </label>
          <label className="field field-inline">
            <span>Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole | "all")}
            >
              <option value="all">All roles</option>
              {ROLE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-inline">
            <span>Action</span>
            <select
              value={action}
              onChange={(e) =>
                setAction(e.target.value as ActivityAction | "all")
              }
            >
              <option value="all">All actions</option>
              {ACTION_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-inline">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ActivitySort)}
            >
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="activity-unique-toggle">
          <input
            type="checkbox"
            checked={uniqueActors}
            onChange={(e) => setUniqueActors(e.target.checked)}
          />
          <span>Show each user&apos;s most recent activity only</span>
        </label>

        {loading ? (
          <p className="muted">Loading activity...</p>
        ) : events.length === 0 ? (
          <p className="muted">No activity matches these filters.</p>
        ) : (
          <ul className="activity-list">
            {events.map((event) => (
              <li key={event.id} className="activity-row">
                <div className="account-avatar">
                  {event.actorName.slice(0, 1).toUpperCase()}
                </div>
                <div className="activity-row-body">
                  <div className="activity-row-header">
                    <strong>{event.actorName}</strong>
                    <span className={`badge badge-role-${event.actorRole}`}>
                      {event.actorRole === "labOwner"
                        ? "Lab Manager"
                        : ROLE_LABELS[event.actorRole]}
                    </span>
                    <span className="activity-action-tag">
                      {ACTION_LABELS[event.action]}
                    </span>
                  </div>
                  <p className="activity-summary">{event.summary}</p>
                </div>
                <time
                  className="activity-time"
                  dateTime={event.timestamp}
                  title={new Date(event.timestamp).toLocaleString()}
                >
                  {formatTimestamp(event.timestamp)}
                </time>
              </li>
            ))}
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
