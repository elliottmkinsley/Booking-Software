import {
  seedBookings,
  seedEquipment,
  seedLabs,
  seedPeople,
  seedTrainings,
} from "../data/mockData";
import type { Booking, Equipment, Lab, Person, Training } from "../types";

// In-memory store shared by the mock services. Persisted to sessionStorage so
// added equipment and bookings survive page refreshes during a session.
// This entire file goes away once the Azure API exists.

interface StoreShape {
  labs: Lab[];
  equipment: Equipment[];
  bookings: Booking[];
  people: Person[];
  trainings: Training[];
}

// Bump the version suffix whenever the seed data shape changes so stale
// sessionStorage copies are discarded.
const STORAGE_KEY = "radiant-mock-store-v3";

function load(): StoreShape {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as StoreShape;
    } catch {
      // fall through to seed
    }
  }
  return {
    labs: [...seedLabs],
    equipment: [...seedEquipment],
    bookings: [...seedBookings],
    people: [...seedPeople],
    trainings: [...seedTrainings],
  };
}

export const store: StoreShape = load();

export function persist(): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

let idCounter = Date.now();
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
