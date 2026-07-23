import type { Booking } from "../types";
import { nextId, persist, store } from "./mockStore";

// MOCK IMPLEMENTATION - replace bodies with fetch() calls when the API exists.

export async function getBookingsForEquipment(
  equipmentId: string
): Promise<Booking[]> {
  return store.bookings.filter((b) => b.equipmentId === equipmentId);
}

export async function createBooking(input: {
  equipmentId: string;
  userId: string;
  startDate: string;
  endDate: string;
}): Promise<Booking> {
  const booking: Booking = {
    id: nextId("booking"),
    ...input,
  };
  store.bookings.push(booking);
  persist();
  return booking;
}
