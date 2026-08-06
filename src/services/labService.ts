import type {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  Lab,
  RentalGranularity,
  User,
} from "../types";
import { logActivity } from "./activityService";
import { nextId, persist, store } from "./mockStore";

// MOCK IMPLEMENTATION - replace bodies with fetch() calls when the API exists.

export async function getLabs(): Promise<Lab[]> {
  return [...store.labs];
}

export async function getLab(labId: string): Promise<Lab | undefined> {
  return store.labs.find((lab) => lab.id === labId);
}

export async function getEquipment(
  equipmentId: string
): Promise<Equipment | undefined> {
  return store.equipment.find((item) => item.id === equipmentId);
}

export async function getEquipmentForLab(labId: string): Promise<Equipment[]> {
  return store.equipment.filter((item) => item.labId === labId);
}

export async function getEquipmentCountForLab(labId: string): Promise<number> {
  return store.equipment.filter((item) => item.labId === labId).length;
}

// Software is shared across labs, so it lives outside any lab (labId === null).

export async function getSoftware(): Promise<Equipment[]> {
  return store.equipment.filter((item) => item.labId === null);
}

export async function addEquipment(
  input: {
    labId: string | null;
    name: string;
    description: string;
    category: EquipmentCategory;
    trainingIds?: string[];
    rentalGranularity?: RentalGranularity;
    imageUrl?: string | null;
    downloadUrl?: string | null;
    accessInstructions?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
  },
  actor: User
): Promise<Equipment> {
  const isSoftware = input.category === "software";
  const validTrainingIds = isSoftware
    ? []
    : (input.trainingIds ?? []).filter((id) =>
        store.trainings.some((training) => training.id === id)
      );
  const item: Equipment = {
    id: nextId("eq"),
    labId: input.labId,
    name: input.name,
    description: input.description,
    category: input.category,
    status: "available",
    imageUrl: input.imageUrl ?? null,
    rentalGranularity: input.rentalGranularity ?? "daily",
    trainingIds: validTrainingIds,
    ownerId: null,
    trainerIds: [],
    userGuideUrl: null,
    downloadUrl: isSoftware ? (input.downloadUrl?.trim() || null) : null,
    accessInstructions: isSoftware
      ? (input.accessInstructions?.trim() || null)
      : null,
    contactName: isSoftware ? (input.contactName?.trim() || null) : null,
    contactEmail: isSoftware ? (input.contactEmail?.trim() || null) : null,
  };
  store.equipment.push(item);
  persist();
  if (input.labId === null) {
    logActivity(
      actor,
      "addSoftware",
      `Added ${item.name} to the shared software list`
    );
  } else {
    const lab = store.labs.find((l) => l.id === input.labId);
    logActivity(
      actor,
      "addEquipment",
      `Added ${item.name} to ${lab?.name ?? "a lab"}`
    );
  }
  return item;
}

export interface EquipmentBatchInput {
  name: string;
  description: string;
  status: EquipmentStatus;
  rentalGranularity: RentalGranularity;
  trainingIds: string[];
  trainerIds: string[];
  ownerId: string | null;
  userGuideUrl: string | null;
}

/**
 * Creates many equipment items at once (spreadsheet import). Logs a single
 * activity entry for the batch instead of one per row.
 */
export async function addEquipmentBatch(
  labId: string,
  inputs: EquipmentBatchInput[],
  actor: User
): Promise<Equipment[]> {
  const lab = store.labs.find((item) => item.id === labId);
  if (!lab) {
    throw new Error("Lab not found.");
  }
  const created = inputs.map<Equipment>((input) => ({
    id: nextId("eq"),
    labId,
    name: input.name,
    description: input.description,
    category: "equipment",
    status: input.status,
    imageUrl: null,
    rentalGranularity: input.rentalGranularity,
    trainingIds: input.trainingIds,
    ownerId: input.ownerId,
    trainerIds: input.trainerIds,
    userGuideUrl: input.userGuideUrl,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  }));
  store.equipment.push(...created);
  persist();
  logActivity(
    actor,
    "importEquipment",
    `Imported ${created.length} ${
      created.length === 1 ? "item" : "items"
    } into ${lab.name} from a spreadsheet`
  );
  return created;
}

