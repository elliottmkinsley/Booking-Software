import { useMemo, useState } from "react";
import type { Booking } from "../types";
import { bookingCoversDate, formatDateRange, isoDate, todayIso } from "../utils/dates";

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
}

export default function BookingCalendar({ bookings }: BookingCalendarProps) {
  const today = todayIso();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  // Leading nulls pad the grid so the 1st lands on the right weekday.
  const cells = useMemo(() => {
    const leadingBlanks = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (string | null)[] = Array(leadingBlanks).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push(isoDate(new Date(year, month, day)));
    }
    return result;
  }, [year, month]);

  function bookingsOn(date: string): Booking[] {
    return bookings.filter((booking) => bookingCoversDate(booking, date));
  }

  function changeMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1));
    setSelectedDate(null);
  }

  const selectedBookings = selectedDate ? bookingsOn(selectedDate) : [];

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => changeMonth(-1)}
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
          onClick={() => changeMonth(1)}
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
          const classes = ["calendar-day"];
          if (count > 0) classes.push("has-bookings");
          if (date === today) classes.push("is-today");
          if (date === selectedDate) classes.push("is-selected");
          return (
            <button
              key={date}
              type="button"
              className={classes.join(" ")}
              onClick={() => setSelectedDate(date)}
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
        {!selectedDate ? (
          <p className="muted">
            Select a day to see who reserved this item. Highlighted days already
            have reservations.
          </p>
        ) : selectedBookings.length === 0 ? (
          <p className="muted">No reservations on {selectedDate}.</p>
        ) : (
          <>
            <h4>Reservations on {selectedDate}</h4>
            <ul className="calendar-booking-list">
              {selectedBookings.map((booking) => (
                <li key={booking.id}>
                  <strong>{booking.userName}</strong>
                  <span className="muted">
                    {formatDateRange(booking.startDate, booking.endDate)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
