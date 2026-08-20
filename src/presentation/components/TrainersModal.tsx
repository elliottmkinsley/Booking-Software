/**
 * Directory of certified trainers. Search the people directory to add someone;
 * removing a trainer also drops them from every equipment trainer list.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { searchAccounts } from "../../business/accounts";
import {
  addTrainer,
  getTrainers,
  removeTrainer,
} from "../../business/trainers";
import type { Account } from "../../shared/types";

type ModalView = "list" | "add";

interface TrainersModalProps {
  onClose: () => void;
}

export default function TrainersModal({ onClose }: TrainersModalProps) {
  const { user } = useAuth();
  const [view, setView] = useState<ModalView>("list");
  const [trainers, setTrainers] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const list = await getTrainers();
    setTrainers(list);
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
        excludeIds: trainers.map((trainer) => trainer.id),
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
  }, [view, searchQuery, trainers]);

  async function handleAdd(account: Account) {
    if (!user) return;
    setError("");
    try {
      await addTrainer(account.id, user);
      await refresh();
      setView("list");
      setSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add trainer.");
    }
  }

  async function handleRemove(account: Account) {
    if (!user) return;
    const confirmed = window.confirm(
      `Remove ${account.displayName} as a trainer? They will also be removed from any equipment they train on.`
    );
    if (!confirmed) return;
    setError("");
    try {
      await removeTrainer(account.id, user);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove trainer."
      );
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-toolbar">
          <div>
            <h3>Trainers</h3>
            <p className="muted">
              People certified to train others on equipment. Assign them to
              specific items from each equipment page.
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
          {view === "add" && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setView("list");
                setSearchQuery("");
                setError("");
              }}
            >
              Back to list
            </button>
          )}
        </div>

        {view === "list" &&
          (loading ? (
            <p className="muted">Loading trainers...</p>
          ) : trainers.length === 0 ? (
            <p className="muted">
              No trainers yet. Click Add to search accounts.
            </p>
          ) : (
            <>
              {error && <p className="form-error">{error}</p>}
              <ul className="account-list">
                {trainers.map((account) => (
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
                    <span className="badge badge-role-user">Trainer</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={() => handleRemove(account)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ))}

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

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
