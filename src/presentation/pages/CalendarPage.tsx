/**
 * Shared reservation calendar. Anyone signed in can browse bookings for a
 * lab, one instrument, or a person's schedule.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import ScheduleCalendar from "../components/ScheduleCalendar";
import ScheduleDayView from "../components/ScheduleDayView";
import { useAuth } from "../context/AuthContext";
import {
  getCalendarBookings,
  getCalendarPeople,
  type CalendarBookingFilter,
  type CalendarPerson,
} from "../../business/bookings";
import { getAllEquipment, getLabs } from "../../business/labs";
import type { Booking, Equipment, Lab } from "../../shared/types";
import {
  bookingCoversDate,
  formatDayLabel,
  isoDate,
  parseIsoDate,
  todayIso,
} from "../../shared/utils/dates";
import { formatBookingWhen } from "../../shared/utils/timeSlots";

type CalendarScope = CalendarBookingFilter["kind"];
type CalendarGranularity = "monthly" | "daily";

function bookingsOnDate(bookings: Booking[], date: string): Booking[] {
  return bookings
    .filter((booking) => bookingCoversDate(booking, date))
    .sort((a, b) => {
      const timeA = a.startTime ?? "";
      const timeB = b.startTime ?? "";
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      return a.userName.localeCompare(b.userName);
    });
}

function countByDate(bookings: Booking[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const booking of bookings) {
    const end = parseIsoDate(booking.endDate);
    let cursor = parseIsoDate(booking.startDate);
    while (cursor.getTime() <= end.getTime()) {
      const key = isoDate(cursor);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return counts;
}

/** Unique equipment names on each day, in the order they first appear. */
function equipmentNamesByDate(
  bookings: Booking[],
  equipmentById: Map<string, Equipment>
): Map<string, string[]> {
  const names = new Map<string, string[]>();
  const seen = new Map<string, Set<string>>();
  for (const booking of bookings) {
    const label =
      equipmentById.get(booking.equipmentId)?.name ?? "Removed item";
    const end = parseIsoDate(booking.endDate);
    let cursor = parseIsoDate(booking.startDate);
    while (cursor.getTime() <= end.getTime()) {
      const key = isoDate(cursor);
      let ids = seen.get(key);
      if (!ids) {
        ids = new Set();
        seen.set(key, ids);
        names.set(key, []);
      }
      if (!ids.has(booking.equipmentId)) {
        ids.add(booking.equipmentId);
        names.get(key)?.push(label);
      }
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return names;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<CalendarScope>("all");
  const [labId, setLabId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [personId, setPersonId] = useState("");
  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [people, setPeople] = useState<CalendarPerson[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [granularity, setGranularity] = useState<CalendarGranularity>("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      const [labRows, equipmentRows, personRows] = await Promise.all([
        getLabs(),
        getAllEquipment(),
        getCalendarPeople(),
      ]);
      if (cancelled) return;
      setLabs(labRows);
      setEquipment(equipmentRows);
      const peopleWithSelf =
        user && !personRows.some((person) => person.userId === user.id)
          ? [
              ...personRows,
              { userId: user.id, label: user.username },
            ].sort((a, b) => a.label.localeCompare(b.label))
          : personRows;
      setPeople(peopleWithSelf);
      if (user) {
        setPersonId(user.id);
      } else if (peopleWithSelf[0]) {
        setPersonId(peopleWithSelf[0].userId);
      }
      if (labRows[0]) setLabId(labRows[0].id);
      const firstInFirstLab = labRows
        .map((lab) =>
          equipmentRows.find(
            (item) => item.labId === lab.id && item.category === "equipment"
          )
        )
        .find((item): item is Equipment => Boolean(item));
      if (firstInFirstLab) setEquipmentId(firstInFirstLab.id);
    }
    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filter = useMemo((): CalendarBookingFilter | null => {
    if (scope === "all") return { kind: "all" };
    if (scope === "lab") {
      if (!labId) return null;
      return { kind: "lab", labId };
    }
    if (scope === "equipment") {
      if (!equipmentId) return null;
      return { kind: "equipment", equipmentId };
    }
    if (!personId) return null;
    return { kind: "person", userId: personId };
  }, [scope, labId, equipmentId, personId]);

  useEffect(() => {
    if (!filter) return;
    let cancelled = false;
    setLoading(true);
    setBookings([]);
    getCalendarBookings(filter).then((rows) => {
      if (cancelled) return;
      setBookings(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const equipmentById = useMemo(() => {
    const map = new Map<string, Equipment>();
    for (const item of equipment) map.set(item.id, item);
    return map;
  }, [equipment]);

  const labById = useMemo(() => {
    const map = new Map<string, Lab>();
    for (const lab of labs) map.set(lab.id, lab);
    return map;
  }, [labs]);

  const personById = useMemo(() => {
    const map = new Map<string, string>();
    for (const person of people) map.set(person.userId, person.label);
    return map;
  }, [people]);

  const bookingCounts = useMemo(() => countByDate(bookings), [bookings]);
  const namesByDate = useMemo(
    () => equipmentNamesByDate(bookings, equipmentById),
    [bookings, equipmentById]
  );
  const showEquipmentOnDays = scope !== "equipment";
  const dayBookings = useMemo(
    () => bookingsOnDate(bookings, selectedDate),
    [bookings, selectedDate]
  );

  const equipmentByLab = useMemo(() => {
    return labs
      .map((lab) => ({
        lab,
        items: equipment.filter(
          (item) => item.labId === lab.id && item.category === "equipment"
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [labs, equipment]);

  if (!user) return null;

  function filterSummary(): string {
    if (scope === "lab") {
      const lab = labs.find((row) => row.id === labId);
      return lab
        ? `Every reservation in ${lab.name}.`
        : "Choose a lab to see its instruments.";
    }
    if (scope === "equipment") {
      const item = equipmentById.get(equipmentId);
      return item
        ? `Reservations for ${item.name}.`
        : "Choose an instrument.";
    }
    if (scope === "person") {
      const name = personById.get(personId) ?? "this person";
      return `What ${name} has booked.`;
    }
    return "Every reservation across the center.";
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page page-wide">
        <Link to="/labs" className="back-link">
          &larr; Main menu
        </Link>

        <div className="page-intro">
          <h2>Calendar</h2>
          <p className="muted">{filterSummary()}</p>
        </div>

        <div
          className="training-view-switch"
          role="tablist"
          aria-label="Calendar filters"
        >
          <button
            type="button"
            role="tab"
            aria-selected={scope === "all"}
            className={
              scope === "all"
                ? "training-view-btn training-view-btn-active"
                : "training-view-btn"
            }
            onClick={() => setScope("all")}
          >
            All reservations
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "lab"}
            className={
              scope === "lab"
                ? "training-view-btn training-view-btn-active"
                : "training-view-btn"
            }
            onClick={() => setScope("lab")}
          >
            A lab
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "equipment"}
            className={
              scope === "equipment"
                ? "training-view-btn training-view-btn-active"
                : "training-view-btn"
            }
            onClick={() => setScope("equipment")}
          >
            One instrument
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "person"}
            className={
              scope === "person"
                ? "training-view-btn training-view-btn-active"
                : "training-view-btn"
            }
            onClick={() => setScope("person")}
          >
            A person
          </button>
        </div>

        <div className="schedule-toolbar">
        <div className="activity-filters">
          {scope === "lab" && (
            <label className="field field-inline">
              <span>Lab</span>
              <select
                value={labId}
                onChange={(event) => setLabId(event.target.value)}
              >
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {scope === "equipment" && (
            <label className="field field-inline">
              <span>Instrument</span>
              <select
                value={equipmentId}
                onChange={(event) => setEquipmentId(event.target.value)}
              >
                {equipmentByLab.map(({ lab, items }) => (
                  <optgroup key={lab.id} label={lab.name}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          )}
          {scope === "person" && (
            <label className="field field-inline">
              <span>Person</span>
              <select
                value={personId}
                onChange={(event) => setPersonId(event.target.value)}
              >
                {people.map((person) => (
                  <option key={person.userId} value={person.userId}>
                    {person.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
          <div
            className="training-view-switch schedule-granularity"
            role="tablist"
            aria-label="Calendar granularity"
          >
            <button
              type="button"
              role="tab"
              aria-selected={granularity === "monthly"}
              className={
                granularity === "monthly"
                  ? "training-view-btn training-view-btn-active"
                  : "training-view-btn"
              }
              onClick={() => setGranularity("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={granularity === "daily"}
              className={
                granularity === "daily"
                  ? "training-view-btn training-view-btn-active"
                  : "training-view-btn"
              }
              onClick={() => setGranularity("daily")}
            >
              Daily
            </button>
          </div>
        </div>

        {granularity === "daily" ? (
          <ScheduleDayView
            date={selectedDate}
            onDateChange={setSelectedDate}
            bookings={dayBookings}
            equipmentById={equipmentById}
            labById={labById}
            personById={personById}
            loading={loading}
          />
        ) : (
        <div
          className={
            showEquipmentOnDays
              ? "schedule-layout schedule-layout-named"
              : "schedule-layout"
          }
        >
          <ScheduleCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            bookingCountByDate={bookingCounts}
            equipmentNamesByDate={showEquipmentOnDays ? namesByDate : undefined}
          />

          <section className="schedule-day-panel" aria-live="polite">
            <div className="schedule-day-panel-head">
              <h3>{formatDayLabel(selectedDate)}</h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setGranularity("daily")}
              >
                Daily view
              </button>
            </div>
            {loading ? (
              <p className="muted">Loading...</p>
            ) : dayBookings.length === 0 ? (
              <p className="muted">No reservations on this day for the current filter.</p>
            ) : (
              <ul className="schedule-booking-list">
                {dayBookings.map((booking) => {
                  const item = equipmentById.get(booking.equipmentId);
                  const lab = item?.labId ? labById.get(item.labId) : undefined;
                  const who =
                    personById.get(booking.userId) ?? booking.userName;
                  return (
                    <li key={booking.id} className="schedule-booking-row">
                      <div>
                        <strong>
                          {item ? (
                            <Link to={`/equipment/${item.id}`}>{item.name}</Link>
                          ) : (
                            "Removed item"
                          )}
                        </strong>
                        {lab && <p className="muted">{lab.name}</p>}
                        <p className="muted">{formatBookingWhen(booking)}</p>
                      </div>
                      <span className="schedule-booking-who">{who}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
        )}
      </main>
    </div>
  );
}
