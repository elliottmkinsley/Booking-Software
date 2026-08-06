import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { removeEquipment } from "../services/labService";
import { getAllTrainings } from "../services/trainingService";
import type { Equipment, RentalGranularity, Training } from "../types";
import { equipmentImage } from "../utils/images";
import {
  RENTAL_GRANULARITY_LABELS,
  RENTAL_GRANULARITY_OPTIONS,
} from "../utils/rental";
import CardEditControls from "./CardEditControls";
import EditEquipmentInfoModal from "./EditEquipmentInfoModal";
import ImageUploadField from "./ImageUploadField";

export interface EquipmentAddInput {
  name: string;
  description: string;
  trainingIds: string[];
  rentalGranularity: RentalGranularity;
  imageUrl: string | null;
  downloadUrl: string | null;
  accessInstructions: string | null;
  contactName: string | null;
  contactEmail: string | null;
}

interface EquipmentBrowserProps {
  items: Equipment[];
  /** Label used on the add button and form, e.g. "Equipment" or "Software" */
  itemLabel: string;
  emptyMessage: string;
  /** When false, add/edit controls are hidden (role/assignment scoped). */
  canAdd?: boolean;
  /** Extra manager-only buttons for the toolbar, e.g. the Excel importer. */
  toolbarActions?: ReactNode;
  onAdd: (input: EquipmentAddInput) => Promise<void>;
  onChanged: () => void;
}

