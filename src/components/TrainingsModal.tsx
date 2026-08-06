import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import {
  addTraining,
  getAllTrainings,
} from "../services/trainingService";
import type { Training } from "../types";

interface TrainingsModalProps {
  onClose: () => void;
}

export default function TrainingsModal({ onClose }: TrainingsModalProps) {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [howToComplete, setHowToComplete] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const list = await getAllTrainings();
    setTrainings(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError("Please enter a training name.");
      return;
    }
    setError("");
    try {
      await addTraining({ name, description, howToComplete }, user);
      setName("");
      setDescription("");
      setHowToComplete("");
      setShowAdd(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add training.");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-toolbar">
          <div>
            <h3>Trainings</h3>
            <p className="muted">
              Create trainings that lab managers can require before booking.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShowAdd((value) => !value);
              setError("");
            }}
          >
            {showAdd ? "Cancel" : "+ Add Training"}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="modal-form">
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cryostat Safety Briefing"
                autoFocus
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What the trainee must complete"
                rows={2}
              />
            </label>
            <label className="field">
              <span>How to complete (optional)</span>
              <textarea
                value={howToComplete}
                onChange={(e) => setHowToComplete(e.target.value)}
                placeholder="Step-by-step instructions shown on the training page"
                rows={3}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary">
              Save training
            </button>
          </form>
        )}

        {loading ? (
          <p className="muted">Loading trainings...</p>
        ) : trainings.length === 0 ? (
          <p className="muted">No trainings yet. Add the first one above.</p>
        ) : (
          <ul className="account-list">
            {trainings.map((training) => (
              <li key={training.id} className="account-row account-row-stack">
                <div>
                  <strong>{training.name}</strong>
                  <p className="muted assigned-labs">
                    {training.description || "No description provided."}
                  </p>
                </div>
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
