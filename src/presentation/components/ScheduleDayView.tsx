/**
 * One-day view of the shared calendar: all-day reservations on top, then
 * an hour grid so timed bookings sit where they belong.
 */
import { Link } from "react-router-dom";
import type { Booking, Equipment, Lab } from "../../shared/types";
import { isoDate, parseIsoDate } from "../../shared/utils/dates";
import { formatTime, formatTimeRange } from "../../shared/utils/timeSlots";

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 19;
const PIXELS_PER_HOUR = 52;

interface ScheduleDayViewProps {
  date: string;
  onDateChange: (date: string) => void;
  bookings: Booking[];
  equipmentById: Map<string, Equipment>;
  labById: Map<string, Lab>;
  personById: Map<string, string>;
  loading: boolean;
}

function shiftDate(date: string, days: number): string {
  const next = parseIsoDate(date);
  next.setDate(next.getDate() + days);
  return isoDate(next);
}

function minutesFromMidnight(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function hourWindow(bookings: Booking[]): { startHour: number; endHour: number } {
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  for (const booking of bookings) {
    if (!booking.startTime || !booking.endTime) continue;
    startHour = Math.min(startHour, Math.floor(minutesFromMidnight(booking.startTime) / 60));
    const endMinutes = minutesFromMidnight(booking.endTime);
    endHour = Math.max(endHour, Math.ceil(endMinutes / 60));
  }
  return { startHour: Math.max(0, startHour), endHour: Math.min(24, Math.max(endHour, startHour + 1)) };
}

function longDateLabel(date: string): string {
  return parseIsoDate(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ScheduleDayView({
  date,
  onDateChange,
  bookings,
  equipmentById,
  labById,
  personById,
  loading,
}: ScheduleDayViewProps) {
  const allDay = bookings.filter((booking) => !booking.startTime || !booking.endTime);
  const timed = bookings.filter((booking) => booking.startTime && booking.endTime);
  const { startHour, endHour } = hourWindow(timed);
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const gridStart = startHour * 60;

  return (
    <div className="calendar schedule-day-view">
      <div className="calendar-header">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onDateChange(shiftDate(date, -1))}
          aria-label="Previous day"
        >
          &lsaquo;
        </button>
        <strong>{longDateLabel(date)}</strong>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onDateChange(shiftDate(date, 1))}
          aria-label="Next day"
        >
          &rsaquo;
        </button>
      </div>

      {loading ? (
        <p className="muted schedule-day-empty">Loading...</p>
      ) : (
        <>
          <div className="schedule-all-day">
            <span className="schedule-all-day-label">All day</span>
            <div className="schedule-all-day-items">
              {allDay.length === 0 ? (
                <p className="muted">No all-day reservations.</p>
              ) : (
                allDay.map((booking) => {
                  const item = equipmentById.get(booking.equipmentId);
                  const lab = item?.labId ? labById.get(item.labId) : undefined;
                  const who = personById.get(booking.userId) ?? booking.userName;
                  return (
                    <div key={booking.id} className="schedule-day-block">
                      <strong>
                        {item ? (
                          <Link to={`/equipment/${item.id}`}>{item.name}</Link>
                        ) : (
                          "Removed item"
                        )}
                      </strong>
                      <span>{who}</span>
                      {lab && <span className="muted">{lab.name}</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div
            className="schedule-hour-grid"
            style={{ height: hours.length * PIXELS_PER_HOUR }}
          >
            {hours.map((hour) => (
              <div key={hour} className="schedule-hour-row">
                <span className="schedule-hour-label">
                  {formatTime(`${String(hour).padStart(2, "0")}:00`)}
                </span>
                <span className="schedule-hour-line" />
              </div>
            ))}
            {timed.map((booking) => {
              const item = equipmentById.get(booking.equipmentId);
              const lab = item?.labId ? labById.get(item.labId) : undefined;
              const who = personById.get(booking.userId) ?? booking.userName;
              const start = minutesFromMidnight(booking.startTime!);
              const end = minutesFromMidnight(booking.endTime!);
              const top = ((start - gridStart) / 60) * PIXELS_PER_HOUR;
              const height = Math.max(((end - start) / 60) * PIXELS_PER_HOUR, 36);
              return (
                <div
                  key={booking.id}
                  className="schedule-day-block schedule-day-block-timed"
                  style={{ top, height }}
                >
                  <strong>
                    {item ? (
                      <Link to={`/equipment/${item.id}`}>{item.name}</Link>
                    ) : (
                      "Removed item"
                    )}
                  </strong>
                  <span>
                    {who} · {formatTimeRange(booking.startTime!, booking.endTime!)}
                  </span>
                  {lab && <span className="muted">{lab.name}</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
