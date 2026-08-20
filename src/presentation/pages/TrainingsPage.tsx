/**
 * Training catalog.
 *
 * Three tabs: the full catalog (search and filter), "Your trainings" (ones
 * you enrolled in from an equipment page), and — for reviewers — pending
 * access requests. Admins can open a modal to add or remove catalog entries.
 */
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import TrainingEquipmentAccess from "../components/TrainingEquipmentAccess";
import TrainingRequestsPanel from "../components/TrainingRequestsPanel";
import TrainingsModal from "../components/TrainingsModal";
import { useAuth } from "../context/AuthContext";
import { canRequestTrainings } from "../../shared/roles";
import { getLabs } from "../../business/labs";
import {
  canManageTrainings,
  canReviewTrainingRequests,
} from "../../business/permissions";
import {
  getTrainingCatalog,
  getTrainingEquipmentOwners,
  type TrainingCatalogEntry,
  type TrainingCatalogSort,
  type TrainingScopeFilter,
  type TrainingStatusFilter,
} from "../../business/trainings";
import type { Lab, Person } from "../../shared/types";

type TrainingsView = "all" | "yours" | "requests";

/** One catalog row: name, status badges, and a link to the training detail page. */
function TrainingCard({
  entry,
  emphasizeNeeded = false,
  showEquipmentAccess = false,
  showRequestAction = false,
}: {
  entry: TrainingCatalogEntry;
  emphasizeNeeded?: boolean;
  showEquipmentAccess?: boolean;
  showRequestAction?: boolean;
}) {
  const actionLabel = entry.completed
    ? "View training"
    : entry.pendingRequest
      ? "View request"
      : "Request training";

  return (
    <Link
      to={`/trainings/${entry.training.id}`}
      className={
        emphasizeNeeded && !entry.completed
          ? "training-catalog-card training-catalog-card-needed"
          : "training-catalog-card"
      }
    >
      <div className="training-catalog-card-main">
        <div className="training-catalog-card-header">
          <h3>{entry.training.name}</h3>
          {entry.completed ? (
            <span className="badge badge-complete">Completed</span>
          ) : (
            <span className="badge badge-required">Incomplete</span>
          )}
          {entry.pendingRequest && (
            <span className="badge badge-pending">Access requested</span>
          )}
        </div>
        <p className="muted">{entry.training.description}</p>
        {showEquipmentAccess ? (
          <TrainingEquipmentAccess
            equipment={entry.equipment}
            completed={entry.completed}
          />
        ) : (
          <div className="training-catalog-meta">
            <span>
              {entry.equipment.length} item
              {entry.equipment.length === 1 ? "" : "s"}
            </span>
            {entry.labs.length > 0 && (
              <span>{entry.labs.map((lab) => lab.name).join(" · ")}</span>
            )}
            {entry.owners.length > 0 && (
              <span>
                Owners: {entry.owners.map((owner) => owner.name).join(", ")}
              </span>
            )}
          </div>
        )}
      </div>
      <span
        className={
          showRequestAction && !entry.completed && !entry.pendingRequest
            ? "training-request-button"
            : "media-card-meta"
        }
      >
        {showRequestAction
          ? `${actionLabel} →`
          : emphasizeNeeded && !entry.completed
            ? "Continue →"
            : "View details →"}
      </span>
    </Link>
  );
}

