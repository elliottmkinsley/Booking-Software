/**
 * Equipment and shared software (category discriminator, labId null = software).
 */
import type { Equipment } from "../../shared/types";
import { nextId, persist, store } from "../mockStore";

export async function listEquipment(): Promise<Equipment[]> {
  return [...store.equipment];
}

export async function getEquipment(
  equipmentId: string
): Promise<Equipment | undefined> {
  return store.equipment.find((item) => item.id === equipmentId);
}

export async function listEquipmentForLab(labId: string): Promise<Equipment[]> {
  return store.equipment.filter((item) => item.labId === labId);
}

export async function countEquipmentForLab(labId: string): Promise<number> {
  return store.equipment.filter((item) => item.labId === labId).length;
}

export async function listSoftware(): Promise<Equipment[]> {
  return store.equipment.filter((item) => item.labId === null);
}

export async function listEquipmentRequiringTraining(
  trainingId: string
): Promise<Equipment[]> {
  return store.equipment.filter((item) => item.trainingIds.includes(trainingId));
}

export async function insertEquipment(
  item: Omit<Equipment, "id">
): Promise<Equipment> {
  const created: Equipment = { ...item, id: nextId("eq") };
  store.equipment.push(created);
  persist();
  return created;
}

export async function insertEquipmentBatch(
  items: Omit<Equipment, "id">[]
): Promise<Equipment[]> {
  const created = items.map<Equipment>((item) => ({
    ...item,
    id: nextId("eq"),
  }));
  store.equipment.push(...created);
  persist();
  return created;
}

export async function saveEquipment(item: Equipment): Promise<Equipment> {
  const index = store.equipment.findIndex((eq) => eq.id === item.id);
  if (index === -1) {
    throw new Error("Item not found.");
  }
  store.equipment[index] = item;
  persist();
  return item;
}

export async function deleteEquipment(
  equipmentId: string
): Promise<Equipment | undefined> {
  const item = store.equipment.find((eq) => eq.id === equipmentId);
  if (!item) return undefined;
  store.equipment = store.equipment.filter((eq) => eq.id !== equipmentId);
  persist();
  return item;
}

export async function setEquipmentTrainingIds(
  equipmentId: string,
  trainingIds: string[]
): Promise<Equipment | undefined> {
  const item = store.equipment.find((eq) => eq.id === equipmentId);
  if (!item) return undefined;
  item.trainingIds = trainingIds;
  persist();
  return item;
}

export async function setEquipmentTrainerIds(
  equipmentId: string,
  trainerIds: string[]
): Promise<Equipment | undefined> {
  const item = store.equipment.find((eq) => eq.id === equipmentId);
  if (!item) return undefined;
  item.trainerIds = trainerIds;
  persist();
  return item;
}

export async function removeTrainerFromAllEquipment(
  accountId: string
): Promise<void> {
  for (const item of store.equipment) {
    item.trainerIds = item.trainerIds.filter((id) => id !== accountId);
  }
  persist();
}

export async function removeTrainingFromAllEquipment(
  trainingId: string
): Promise<void> {
  for (const item of store.equipment) {
    item.trainingIds = item.trainingIds.filter((id) => id !== trainingId);
  }
  persist();
}
