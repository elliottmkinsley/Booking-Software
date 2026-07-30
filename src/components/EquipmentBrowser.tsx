import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canManageEquipment } from "../roles";
import type { Equipment } from "../types";

interface EquipmentBrowserProps {
  items: Equipment[];
  /** Label used on the add button and form, e.g. "Equipment" or "Software" */
  itemLabel: string;
  emptyMessage: string;
  onAdd: (input: { name: string; description: string }) => Promise<void>;
  onChanged: () => void;
}

export default function EquipmentBrowser({
  items,
  itemLabel,
  emptyMessage,
  onAdd,
  onChanged,
}: EquipmentBrowserProps) {
  const { user } = useAuth();
  const canManage = canManageEquipment(user);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [addError, setAddError] = useState("");

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!newName.trim()) {
      setAddError(`Please enter a name for the ${itemLabel.toLowerCase()}.`);
      return;
    }
    setAddError("");
    await onAdd({ name: newName.trim(), description: newDescription.trim() });
    setNewName("");
    setNewDescription("");
    setShowAddForm(false);
    onChanged();
  }

  return (
    <>
      {canManage && (
        <div className="admin-toolbar">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? "Cancel" : `+ Add ${itemLabel}`}
          </button>
        </div>
      )}

      {canManage && showAddForm && (
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
          {addError && <p className="form-error">{addError}</p>}
          <button type="submit" className="btn btn-primary">
            Add {itemLabel}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="muted">{emptyMessage}</p>
      ) : (
        <ul className="equipment-list">
          {items.map((item) => (
            <li key={item.id} className="equipment-row">
              <div className="equipment-info">
                <div className="equipment-title">
                  <h4>
                    <Link to={`/equipment/${item.id}`}>{item.name}</Link>
                  </h4>
                  <span className={`badge badge-${item.category}`}>
                    {item.category}
                  </span>
                  {item.status === "maintenance" && (
                    <span className="badge badge-maintenance">
                      Under maintenance
                    </span>
                  )}
                </div>
                <p className="muted">{item.description}</p>
              </div>
              <Link to={`/equipment/${item.id}`} className="btn btn-outline">
                View details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
