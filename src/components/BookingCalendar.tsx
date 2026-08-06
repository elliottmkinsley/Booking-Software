import { useMemo, useState } from "react";
import type { Booking } from "../types";
import {
  bookingCoversDate,
  buildMonthCells,
  formatDayLabel,
  todayIso,
} from "../utils/dates";
import { formatBookingWhen } from "../utils/timeSlots";

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

interface BookingCalendarProps {
  bookings: Booking[];
  /** Days the user has picked; clicking a picked day unpicks it. */
  selectedDates: string[];
  onToggleDate: (date: string) => void;
  onClearDates: () => void;
  /** Shown only when the user is allowed to book this item. */
  canReserve: boolean;
  onReserveSelected: () => void;
}

export default function BookingCalendar({
  bookings,
  selectedDates,
  onToggleDate,
  onClearDates,
  canReserve,
  onReserveSelected,
}: BookingCalendarProps) {
  const today = todayIso();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  function bookingsOn(date: string): Booking[] {
    return bookings.filter((booking) => bookingCoversDate(booking, date));
  }

  const sortedSelection = [...selectedDates].sort();
  const pastSelected = sortedSelection.filter((date) => date < today);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
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
          onClick={() => setCursor(new Date(year, month + 1, 1))}
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
          const count = bookingsOn(date).length;
          const picked = selectedDates.includes(date);
          const classes = ["calendar-day"];
          if (count > 0) classes.push("has-bookings");
          if (date === today) classes.push("is-today");
          if (picked) classes.push("is-picked");
          return (
            <button
              key={date}
              type="button"
              className={classes.join(" ")}
              aria-pressed={picked}
              onClick={() => onToggleDate(date)}
            >
              <span className="calendar-day-number">
                {Number(date.slice(8, 10))}
              </span>
              {count > 0 && <span className="calendar-day-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="calendar-detail">
        {sortedSelection.length === 0 ? (
          <p className="muted">
            Click any day to select it — click it again to unselect. Pick as
            many days as you like. Highlighted days already have reservations.
          </p>
        ) : (
          <>
            <div className="calendar-selection-head">
              <h4>
                {sortedSelection.length} day
                {sortedSelection.length === 1 ? "" : "s"} selected:{" "}
                {sortedSelection.map((date) => formatDayLabel(date)).join(", ")}
              </h4>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClearDates}
              >
                Clear
              </button>
            </div>

            {sortedSelection.map((date) => {
              const dayBookings = bookingsOn(date);
              return (
                <div key={date} className="calendar-day-detail">
                  <strong>{formatDayLabel(date)}</strong>
                  {dayBookings.length === 0 ? (
                    <p className="muted">No reservations yet.</p>
                  ) : (
                    <ul className="calendar-booking-list">
                      {dayBookings.map((booking) => (
                        <li key={booking.id}>
                          <strong>{booking.userName}</strong>
                          <span className="muted">
                            {formatBookingWhen(booking)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {canReserve && (
              <div className="calendar-reserve-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={pastSelected.length === sortedSelection.length}
                  onClick={onReserveSelected}
                >
                  Reserve selected day
                  {sortedSelection.length === 1 ? "" : "s"}
                </button>
                {pastSelected.length > 0 && (
                  <span className="muted">
                    Past days are ignored when reserving.
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
