/**
 * Edit one equipment or software card: name, description, picture, and —
 * for software — download link, access notes, and a contact person.
 */
import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { updateEquipment } from "../../business/labs";
import type { Equipment, RentalGranularity } from "../../shared/types";
import { RENTAL_GRANULARITY_OPTIONS } from "../../shared/utils/rental";
import ImageUploadField from "./ImageUploadField";

interface EditEquipmentInfoModalProps {
  item: Equipment;
  itemLabel: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditEquipmentInfoModal({
  item,
  itemLabel,
  onClose,
  onSaved,
}: EditEquipmentInfoModalProps) {
  const { user } = useAuth();
  const isSoftware = item.category === "software";
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [imageUrl, setImageUrl] = useState<string | null>(item.imageUrl);
  const [rentalGranularity, setRentalGranularity] =
    useState<RentalGranularity>(item.rentalGranularity);
  const [downloadUrl, setDownloadUrl] = useState(item.downloadUrl ?? "");
  const [accessInstructions, setAccessInstructions] = useState(
    item.accessInstructions ?? ""
  );
  const [contactName, setContactName] = useState(item.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(item.contactEmail ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError(`Please enter a ${itemLabel.toLowerCase()} name.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateEquipment(
        item.id,
        {
          name,
          description,
          imageUrl,
          rentalGranularity: isSoftware ? undefined : rentalGranularity,
          downloadUrl: isSoftware ? downloadUrl : undefined,
          accessInstructions: isSoftware ? accessInstructions : undefined,
          contactName: isSoftware ? contactName : undefined,
          contactEmail: isSoftware ? contactEmail : undefined,
        },
        user
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not save ${itemLabel.toLowerCase()}.`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3>Edit {itemLabel.toLowerCase()}</h3>
        <p className="muted">
          {isSoftware
            ? "Update access details and the picture for this software."
            : "Update this item's details, picture, and rental granularity."}
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
                  rows={3}
                />
              </label>
              <label className="field">
                <span>Contact name</span>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Contact email</span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </label>
            </>
          ) : (
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
          )}

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
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
