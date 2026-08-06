import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { searchAccounts } from "../services/accountService";
import {
  addLabManager,
  getLabManagerProfiles,
  removeLabManager,
  setAssignedLabs,
  type LabManagerProfile,
} from "../services/labManagerService";
import { getLabs } from "../services/labService";
import type { Account, Lab } from "../types";

type ModalView = "list" | "add" | "assign";

interface LabManagersModalProps {
  onClose: () => void;
}

export default function LabManagersModal({ onClose }: LabManagersModalProps) {
  const { user } = useAuth();
  const [view, setView] = useState<ModalView>("list");
  const [profiles, setProfiles] = useState<LabManagerProfile[]>([]);
  const [allLabs, setAllLabs] = useState<Lab[]>([]);
  const [assignTarget, setAssignTarget] = useState<LabManagerProfile | null>(
    null
  );
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const [managerProfiles, labs] = await Promise.all([
      getLabManagerProfiles(),
      getLabs(),
    ]);
    setProfiles(managerProfiles);
    setAllLabs(labs);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (view !== "add") return;
    let cancelled = false;
    async function runSearch() {
      setSearchLoading(true);
      const results = await searchAccounts(searchQuery, {
        excludeIds: profiles.map((profile) => profile.account.id),
      });
      if (!cancelled) {
        setSearchResults(results);
        setSearchLoading(false);
      }
    }
    runSearch();
    return () => {
      cancelled = true;
    };
  }, [view, searchQuery, profiles]);

  function openAssign(profile: LabManagerProfile) {
    setAssignTarget(profile);
    setSelectedLabIds([...profile.assignedLabIds]);
    setView("assign");
    setError("");
  }

  async function handleAdd(account: Account) {
    if (!user) return;
    setError("");
    try {
      await addLabManager(account.id, user);
      await refresh();
      setView("list");
      setSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add lab manager.");
    }
  }

  async function handleSaveAssignments() {
    if (!assignTarget || !user) return;
    setError("");
    try {
      await setAssignedLabs(assignTarget.account.id, selectedLabIds, user);
      await refresh();
      setView("list");
      setAssignTarget(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save lab assignments."
      );
    }
  }

  async function handleRemove(profile: LabManagerProfile) {
    if (!user) return;
    const confirmed = window.confirm(
      `Remove ${profile.account.displayName} as a lab manager? Their lab assignments will also be cleared.`
    );
    if (!confirmed) return;
    setError("");
    try {
      await removeLabManager(profile.account.id, user);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove lab manager."
      );
    }
  }

  function toggleLab(labId: string) {
    setSelectedLabIds((current) =>
      current.includes(labId)
        ? current.filter((id) => id !== labId)
        : [...current, labId]
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-toolbar">
          <div>
            <h3>Lab Managers</h3>
            <p className="muted">
              {view === "assign"
                ? `Assign labs to ${assignTarget?.account.displayName}`
                : "Manage lab manager accounts and which labs they oversee."}
            </p>
          </div>
          {view === "list" && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setView("add");
                setError("");
              }}
            >
              + Add
            </button>
          )}
          {view !== "list" && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setView("list");
                setSearchQuery("");
                setAssignTarget(null);
                setError("");
              }}
            >
              Back to list
            </button>
          )}
        </div>

        {view === "list" && (
          loading ? (
            <p className="muted">Loading lab managers...</p>
          ) : profiles.length === 0 ? (
            <p className="muted">
              No lab managers assigned yet. Click Add to search accounts.
            </p>
          ) : (
            <>
              {error && <p className="form-error">{error}</p>}
              <ul className="account-list">
                {profiles.map((profile) => (
                  <li
                    key={profile.account.id}
                    className="account-row account-row-stack"
                  >
                    <div className="account-row-main">
                      <div className="account-avatar">
                        {profile.account.displayName.slice(0, 1)}
                      </div>
                      <div>
                        <strong>{profile.account.displayName}</strong>
                        <p className="muted">
                          @{profile.account.username} &middot;{" "}
                          {profile.account.email}
                        </p>
                        <p className="assigned-labs">
                          {profile.assignedLabs.length === 0
                            ? "No labs assigned"
                            : profile.assignedLabs
                                .map((lab) => lab.name)
                                .join(", ")}
                        </p>
                      </div>
                      <span className="badge badge-role-labOwner">
                        Lab Manager
                      </span>
                    </div>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-small"
                        onClick={() => openAssign(profile)}
                      >
                        Assign labs
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => handleRemove(profile)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )
        )}

        {view === "add" && (
          <>
            <label className="field">
              <span>Search accounts</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, username, or email"
                autoFocus
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            {searchLoading ? (
              <p className="muted">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="muted">
                {searchQuery.trim()
                  ? "No matching accounts found."
                  : "No accounts available to add."}
              </p>
            ) : (
              <ul className="account-list account-list-select">
                {searchResults.map((account) => (
                  <li key={account.id} className="account-row">
                    <div className="account-avatar">
                      {account.displayName.slice(0, 1)}
                    </div>
                    <div>
                      <strong>{account.displayName}</strong>
                      <p className="muted">
                        @{account.username} &middot; {account.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => handleAdd(account)}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {view === "assign" && assignTarget && (
          <>
            <fieldset className="lab-assign-list">
              <legend>Select labs this manager can oversee</legend>
              {allLabs.map((lab) => (
                <label key={lab.id} className="checkbox-field lab-assign-option">
                  <input
                    type="checkbox"
                    checked={selectedLabIds.includes(lab.id)}
                    onChange={() => toggleLab(lab.id)}
                  />
                  <span>
                    <strong>{lab.name}</strong>
                    <small>{lab.description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            {error && <p className="form-error">{error}</p>}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveAssignments}
            >
              Save assignments
            </button>
          </>
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
