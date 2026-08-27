/**
 * Labs, equipment, and shared software.
 */
import { getAccount } from "../data/repositories/accounts";
import {
  countEquipmentForLab,
  deleteEquipment,
  getEquipment as getEquipmentRow,
  insertEquipment,
  insertEquipmentBatch,
  listEquipment,
  listEquipmentForLab,
  listSoftware,
  saveEquipment,
  setEquipmentTrainerIds,
  setEquipmentTrainingIds,
} from "../data/repositories/equipment";
import {
  deleteLab,
  getLab as getLabRow,
  insertLab,
  listLabs,
  updateLab as updateLabRow,
} from "../data/repositories/labs";
import { isTrainerAccount } from "../data/repositories/trainers";
import { getTraining, listTrainings } from "../data/repositories/trainings";
import type {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  Lab,
  RentalGranularity,
  User,
} from "../shared/types";
import { logActivity } from "./activity";

export async function getLabs(): Promise<Lab[]> {
  return listLabs();
}

export async function getLab(labId: string): Promise<Lab | undefined> {
  return getLabRow(labId);
}

export async function getEquipment(
  equipmentId: string
): Promise<Equipment | undefined> {
  return getEquipmentRow(equipmentId);
}

export async function getEquipmentForLab(labId: string): Promise<Equipment[]> {
  return listEquipmentForLab(labId);
}

export async function getEquipmentCountForLab(labId: string): Promise<number> {
  return countEquipmentForLab(labId);
}

export async function getSoftware(): Promise<Equipment[]> {
  return listSoftware();
}

export async function getAllEquipment(): Promise<Equipment[]> {
  return listEquipment();
}

/** Instruments that can be reserved (software is not booked on the calendar). */
export async function getBookableEquipment(): Promise<Equipment[]> {
  return (await listEquipment())
    .filter((item) => item.category === "equipment")
    .sort((a, b) => a.name.localeCompare(b.name));
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
  const catalog = await listTrainings();
  const validTrainingIds = isSoftware
    ? []
    : (input.trainingIds ?? []).filter((id) =>
        catalog.some((training) => training.id === id)
      );
  const item = await insertEquipment({
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
  });
  if (input.labId === null) {
    logActivity(
      actor,
      "addSoftware",
      `Added ${item.name} to the shared software list`
    );
  } else {
    const lab = await getLabRow(input.labId);
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

export async function addEquipmentBatch(
  labId: string,
  inputs: EquipmentBatchInput[],
  actor: User
): Promise<Equipment[]> {
  const lab = await getLabRow(labId);
  if (!lab) {
    throw new Error("Lab not found.");
  }
  const created = await insertEquipmentBatch(
    inputs.map((input) => ({
      labId,
      name: input.name,
      description: input.description,
      category: "equipment" as const,
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
    }))
  );
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
  const item = await getEquipmentRow(equipmentId);
  if (!item) {
    throw new Error("Item not found.");
  }
  const name = input.name.trim();
  if (!name) {
    throw new Error("Name is required.");
  }
  const next: Equipment = {
    ...item,
    name,
    description: input.description.trim(),
  };
  if (input.rentalGranularity && item.category !== "software") {
    next.rentalGranularity = input.rentalGranularity;
  }
  if (input.imageUrl !== undefined) {
    next.imageUrl = input.imageUrl;
  }
  if (item.category === "software") {
    if (input.downloadUrl !== undefined) {
      next.downloadUrl = input.downloadUrl?.trim() || null;
    }
    if (input.accessInstructions !== undefined) {
      next.accessInstructions = input.accessInstructions?.trim() || null;
    }
    if (input.contactName !== undefined) {
      next.contactName = input.contactName?.trim() || null;
    }
    if (input.contactEmail !== undefined) {
      next.contactEmail = input.contactEmail?.trim() || null;
    }
  }
  await saveEquipment(next);
  logActivity(
    actor,
    item.labId === null ? "updateSoftware" : "updateEquipment",
    `Updated ${next.name}`
  );
  return next;
}

export async function removeEquipment(
  equipmentId: string,
  actor: User
): Promise<void> {
  const item = await deleteEquipment(equipmentId);
  if (!item) {
    throw new Error("Item not found.");
  }
  logActivity(
    actor,
    item.labId === null ? "removeSoftware" : "removeEquipment",
    `Removed ${item.name}`
  );
}

export async function setEquipmentTrainings(
  equipmentId: string,
  trainingIds: string[],
  actor: User
): Promise<Equipment> {
  const catalog = await listTrainings();
  const validTrainingIds = trainingIds.filter((id) =>
    catalog.some((training) => training.id === id)
  );
  const item = await setEquipmentTrainingIds(equipmentId, validTrainingIds);
  if (!item) {
    throw new Error("Equipment not found.");
  }

  const names = (
    await Promise.all(validTrainingIds.map((id) => getTraining(id)))
  )
    .map((training) => training?.name)
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

export async function setEquipmentTrainers(
  equipmentId: string,
  trainerAccountIds: string[],
  actor: User
): Promise<Equipment> {
  const validTrainerIds: string[] = [];
  for (const id of trainerAccountIds) {
    if (await isTrainerAccount(id)) validTrainerIds.push(id);
  }
  const item = await setEquipmentTrainerIds(equipmentId, validTrainerIds);
  if (!item) {
    throw new Error("Equipment not found.");
  }

  const names = (
    await Promise.all(validTrainerIds.map((id) => getAccount(id)))
  )
    .map((account) => account?.displayName)
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
  const lab = await insertLab({
    name: input.name.trim(),
    description: input.description.trim(),
    imageUrl: input.imageUrl ?? null,
  });
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
  const name = input.name.trim();
  if (!name) {
    throw new Error("Lab name is required.");
  }
  const lab = await updateLabRow(labId, {
    name,
    description: input.description.trim(),
    imageUrl: input.imageUrl,
  });
  if (!lab) {
    throw new Error("Lab not found.");
  }
  logActivity(actor, "updateLab", `Updated lab ${lab.name}`);
  return lab;
}

export async function removeLab(labId: string, actor: User): Promise<void> {
  const lab = await deleteLab(labId);
  if (!lab) {
    throw new Error("Lab not found.");
  }
  logActivity(actor, "removeLab", `Removed lab ${lab.name}`);
}
