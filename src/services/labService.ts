import type { Equipment, EquipmentCategory, Lab } from "../types";
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

export async function addEquipment(input: {
  labId: string | null;
  name: string;
  description: string;
  category: EquipmentCategory;
}): Promise<Equipment> {
  const item: Equipment = {
    id: nextId("eq"),
    labId: input.labId,
    name: input.name,
    description: input.description,
    category: input.category,
    status: "available",
    // Detail fields are filled in later by the owning lab; the equipment page
    // renders empty states for whatever is missing.
    imageUrl: null,
    trainingIds: [],
    ownerId: null,
    trainerIds: [],
    userGuideUrl: null,
  };
  store.equipment.push(item);
  persist();
  return item;
}
