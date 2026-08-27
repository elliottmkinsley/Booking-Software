/**
 * Reservations on equipment (days or time slots).
 */
import { listAccounts } from "../data/repositories/accounts";
import {
  insertBookings,
  listBookings,
  listBookingsForEquipment,
  listBookingsForUser,
} from "../data/repositories/bookings";
import { getEquipment, listEquipmentForLab } from "../data/repositories/equipment";
import type { Booking, User } from "../shared/types";
import { logActivity } from "./activity";

/** How the shared calendar decides which reservations to show. */
export type CalendarBookingFilter =
  | { kind: "all" }
  | { kind: "lab"; labId: string }
  | { kind: "equipment"; equipmentId: string }
  | { kind: "person"; userId: string };

/** Someone who can appear in the calendar person filter. */
export interface CalendarPerson {
  userId: string;
  label: string;
}

export async function getAllBookings(): Promise<Booking[]> {
  return listBookings();
}

export async function getBookingsForLab(labId: string): Promise<Booking[]> {
  const equipmentIds = new Set(
    (await listEquipmentForLab(labId)).map((item) => item.id)
  );
  return (await listBookings()).filter((booking) =>
    equipmentIds.has(booking.equipmentId)
  );
}

export async function getCalendarBookings(
  filter: CalendarBookingFilter
): Promise<Booking[]> {
  if (filter.kind === "lab") return getBookingsForLab(filter.labId);
  if (filter.kind === "equipment") {
    return getBookingsForEquipment(filter.equipmentId);
  }
  if (filter.kind === "person") return getBookingsForUser(filter.userId);
  return getAllBookings();
}

/**
 * Directory people plus anyone who already has a reservation, so you can
 * look up a schedule even if that person has nothing booked yet.
 */
export async function getCalendarPeople(): Promise<CalendarPerson[]> {
  const [accounts, bookings] = await Promise.all([
    listAccounts(),
    listBookings(),
  ]);
  const labels = new Map<string, string>();

  for (const account of accounts) {
    labels.set(
      `user-${account.username.toLowerCase()}`,
      account.displayName
    );
  }
  for (const booking of bookings) {
    if (!labels.has(booking.userId)) {
      labels.set(booking.userId, booking.userName);
    }
  }

  return [...labels.entries()]
    .map(([userId, label]) => ({ userId, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getBookingsForEquipment(
  equipmentId: string
): Promise<Booking[]> {
  return listBookingsForEquipment(equipmentId);
}

export async function getBookingsForUser(userId: string): Promise<Booking[]> {
  return (await listBookingsForUser(userId)).sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  );
}

export interface BookingInput {
  equipmentId: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
}

export async function createBooking(
  input: BookingInput,
  actor: User
): Promise<Booking> {
  const [booking] = await createBookings([input], actor);
  return booking;
}

export async function createBookings(
  inputs: BookingInput[],
  actor: User
): Promise<Booking[]> {
  if (inputs.length === 0) {
    throw new Error("Select at least one slot to reserve.");
  }

  const created = await insertBookings(
    inputs.map((input) => ({
      equipmentId: input.equipmentId,
      userId: input.userId,
      userName: input.userName,
      startDate: input.startDate,
      endDate: input.endDate,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
    }))
  );

  const item = await getEquipment(inputs[0].equipmentId);
  const detail = created.map((booking) => describeBooking(booking)).join("; ");
  logActivity(
    actor,
    "createBooking",
    `Reserved ${item?.name ?? "equipment"} (${detail})`
  );
  return created;
}

function describeBooking(booking: Booking): string {
  const days =
    booking.startDate === booking.endDate
      ? booking.startDate
      : `${booking.startDate} to ${booking.endDate}`;
  return booking.startTime && booking.endTime
    ? `${days} ${booking.startTime}–${booking.endTime}`
    : days;
}
