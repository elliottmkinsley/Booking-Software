/**
 * Consumables list for a lab or a single instrument.
 *
 * Anyone can report "getting low." Managers can add items, toggle low-stock
 * alerts, and mark something restocked.
 */
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import {
  addConsumable,
  clearConsumableLow,
  getConsumablesForEquipment,
  getConsumablesForLab,
  removeConsumable,
  reportConsumableLow,
  setConsumableLowNotify,
} from "../../business/consumables";
import type { Consumable } from "../../shared/types";
import { resolveImageUrl } from "../../shared/utils/images";
import ImageUploadField from "./ImageUploadField";

interface ConsumablesPanelProps {
  /** Lab-general consumables when equipmentId is omitted. */
  labId: string | null;
  equipmentId?: string | null;
  canManage: boolean;
  title?: string;
}

export default function ConsumablesPanel({
  labId,
  equipmentId = null,
  canManage,
  title = "Consumables",
}: ConsumablesPanelProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [lowNotifyEnabled, setLowNotifyEnabled] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const list = equipmentId
      ? await getConsumablesForEquipment(equipmentId)
      : labId
        ? await getConsumablesForLab(labId)
        : [];
    setItems(list);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      const list = equipmentId
        ? await getConsumablesForEquipment(equipmentId)
        : labId
          ? await getConsumablesForLab(labId)
          : [];
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [labId, equipmentId]);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError("Please enter a consumable name.");
      return;
    }
    setError("");
    try {
      await addConsumable(
        {
          name,
          description,
          labId,
          equipmentId,
          lowNotifyEnabled,
          imageUrl,
        },
        user
      );
      setName("");
      setDescription("");
      setImageUrl(null);
      setLowNotifyEnabled(true);
      setShowAdd(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add consumable.");
    }
  }

  async function handleReportLow(consumable: Consumable) {
    if (!user) return;
    setBusyId(consumable.id);
    try {
      await reportConsumableLow(consumable.id, user);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleClearLow(consumable: Consumable) {
    if (!user) return;
    setBusyId(consumable.id);
    try {
      await clearConsumableLow(consumable.id, user);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleNotify(consumable: Consumable) {
    if (!user) return;
    setBusyId(consumable.id);
    try {
      await setConsumableLowNotify(
        consumable.id,
        !consumable.lowNotifyEnabled,
        user
      );
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(consumable: Consumable) {
    if (!user) return;
    const confirmed = window.confirm(`Remove "${consumable.name}"?`);
    if (!confirmed) return;
    setBusyId(consumable.id);
    try {
      await removeConsumable(consumable.id, user);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="detail-section">
      <div className="section-heading-row">
        <div>
          <h3>{title}</h3>
          <p className="muted assigned-labs">
            {equipmentId
              ? "Supplies tied to this equipment. Report when stock is getting low."
              : "General lab supplies such as paper towels and cleaning materials."}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShowAdd((value) => !value);
              setError("");
            }}
          >
            {showAdd ? "Cancel" : "+ Add consumable"}
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="add-equipment-form">
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paper towels"
              autoFocus
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
              rows={2}
            />
          </label>
          <ImageUploadField value={imageUrl} onChange={setImageUrl} />
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={lowNotifyEnabled}
              onChange={(e) => setLowNotifyEnabled(e.target.checked)}
            />
            <span>Enable getting-low notifications for admins and lab managers</span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary">
            Save consumable
          </button>
        </form>
      )}

      {loading ? (
        <p className="muted">Loading consumables...</p>
      ) : items.length === 0 ? (
        <p className="muted">No consumables listed yet.</p>
      ) : (
        <ul className="consumable-list">
          {items.map((item) => (
            <li key={item.id} className="consumable-row">
              {resolveImageUrl(item.imageUrl) && (
                <img
                  className="consumable-thumb"
                  src={resolveImageUrl(item.imageUrl) ?? undefined}
                  alt=""
                />
              )}
              <div className="consumable-row-main">
                <div className="consumable-row-header">
                  <strong>{item.name}</strong>
                  {item.status === "low" ? (
                    <span className="badge badge-required">Getting low</span>
                  ) : (
                    <span className="badge badge-complete">Stocked</span>
                  )}
                  {item.lowNotifyEnabled ? (
                    <span className="badge badge-pending">Notify on</span>
                  ) : (
                    <span className="badge badge-past">Notify off</span>
                  )}
                </div>
                {item.description && (
                  <p className="muted">{item.description}</p>
                )}
                {item.status === "low" && item.reportedLowByUserName && (
                  <p className="muted consumable-report-meta">
                    Reported by @{item.reportedLowByUserName}
                    {item.reportedLowAt
                      ? ` · ${new Date(item.reportedLowAt).toLocaleString()}`
                      : ""}
                  </p>
                )}
              </div>
              <div className="consumable-actions">
                {item.status !== "low" && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={busyId === item.id}
                    onClick={() => handleReportLow(item)}
                  >
                    Report getting low
                  </button>
                )}
                {canManage && item.status === "low" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busyId === item.id}
                    onClick={() => handleClearLow(item)}
                  >
                    Mark restocked
                  </button>
                )}
                {canManage && (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busyId === item.id}
                      onClick={() => handleToggleNotify(item)}
                    >
                      {item.lowNotifyEnabled
                        ? "Disable notify"
                        : "Enable notify"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busyId === item.id}
                      onClick={() => handleRemove(item)}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
