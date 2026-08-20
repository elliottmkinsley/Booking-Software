/**
 * Modal that actually creates reservations.
 *
 * Daily/weekly gear: pick calendar days. Half-hour/hourly gear: pick a day,
 * then tick time slots (the list opens around 8:00 AM). Contiguous picks are
 * merged into as few booking rows as possible.
 */
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import {
  createBookings,
  getBookingsForEquipment,
  type BookingInput,
} from "../../business/bookings";
import type { Booking, Equipment } from "../../shared/types";
import {
  addDays,
  bookingCoversDate,
  buildMonthCells,
  formatDayLabel,
  isoDate,
  mergeContiguousDates,
  parseIsoDate,
  todayIso,
} from "../../shared/utils/dates";
import { RENTAL_GRANULARITY_LABELS } from "../../shared/utils/rental";
import {
  addMinutesToTime,
  buildDaySlots,
  formatTimeRange,
  isSlotBooked,
  isSlotGranularity,
  mergeContiguousSlots,
  slotMinutes,
} from "../../shared/utils/timeSlots";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEK_OPTIONS = 12;
/** Overnight slots exist but the list opens on the working day. */
const FIRST_VISIBLE_SLOT = "08:00";

interface BookingModalProps {
  equipment: Equipment;
  /** Days already picked on the equipment page calendar. */
  initialDates?: string[];
  onClose: () => void;
  onBooked: () => void;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value];
}

/** Sunday of the week containing `date`. */
function startOfWeek(date: string): string {
  const parsed = parseIsoDate(date);
  return isoDate(addDays(-parsed.getDay(), parsed));
}

interface DayGridProps {
  cursor: Date;
  onCursorChange: (next: Date) => void;
  selected: string[];
  onToggleDay: (date: string) => void;
  isDayDisabled: (date: string) => boolean;
  bookedDays: Set<string>;
}