export default function TrainingsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [entries, setEntries] = useState<TrainingCatalogEntry[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [owners, setOwners] = useState<Person[]>([]);
  const [view, setView] = useState<TrainingsView>(
    searchParams.get("view") === "yours" ? "yours" : "all"
  );
  const [search, setSearch] = useState("");
  const [labId, setLabId] = useState<string | "all">("all");
  const [ownerId, setOwnerId] = useState<string | "all">("all");
  const [scope, setScope] = useState<TrainingScopeFilter>("all");
  const [status, setStatus] = useState<TrainingStatusFilter>("all");
  const [sort, setSort] = useState<TrainingCatalogSort>("incompleteFirst");
  const [loading, setLoading] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    canReviewTrainingRequests(user).then((allowed) => {
      if (!cancelled) setCanReview(allowed);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadFilters() {
      const [labList, ownerList] = await Promise.all([
        getLabs(),
        getTrainingEquipmentOwners(),
      ]);
      if (!cancelled) {
        setLabs(labList);
        setOwners(ownerList);
      }
    }
    loadFilters();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    getTrainingCatalog(user.id, {
      search,
      labId: view === "yours" ? "all" : labId,
      ownerId: view === "yours" ? "all" : ownerId,
      scope: view === "yours" ? "all" : scope,
      status: view === "yours" ? "all" : status,
      sort: view === "yours" ? "name" : sort,
      enrolledOnly: view === "yours",
    }).then((results) => {
      if (!cancelled) {
        setEntries(results);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    user,
    view,
    search,
    labId,
    ownerId,
    scope,
    status,
    sort,
    manageOpen,
  ]);

  if (!user) return null;

  const incompleteEntries = entries.filter((entry) => !entry.completed);
  const completedEntries = entries.filter((entry) => entry.completed);
  const showRequestActions = canRequestTrainings(user);

  function showYourTrainings() {
    setView("yours");
    setSearch("");
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page">
        <Link to="/labs" className="back-link">
          &larr; Main menu
        </Link>

        <div className="page-intro">
          <div className="section-heading-row">
            <div>
              <h2>Trainings</h2>
              <p className="muted">
                {view === "yours"
                  ? "Trainings you added from equipment. Incomplete and completed are listed separately."
                  : view === "requests"
                    ? "Review access requests for the trainings you oversee, and reach the trainers or lab managers who can run them."
                    : "Browse every training, see which labs and equipment require it, and open a training to learn how to complete it."}
              </p>
            </div>
            {canManageTrainings(user) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setManageOpen(true)}
              >
                Manage catalog
              </button>
            )}
          </div>
        </div>

        <div
          className="training-view-switch"
          role="tablist"
          aria-label="Training views"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "all"}
            className={
              view === "all"
                ? "training-view-btn training-view-btn-active"
                : "training-view-btn"
            }
            onClick={() => setView("all")}
          >
            All trainings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "yours"}
            className={
              view === "yours"
                ? "training-view-btn training-view-btn-active training-view-btn-yours"
                : "training-view-btn training-view-btn-yours"
            }
            onClick={showYourTrainings}
          >
            Your trainings
          </button>
          {canReview && (
            <button
              type="button"
              role="tab"
              aria-selected={view === "requests"}
              className={
                view === "requests"
                  ? "training-view-btn training-view-btn-active"
                  : "training-view-btn"
              }
              onClick={() => setView("requests")}
            >
              Requests
            </button>
          )}
        </div>

        {view === "yours" && !loading && entries.length > 0 && (
          <div className="your-trainings-summary">
            <strong>
              {completedEntries.length} of {entries.length} completed
            </strong>
            <span>{incompleteEntries.length} incomplete</span>
          </div>
        )}

        {view === "all" && (
          <div className="activity-filters training-catalog-filters">
            <label className="field field-inline">
              <span>Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, lab, equipment, owner..."
              />
            </label>
            <label className="field field-inline">
              <span>Lab</span>
              <select
                value={labId}
                onChange={(e) => setLabId(e.target.value as string | "all")}
              >
                <option value="all">All labs</option>
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-inline">
              <span>Equipment owner</span>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value as string | "all")}
              >
                <option value="all">All owners</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-inline">
              <span>Required for</span>
              <select
                value={scope}
                onChange={(e) =>
                  setScope(e.target.value as TrainingScopeFilter)
                }
              >
                <option value="all">Everything</option>
                <option value="labEquipment">Lab equipment</option>
              </select>
            </label>
            <label className="field field-inline">
              <span>Your status</span>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as TrainingStatusFilter)
                }
              >
                <option value="all">All</option>
                <option value="incomplete">Incomplete</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="field field-inline">
              <span>Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as TrainingCatalogSort)}
              >
                <option value="incompleteFirst">Incomplete first</option>
                <option value="name">Name (A–Z)</option>
                <option value="lab">By lab</option>
                <option value="mostEquipment">Most equipment</option>
              </select>
            </label>
          </div>
        )}

        {view === "yours" && (
          <div className="activity-filters training-catalog-filters">
            <label className="field field-inline">
              <span>Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your trainings..."
              />
            </label>
          </div>
        )}

        {view === "requests" ? (
          <TrainingRequestsPanel />
        ) : loading ? (
          <p className="muted">Loading trainings...</p>
        ) : view === "yours" ? (
          entries.length === 0 ? (
            <div className="your-trainings-empty">
              <p className="muted">
                You have not added any trainings yet. Open a piece of equipment
                and click <strong>Add training</strong> to put its requirements
                here.
              </p>
              <Link to="/labs" className="btn btn-primary">
                Browse labs
              </Link>
            </div>
          ) : (
            <div className="your-trainings-sections">
              <section className="detail-section">
                <h3>Incomplete ({incompleteEntries.length})</h3>
                {incompleteEntries.length === 0 ? (
                  <p className="muted">
                    Nice work — nothing incomplete in Your trainings.
                  </p>
                ) : (
                  <div className="training-catalog-list">
                    {incompleteEntries.map((entry) => (
                      <TrainingCard
                        key={entry.training.id}
                        entry={entry}
                        emphasizeNeeded
                        showEquipmentAccess
                        showRequestAction={showRequestActions}
                      />
                    ))}
                  </div>
                )}
              </section>
              <section className="detail-section">
                <h3>Completed ({completedEntries.length})</h3>
                {completedEntries.length === 0 ? (
                  <p className="muted">
                    Completed trainings will show up here after you finish them.
                  </p>
                ) : (
                  <div className="training-catalog-list">
                    {completedEntries.map((entry) => (
                      <TrainingCard
                        key={entry.training.id}
                        entry={entry}
                        showEquipmentAccess
                        showRequestAction={showRequestActions}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )
        ) : entries.length === 0 ? (
          <p className="muted">No trainings match these filters.</p>
        ) : (
          <div className="training-catalog-list">
            {entries.map((entry) => (
              <TrainingCard
                key={entry.training.id}
                entry={entry}
                showRequestAction={showRequestActions}
              />
            ))}
          </div>
        )}
      </main>

      {manageOpen && (
        <TrainingsModal onClose={() => setManageOpen(false)} />
      )}
    </div>
  );
}
