/**
 * Reservations. Swap for GET/POST /api/equipment/{id}/bookings later.
 */
import type { Booking } from "../../shared/types";
import { nextId, persist, store } from "../mockStore";

export async function listBookings(): Promise<Booking[]> {
  return [...store.bookings];
}

export async function listBookingsForEquipment(
  equipmentId: string
): Promise<Booking[]> {
  return store.bookings.filter((booking) => booking.equipmentId === equipmentId);
}

export async function listBookingsForUser(userId: string): Promise<Booking[]> {
  return store.bookings.filter((booking) => booking.userId === userId);
}

export async function insertBookings(
  inputs: Omit<Booking, "id">[]
): Promise<Booking[]> {
  const created = inputs.map((input) => {
    const booking: Booking = { ...input, id: nextId("booking") };
    store.bookings.push(booking);
    return booking;
  });
  persist();
  return created;
}