export async function updateEquipment(
  equipmentId: string,
  input: {
    name: string;
    description: string;
    rentalGranularity?: RentalGranularity;
    imageUrl?: string | null;
    downloadUrl?: string | null;
    accessInstructions?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
  },
  actor: User
): Promise<Equipment> {
  const item = store.equipment.find((eq) => eq.id === equipmentId);
  if (!item) {
    throw new Error("Item not found.");
  }
  const name = input.name.trim();
  if (!name) {
    throw new Error("Name is required.");
  }
  item.name = name;
  item.description = input.description.trim();
  if (input.rentalGranularity && item.category !== "software") {
    item.rentalGranularity = input.rentalGranularity;
  }
  if (input.imageUrl !== undefined) {
    item.imageUrl = input.imageUrl;
  }
  if (item.category === "software") {
    if (input.downloadUrl !== undefined) {
      item.downloadUrl = input.downloadUrl?.trim() || null;
    }
    if (input.accessInstructions !== undefined) {
      item.accessInstructions = input.accessInstructions?.trim() || null;
    }
    if (input.contactName !== undefined) {
      item.contactName = input.contactName?.trim() || null;
    }
    if (input.contactEmail !== undefined) {
      item.contactEmail = input.contactEmail?.trim() || null;
    }
  }
  persist();
  logActivity(
    actor,
    item.labId === null ? "updateSoftware" : "updateEquipment",
    `Updated ${item.name}`
  );
  return item;
}

export async function removeEquipment(
  equipmentId: string,
  actor: User
): Promise<void> {
  const item = store.equipment.find((eq) => eq.id === equipmentId);
  if (!item) {
    throw new Error("Item not found.");
  }
  store.equipment = store.equipment.filter((eq) => eq.id !== equipmentId);
  persist();
  logActivity(
    actor,
    item.labId === null ? "removeSoftware" : "removeEquipment",
    `Removed ${item.name}`
  );
}

/** Replace the required-training list on one equipment/software item. */
export async function setEquipmentTrainings(
  equipmentId: string,
  trainingIds: string[],
  actor: User
): Promise<Equipment> {
  const item = store.equipment.find((eq) => eq.id === equipmentId);
  if (!item) {
    throw new Error("Equipment not found.");
  }
  const validTrainingIds = trainingIds.filter((id) =>
    store.trainings.some((training) => training.id === id)
  );
  item.trainingIds = validTrainingIds;
  persist();

  const names = validTrainingIds
    .map((id) => store.trainings.find((training) => training.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  logActivity(
    actor,
    "setEquipmentTrainings",
    names.length === 0
      ? `Cleared training requirements on ${item.name}`
      : `Set training requirements on ${item.name}: ${names.join(", ")}`
  );
  return item;
}

/** Replace certified trainers on one equipment/software item (Account ids). */
export async function setEquipmentTrainers(
  equipmentId: string,
  trainerAccountIds: string[],
  actor: User
): Promise<Equipment> {
  const item = store.equipment.find((eq) => eq.id === equipmentId);
  if (!item) {
    throw new Error("Equipment not found.");
  }
  const validTrainerIds = trainerAccountIds.filter((id) =>
    store.trainerAccountIds.includes(id)
  );
  item.trainerIds = validTrainerIds;
  persist();

  const names = validTrainerIds
    .map((id) => store.accounts.find((account) => account.id === id)?.displayName)
    .filter((name): name is string => Boolean(name));
  logActivity(
    actor,
    "setEquipmentTrainers",
    names.length === 0
      ? `Cleared trainers on ${item.name}`
      : `Set trainers on ${item.name}: ${names.join(", ")}`
  );
  return item;
}

export async function addLab(
  input: {
    name: string;
    description: string;
    imageUrl?: string | null;
  },
  actor: User
): Promise<Lab> {
  const lab: Lab = {
    id: nextId("lab"),
    name: input.name.trim(),
    description: input.description.trim(),
    imageUrl: input.imageUrl ?? null,
  };
  store.labs.push(lab);
  persist();
  logActivity(actor, "addLab", `Created lab ${lab.name}`);
  return lab;
}

export async function updateLab(
  labId: string,
  input: {
    name: string;
    description: string;
    imageUrl?: string | null;
  },
  actor: User
): Promise<Lab> {
  const lab = store.labs.find((item) => item.id === labId);
  if (!lab) {
    throw new Error("Lab not found.");
  }
  const name = input.name.trim();
  if (!name) {
    throw new Error("Lab name is required.");
  }
  lab.name = name;
  lab.description = input.description.trim();
  if (input.imageUrl !== undefined) {
    lab.imageUrl = input.imageUrl;
  }
  persist();
  logActivity(actor, "updateLab", `Updated lab ${lab.name}`);
  return lab;
}

/**
 * Removes a lab, its equipment, and clears it from manager assignments.
 * Bookings for removed equipment stay in the store (orphaned) until a
 * real cascade delete exists on the backend.
 */
export async function removeLab(labId: string, actor: User): Promise<void> {
  const lab = store.labs.find((item) => item.id === labId);
  if (!lab) {
    throw new Error("Lab not found.");
  }

  store.labs = store.labs.filter((item) => item.id !== labId);
  store.equipment = store.equipment.filter((item) => item.labId !== labId);

  for (const accountId of Object.keys(store.labManagerLabIds)) {
    store.labManagerLabIds[accountId] = (
      store.labManagerLabIds[accountId] ?? []
    ).filter((id) => id !== labId);
  }

  persist();
  logActivity(actor, "removeLab", `Removed lab ${lab.name}`);
}
