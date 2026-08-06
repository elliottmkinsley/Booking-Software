import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { addLab, updateLab } from "../services/labService";
import type { Lab } from "../types";
import ImageUploadField from "./ImageUploadField";

interface EditLabInfoModalProps {
  /** null means create a new lab */
  lab: Lab | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditLabInfoModal({
  lab,
  onClose,
  onSaved,
}: EditLabInfoModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState(lab?.name ?? "");
  const [description, setDescription] = useState(lab?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(lab?.imageUrl ?? null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isCreate = lab === null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError("Please enter a lab name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isCreate) {
        await addLab({ name, description, imageUrl }, user);
      } else {
        await updateLab(lab.id, { name, description, imageUrl }, user);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save lab.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isCreate ? "Add lab" : "Edit lab"}</h3>
        <p className="muted">
          {isCreate
            ? "Create a new lab for the Radiant Center."
            : "Update this lab's name, description, and picture."}
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="field">
            <span>Lab name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hyperspectral Imaging Lab"
              autoFocus
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What equipment and research happens in this lab?"
              rows={3}
            />
          </label>
          <ImageUploadField value={imageUrl} onChange={setImageUrl} />
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : isCreate ? "Create lab" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