export default function EquipmentBrowser({
  items,
  itemLabel,
  emptyMessage,
  canAdd = false,
  toolbarActions,
  onAdd,
  onChanged,
}: EquipmentBrowserProps) {
  const { user } = useAuth();
  const isSoftware = itemLabel === "Software";
  const [editing, setEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Equipment | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rentalGranularity, setRentalGranularity] =
    useState<RentalGranularity>("daily");
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [accessInstructions, setAccessInstructions] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [catalog, setCatalog] = useState<Training[]>([]);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (!canAdd || isSoftware || !(showAddForm || editing)) return;
    let cancelled = false;
    getAllTrainings().then((trainings) => {
      if (!cancelled) setCatalog(trainings);
    });
    return () => {
      cancelled = true;
    };
  }, [canAdd, isSoftware, showAddForm, editing]);

  function toggleTraining(trainingId: string) {
    setSelectedTrainingIds((current) =>
      current.includes(trainingId)
        ? current.filter((id) => id !== trainingId)
        : [...current, trainingId]
    );
  }

  function resetAddForm() {
    setNewName("");
    setNewDescription("");
    setImageUrl(null);
    setRentalGranularity("daily");
    setSelectedTrainingIds([]);
    setDownloadUrl("");
    setAccessInstructions("");
    setContactName("");
    setContactEmail("");
    setShowAddForm(false);
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!newName.trim()) {
      setAddError(`Please enter a name for the ${itemLabel.toLowerCase()}.`);
      return;
    }
    setAddError("");
    await onAdd({
      name: newName.trim(),
      description: newDescription.trim(),
      trainingIds: isSoftware ? [] : selectedTrainingIds,
      rentalGranularity,
      imageUrl,
      downloadUrl: isSoftware ? downloadUrl.trim() || null : null,
      accessInstructions: isSoftware
        ? accessInstructions.trim() || null
        : null,
      contactName: isSoftware ? contactName.trim() || null : null,
      contactEmail: isSoftware ? contactEmail.trim() || null : null,
    });
    resetAddForm();
    onChanged();
  }

  async function handleRemove(item: Equipment) {
    if (!user) return;
    const confirmed = window.confirm(
      `Remove "${item.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    await removeEquipment(item.id, user);
    onChanged();
  }

  return (
    <>
      {canAdd && (
        <div className="admin-toolbar admin-toolbar-row">
          <button
            type="button"
            className={editing ? "btn btn-outline" : "btn btn-primary"}
            onClick={() => {
              setEditing((value) => !value);
              setShowAddForm(false);
            }}
          >
            {editing ? "Done" : `Edit ${itemLabel}`}
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddForm((v) => !v)}
            >
              {showAddForm ? "Cancel" : `+ Add ${itemLabel}`}
            </button>
          )}
          {toolbarActions}
        </div>
      )}

      {editing && (
        <p className="muted edit-labs-hint">
          Use the red × to remove {itemLabel.toLowerCase()}, or ⋯ to edit its
          details.
        </p>
      )}

      {canAdd && editing && showAddForm && (
        <form onSubmit={handleAdd} className="add-equipment-form">
          <h3>New {itemLabel.toLowerCase()}</h3>
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Name of the ${itemLabel.toLowerCase()}`}
              autoFocus
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Short description of the item"
              rows={2}
            />
          </label>
          <ImageUploadField value={imageUrl} onChange={setImageUrl} />

          {isSoftware ? (
            <>
              <label className="field">
                <span>Download / portal link</span>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label className="field">
                <span>How to get access</span>
                <textarea
                  value={accessInstructions}
                  onChange={(e) => setAccessInstructions(e.target.value)}
                  placeholder="Steps to request a license or install the software"
                  rows={3}
                />
              </label>
              <label className="field">
                <span>Contact name</span>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Who to ask about this software"
                />
              </label>
              <label className="field">
                <span>Contact email</span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@nau.edu"
                />
              </label>
            </>
          ) : (
            <>
              <label className="field">
                <span>Rental granularity</span>
                <select
                  value={rentalGranularity}
                  onChange={(e) =>
                    setRentalGranularity(e.target.value as RentalGranularity)
                  }
                >
                  {RENTAL_GRANULARITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small className="field-hint">
                  {
                    RENTAL_GRANULARITY_OPTIONS.find(
                      (option) => option.value === rentalGranularity
                    )?.hint
                  }
                </small>
              </label>
              <fieldset className="training-require-list">
                <legend>Required trainings to book</legend>
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
            </>
          )}

          {addError && <p className="form-error">{addError}</p>}
          <button type="submit" className="btn btn-primary">
            Add {itemLabel}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="muted">{emptyMessage}</p>
      ) : (
        <div className="card-grid">
          {items.map((item) => {
            const cardBody = (
              <>
                <div className="media-card-image-wrap">
                  <img
                    className="media-card-image"
                    src={equipmentImage(item)}
                    alt={item.name}
                  />
                  {editing && (
                    <CardEditControls
                      itemName={item.name}
                      onRemove={() => handleRemove(item)}
                      onEdit={() => setEditTarget(item)}
                    />
                  )}
                </div>
                <div className="media-card-body">
                  <h3>{item.name}</h3>
                  <div className="badge-row">
                    <span className={`badge badge-${item.category}`}>
                      {item.category}
                    </span>
                    {item.category !== "software" && (
                      <span className="badge badge-rental">
                        {RENTAL_GRANULARITY_LABELS[item.rentalGranularity]}
                      </span>
                    )}
                    {item.status === "maintenance" && (
                      <span className="badge badge-maintenance">
                        Under maintenance
                      </span>
                    )}
                  </div>
                  <p>{item.description}</p>
                  <span className="media-card-meta">
                    {item.category === "software"
                      ? "View access info →"
                      : "View details →"}
                  </span>
                </div>
              </>
            );

            if (editing) {
              return (
                <div key={item.id} className="media-card media-card-editing">
                  {cardBody}
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                to={`/equipment/${item.id}`}
                className="media-card"
              >
                {cardBody}
              </Link>
            );
          })}
        </div>
      )}

      {editTarget && (
        <EditEquipmentInfoModal
          item={editTarget}
          itemLabel={itemLabel}
          onClose={() => setEditTarget(null)}
          onSaved={onChanged}
        />
      )}
    </>
  );
}
