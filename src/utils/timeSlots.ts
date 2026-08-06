import type { Booking, RentalGranularity } from "../types";
import { bookingCoversDate, formatDateRange } from "./dates";

/** Granularities that are reserved as time slots within a single day. */
export type SlotGranularity = Extract<RentalGranularity, "30min" | "hourly">;

export function isSlotGranularity(
  granularity: RentalGranularity
): granularity is SlotGranularity {
  return granularity === "30min" || granularity === "hourly";
}

export function slotMinutes(granularity: SlotGranularity): number {
  return granularity === "30min" ? 30 : 60;
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nextHour = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const nextMinute = String(wrapped % 60).padStart(2, "0");
  return `${nextHour}:${nextMinute}`;
}

/** Slot start times covering a full day, e.g. 00:00, 00:30, ... 23:30. */
export function buildDaySlots(stepMinutes: number): string[] {
  const slots: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
  }
  return slots;
}

/** 24-hour "14:30" -> "2:30 PM". */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

/** Date range plus the time window when the reservation is slot-based. */
export function formatBookingWhen(booking: {
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
}): string {
  const days = formatDateRange(booking.startDate, booking.endDate);
  return booking.startTime && booking.endTime
    ? `${days} · ${formatTimeRange(booking.startTime, booking.endTime)}`
    : days;
}

/**
 * Collapses picked slot start times into the fewest back-to-back blocks, so
 * 9:00 + 9:30 + 11:00 becomes 9:00–10:00 and 11:00–11:30.
 */
export function mergeContiguousSlots(
  startTimes: string[],
  stepMinutes: number
): { startTime: string; endTime: string }[] {
  const sorted = [...new Set(startTimes)].sort();
  const blocks: { startTime: string; endTime: string }[] = [];
  for (const start of sorted) {
    const last = blocks[blocks.length - 1];
    if (last && last.endTime === start) {
      last.endTime = addMinutesToTime(start, stepMinutes);
    } else {
      blocks.push({
        startTime: start,
        endTime: addMinutesToTime(start, stepMinutes),
      });
    }
  }
  return blocks;
}

/**
 * A slot is taken when an existing booking covers that day and either has no
 * times (a whole-day reservation) or overlaps the slot.
 */
export function isSlotBooked(
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string
): boolean {
  return bookings.some((booking) => {
    if (!bookingCoversDate(booking, date)) return false;
    if (!booking.startTime || !booking.endTime) return true;
    return booking.startTime < endTime && booking.endTime > startTime;
  });
}
