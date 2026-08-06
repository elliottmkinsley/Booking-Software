import type { Booking, User } from "../types";
import { logActivity } from "./activityService";
import { nextId, persist, store } from "./mockStore";

// MOCK IMPLEMENTATION - replace bodies with fetch() calls when the API exists.

export async function getBookingsForEquipment(
  equipmentId: string
): Promise<Booking[]> {
  return store.bookings.filter((b) => b.equipmentId === equipmentId);
}

export async function getBookingsForUser(userId: string): Promise<Booking[]> {
  return store.bookings
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
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

/**
 * One reservation per selected block. Logged as a single activity event so a
 * multi-slot pick does not flood the audit trail.
 */
export async function createBookings(
  inputs: BookingInput[],
  actor: User
): Promise<Booking[]> {
  if (inputs.length === 0) {
    throw new Error("Select at least one slot to reserve.");
  }

  const created = inputs.map((input) => {
    const booking: Booking = {
      id: nextId("booking"),
      equipmentId: input.equipmentId,
      userId: input.userId,
      userName: input.userName,
      startDate: input.startDate,
      endDate: input.endDate,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
    };
    store.bookings.push(booking);
    return booking;
  });
  persist();

  const item = store.equipment.find((eq) => eq.id === inputs[0].equipmentId);
  const detail = created
    .map((booking) => describeBooking(booking))
    .join("; ");
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
