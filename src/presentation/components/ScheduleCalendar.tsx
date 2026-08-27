/**
 * Month view of reservations. Click a day to read who booked what.
 * This calendar does not create bookings — that still happens on equipment pages.
 */
import { useEffect, useMemo, useState } from "react";
import {
  buildMonthCells,
  formatDayLabel,
  parseIsoDate,
  todayIso,
} from "../../shared/utils/dates";

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

interface ScheduleCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  bookingCountByDate: Map<string, number>;
  /** Unique equipment names per day. Omit on the single-instrument filter. */
  equipmentNamesByDate?: Map<string, string[]>;
}

const MAX_NAMES = 3;

export default function ScheduleCalendar({
  selectedDate,
  onSelectDate,
  bookingCountByDate,
  equipmentNamesByDate,
}: ScheduleCalendarProps) {
  const today = todayIso();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    const selected = parseIsoDate(selectedDate);
    setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [selectedDate]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  const showNames = Boolean(equipmentNamesByDate);

  return (
    <div className={showNames ? "calendar schedule-calendar" : "calendar"}>
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
          const count = bookingCountByDate.get(date) ?? 0;
          const names = equipmentNamesByDate?.get(date) ?? [];
          const extra = names.length > MAX_NAMES ? names.length - MAX_NAMES : 0;
          const visible = names.slice(0, MAX_NAMES);
          const classes = ["calendar-day"];
          if (showNames) classes.push("schedule-day");
          if (count > 0) classes.push("has-bookings");
          if (date === today) classes.push("is-today");
          if (date === selectedDate) classes.push("is-picked");
          const nameList = names.join(", ");
          return (
            <button
              key={date}
              type="button"
              className={classes.join(" ")}
              aria-pressed={date === selectedDate}
              aria-label={`${formatDayLabel(date)}${
                nameList
                  ? `: ${nameList}`
                  : count > 0
                    ? `, ${count} reservation${count === 1 ? "" : "s"}`
                    : ""
              }`}
              title={nameList || undefined}
              onClick={() => onSelectDate(date)}
            >
              <span className="calendar-day-number">
                {Number(date.slice(8, 10))}
              </span>
              {showNames && visible.length > 0 ? (
                <span className="schedule-day-items">
                  {visible.map((name) => (
                    <span key={name} className="schedule-day-item">
                      {name}
                    </span>
                  ))}
                  {extra > 0 && (
                    <span className="schedule-day-more">+{extra} more</span>
                  )}
                </span>
              ) : (
                count > 0 && <span className="calendar-day-count">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
