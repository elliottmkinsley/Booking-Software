/**
 * Reservations on equipment (days or time slots).
 */
import { insertBookings, listBookingsForEquipment, listBookingsForUser } from "../data/repositories/bookings";
import { getEquipment } from "../data/repositories/equipment";
import type { Booking, User } from "../shared/types";
import { logActivity } from "./activity";

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
