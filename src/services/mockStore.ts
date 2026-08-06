import {
  seedAccounts,
  seedActivities,
  seedBookings,
  seedConsumables,
  seedEquipment,
  seedLabManagerAccountIds,
  seedLabManagerLabIds,
  seedLabs,
  seedPeople,
  seedTrainerAccountIds,
  seedTrainings,
} from "../data/mockData";
import type {
  Account,
  ActivityEvent,
  AppNotification,
  Booking,
  Consumable,
  Equipment,
  Lab,
  Person,
  Training,
  TrainingAccessRequest,
} from "../types";

interface StoreShape {
  labs: Lab[];
  equipment: Equipment[];
  bookings: Booking[];
  people: Person[];
  trainings: Training[];
  accounts: Account[];
  labManagerAccountIds: string[];
  /** accountId -> labIds they manage */
  labManagerLabIds: Record<string, string[]>;
  /** Accounts certified to train others on equipment */
  trainerAccountIds: string[];
  activities: ActivityEvent[];
  trainingAccessRequests: TrainingAccessRequest[];
  /** userId -> trainingIds the user added to "Your trainings" */
  userTrainingIds: Record<string, string[]>;
  /** userId -> trainingIds approved by a reviewer (counts as completed) */
  approvedTrainingIds: Record<string, string[]>;
  consumables: Consumable[];
  notifications: AppNotification[];
}

const STORAGE_KEY = "radiant-mock-store-v18";

function isValidStore(data: unknown): data is StoreShape {
  if (!data || typeof data !== "object") return false;
  const candidate = data as StoreShape;
  return (
    Array.isArray(candidate.labs) &&
    Array.isArray(candidate.equipment) &&
    candidate.equipment.every(
      (item) =>
        typeof item.rentalGranularity === "string" &&
        "downloadUrl" in item &&
        "accessInstructions" in item &&
        "contactName" in item &&
        "contactEmail" in item
    ) &&
    Array.isArray(candidate.bookings) &&
    candidate.bookings.every((booking) => "startTime" in booking) &&
    Array.isArray(candidate.accounts) &&
    Array.isArray(candidate.labManagerAccountIds) &&
    candidate.labManagerLabIds !== null &&
    typeof candidate.labManagerLabIds === "object" &&
    Array.isArray(candidate.trainerAccountIds) &&
    Array.isArray(candidate.activities) &&
    Array.isArray(candidate.trainingAccessRequests) &&
    candidate.userTrainingIds !== null &&
    typeof candidate.userTrainingIds === "object" &&
    candidate.approvedTrainingIds !== null &&
    typeof candidate.approvedTrainingIds === "object" &&
    Array.isArray(candidate.consumables) &&
    candidate.consumables.every((item) => "imageUrl" in item) &&
    Array.isArray(candidate.notifications) &&
    candidate.notifications.every((item) => "trainingId" in item) &&
    Array.isArray(candidate.trainings) &&
    candidate.trainings.every(
      (training) => typeof training.howToComplete === "string"
    )
  );
}

function load(): StoreShape {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isValidStore(parsed)) {
        return parsed;
      }
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
    accounts: [...seedAccounts],
    labManagerAccountIds: [...seedLabManagerAccountIds],
    labManagerLabIds: { ...seedLabManagerLabIds },
    trainerAccountIds: [...seedTrainerAccountIds],
    activities: [...seedActivities],
    trainingAccessRequests: [],
    userTrainingIds: {},
    approvedTrainingIds: {},
    consumables: [...seedConsumables],
    notifications: [],
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