function DayGrid({
  cursor,
  onCursorChange,
  selected,
  onToggleDay,
  isDayDisabled,
  bookedDays,
}: DayGridProps) {
  const today = todayIso();
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  return (
    <div className="calendar picker-calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onCursorChange(new Date(year, month - 1, 1))}
          aria-label="Previous month"
        >
          &lsaquo;
        </button>
        <strong>
          {MONTH_NAMES[month]} {year}
        </strong>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onCursorChange(new Date(year, month + 1, 1))}
          aria-label="Next month"
        >
          &rsaquo;
        </button>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="calendar-weekday">
            {weekday}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) {
            return <span key={`blank-${index}`} className="calendar-blank" />;
          }
          const disabled = isDayDisabled(date);
          const classes = ["calendar-day"];
          if (bookedDays.has(date)) classes.push("has-bookings");
          if (date === today) classes.push("is-today");
          if (selected.includes(date)) classes.push("is-picked");
          if (disabled) classes.push("is-unavailable");
          return (
            <button
              key={date}
              type="button"
              className={classes.join(" ")}
              disabled={disabled}
              aria-pressed={selected.includes(date)}
              onClick={() => onToggleDay(date)}
            >
              <span className="calendar-day-number">
                {Number(date.slice(8, 10))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BookingModal({
  equipment,
  initialDates = [],
  onClose,
  onBooked,
}: BookingModalProps) {
  const { user } = useAuth();
  const today = todayIso();
  const granularity = equipment.rentalGranularity;
  const usesSlots = isSlotGranularity(granularity);
  const step = usesSlots ? slotMinutes(granularity) : 0;

  // Days picked on the equipment page carry into the modal; past ones drop out.
  const carriedDates = useMemo(
    () => [...new Set(initialDates)].filter((date) => date >= today).sort(),
    [initialDates, today]
  );

  const [existing, setExisting] = useState<Booking[]>([]);
  const [cursor, setCursor] = useState(() => {
    const first = carriedDates[0];
    const start = first ? parseIsoDate(first) : new Date();
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });
  const [selectedDays, setSelectedDays] = useState<string[]>(() =>
    granularity === "daily" ? carriedDates : []
  );
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>(() =>
    granularity === "weekly"
      ? [...new Set(carriedDates.map((date) => startOfWeek(date)))]
      : []
  );
  const [activeDate, setActiveDate] = useState(carriedDates[0] ?? today);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [confirmedSummary, setConfirmedSummary] = useState<string[] | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    getBookingsForEquipment(equipment.id).then((list) => {
      if (!cancelled) setExisting(list);
    });
    return () => {
      cancelled = true;
    };
  }, [equipment.id]);

  const bookedDays = useMemo(() => {
    const days = new Set<string>();
    for (const booking of existing) {
      let date = booking.startDate;
      while (date <= booking.endDate) {
        days.add(date);
        date = isoDate(addDays(1, parseIsoDate(date)));
      }
    }
    return days;
  }, [existing]);

  /** Slot equipment can still be booked on a day that has other slots taken. */
  const fullyBookedDays = useMemo(() => {
    if (!usesSlots) return bookedDays;
    const days = new Set<string>();
    for (const booking of existing) {
      if (booking.startTime) continue;
      let date = booking.startDate;
      while (date <= booking.endDate) {
        days.add(date);
        date = isoDate(addDays(1, parseIsoDate(date)));
      }
    }
    return days;
  }, [existing, usesSlots, bookedDays]);

  const daySlots = useMemo(
    () => (usesSlots ? buildDaySlots(step) : []),
    [usesSlots, step]
  );

  const slotGridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const grid = slotGridRef.current;
    const target = grid?.querySelector<HTMLElement>(
      `[data-slot="${FIRST_VISIBLE_SLOT}"]`
    );
    if (grid && target) {
      grid.scrollTop = target.offsetTop;
    }
  }, [activeDate, daySlots]);

  const weekOptions = useMemo(() => {
    const first = startOfWeek(today);
    return Array.from({ length: WEEK_OPTIONS }, (_, index) =>
      isoDate(addDays(index * 7, parseIsoDate(first)))
    );
  }, [today]);

  const selectedSlotEntries = useMemo(
    () =>
      Object.entries(slotsByDate)
        .filter(([, slots]) => slots.length > 0)
        .sort(([a], [b]) => a.localeCompare(b)),
    [slotsByDate]
  );

  const selectionCount = usesSlots
    ? selectedSlotEntries.reduce((sum, [, slots]) => sum + slots.length, 0)
    : granularity === "weekly"
      ? selectedWeeks.length
      : selectedDays.length;

  function buildInputs(): BookingInput[] {
    if (!user) return [];
    const base = {
      equipmentId: equipment.id,
      userId: user.id,
      userName: user.username,
    };

    if (usesSlots) {
      return selectedSlotEntries.flatMap(([date, slots]) =>
        mergeContiguousSlots(slots, step).map((block) => ({
          ...base,
          startDate: date,
          endDate: date,
          startTime: block.startTime,
          endTime: block.endTime,
        }))
      );
    }

    if (granularity === "weekly") {
      return mergeContiguousDates(
        selectedWeeks.flatMap((weekStart) =>
          Array.from({ length: 7 }, (_, index) =>
            isoDate(addDays(index, parseIsoDate(weekStart)))
          )
        )
      ).map((range) => ({
        ...base,
        startDate: range.start,
        endDate: range.end,
      }));
    }

    return mergeContiguousDates(selectedDays).map((range) => ({
      ...base,
      startDate: range.start,
      endDate: range.end,
    }));
  }

  function describeInput(input: BookingInput): string {
    const days =
      input.startDate === input.endDate
        ? formatDayLabel(input.startDate)
        : `${formatDayLabel(input.startDate)} – ${formatDayLabel(input.endDate)}`;
    return input.startTime && input.endTime
      ? `${days}, ${formatTimeRange(input.startTime, input.endTime)}`
      : days;
  }

  function clearSelection() {
    setSelectedDays([]);
    setSelectedWeeks([]);
    setSlotsByDate({});
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    const inputs = buildInputs();
    if (inputs.length === 0) {
      setError(
        usesSlots
          ? "Pick at least one time slot. Click a slot again to unselect it."
          : "Pick at least one day. Click a day again to unselect it."
      );
      return;
    }

    setError("");
    const created = await createBookings(inputs, user);
    setExisting((current) => [...current, ...created]);
    setConfirmedSummary(inputs.map(describeInput));
    onBooked();
  }

  const pickedInputs = confirmedSummary ? [] : buildInputs();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        {confirmedSummary ? (
          <>
            <h3>
              {confirmedSummary.length === 1
                ? "Reservation confirmed"
                : `${confirmedSummary.length} reservations confirmed`}
            </h3>
            <p className="muted">
              <strong>{equipment.name}</strong> is reserved for:
            </p>
            <ul className="picker-summary-list">
              {confirmedSummary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
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
            <p className="form-notice">
              Reserved in{" "}
              <strong>
                {RENTAL_GRANULARITY_LABELS[granularity].toLowerCase()}
              </strong>{" "}
              blocks. Click to select as many as you need; click again to
              unselect.
            </p>

            <form onSubmit={handleSubmit} className="modal-form">
              {granularity === "weekly" ? (
                <div className="week-picker">
                  {weekOptions.map((weekStart) => {
                    const weekEnd = isoDate(
                      addDays(6, parseIsoDate(weekStart))
                    );
                    const taken = existing.some((booking) =>
                      Array.from({ length: 7 }, (_, index) =>
                        isoDate(addDays(index, parseIsoDate(weekStart)))
                      ).some((date) => bookingCoversDate(booking, date))
                    );
                    const picked = selectedWeeks.includes(weekStart);
                    return (
                      <button
                        key={weekStart}
                        type="button"
                        className={
                          picked
                            ? "slot-btn slot-btn-picked"
                            : taken
                              ? "slot-btn slot-btn-taken"
                              : "slot-btn"
                        }
                        disabled={taken}
                        aria-pressed={picked}
                        onClick={() =>
                          setSelectedWeeks((current) =>
                            toggle(current, weekStart)
                          )
                        }
                      >
                        {formatDayLabel(weekStart)} – {formatDayLabel(weekEnd)}
                        {taken && <small>Reserved</small>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <DayGrid
                  cursor={cursor}
                  onCursorChange={setCursor}
                  selected={usesSlots ? [activeDate] : selectedDays}
                  onToggleDay={(date) => {
                    if (usesSlots) {
                      setActiveDate(date);
                    } else {
                      setSelectedDays((current) => toggle(current, date));
                    }
                  }}
                  isDayDisabled={(date) =>
                    date < today || fullyBookedDays.has(date)
                  }
                  bookedDays={bookedDays}
                />
              )}

              {usesSlots && (
                <div className="slot-picker">
                  <div className="slot-picker-header">
                    <strong>Time slots on {formatDayLabel(activeDate)}</strong>
                    <span className="muted">
                      {(slotsByDate[activeDate] ?? []).length} selected
                    </span>
                  </div>
                  <div className="slot-grid" ref={slotGridRef}>
                    {daySlots.map((start) => {
                      const end = addMinutesToTime(start, step);
                      const taken = isSlotBooked(
                        existing,
                        activeDate,
                        start,
                        end
                      );
                      const picked = (slotsByDate[activeDate] ?? []).includes(
                        start
                      );
                      return (
                        <button
                          key={start}
                          type="button"
                          data-slot={start}
                          className={
                            picked
                              ? "slot-btn slot-btn-picked"
                              : taken
                                ? "slot-btn slot-btn-taken"
                                : "slot-btn"
                          }
                          disabled={taken}
                          aria-pressed={picked}
                          onClick={() =>
                            setSlotsByDate((current) => ({
                              ...current,
                              [activeDate]: toggle(
                                current[activeDate] ?? [],
                                start
                              ),
                            }))
                          }
                        >
                          {formatTimeRange(start, end)}
                          {taken && <small>Booked</small>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="picker-summary">
                <div className="picker-summary-head">
                  <strong>
                    {selectionCount === 0
                      ? "Nothing selected yet"
                      : `${selectionCount} selected`}
                  </strong>
                  {selectionCount > 0 && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={clearSelection}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {pickedInputs.length > 0 && (
                  <ul className="picker-summary-list">
                    {pickedInputs.map((input) => (
                      <li key={describeInput(input)}>{describeInput(input)}</li>
                    ))}
                  </ul>
                )}
              </div>

              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={selectionCount === 0}
                >
                  {selectionCount > 1
                    ? `Confirm ${selectionCount} slots`
                    : "Confirm Reservation"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
