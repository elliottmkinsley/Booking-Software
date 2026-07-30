import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { createBooking } from "../services/bookingService";
import type { Equipment } from "../types";
import { formatDateRange, todayIso } from "../utils/dates";

interface BookingModalProps {
  equipment: Equipment;
  onClose: () => void;
  onBooked: () => void;
}

export default function BookingModal({
  equipment,
  onClose,
  onBooked,
}: BookingModalProps) {
  const { user } = useAuth();
  const today = todayIso();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!startDate || !endDate) {
      setError("Please choose both dates.");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }
    setError("");
    await createBooking({
      equipmentId: equipment.id,
      userId: user.id,
      userName: user.username,
      startDate,
      endDate,
    });
    setConfirmed(true);
    onBooked();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {confirmed ? (
          <>
            <h3>Reservation confirmed</h3>
            <p className="muted">
              <strong>{equipment.name}</strong> is reserved for{" "}
              {formatDateRange(startDate, endDate)}.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Reserve {equipment.name}</h3>
            <p className="muted">{equipment.description}</p>
            <form onSubmit={handleSubmit} className="modal-form">
              <label className="field">
                <span>Start date</span>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="field">
                <span>End date</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Reservation
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
