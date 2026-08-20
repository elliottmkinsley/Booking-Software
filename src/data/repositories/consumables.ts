/**
 * Consumables (lab-wide or tied to one equipment item).
 */
import type { Consumable } from "../../shared/types";
import { nextId, persist, store } from "../mockStore";

export async function listConsumablesForLab(
  labId: string
): Promise<Consumable[]> {
  return store.consumables.filter(
    (item) => item.labId === labId && item.equipmentId === null
  );
}

export async function listConsumablesForEquipment(
  equipmentId: string
): Promise<Consumable[]> {
  return store.consumables.filter((item) => item.equipmentId === equipmentId);
}

export async function getConsumable(
  consumableId: string
): Promise<Consumable | undefined> {
  return store.consumables.find((item) => item.id === consumableId);
}

export async function insertConsumable(
  input: Omit<Consumable, "id">
): Promise<Consumable> {
  const consumable: Consumable = { ...input, id: nextId("cons") };
  store.consumables.push(consumable);
  persist();
  return consumable;
}

export async function saveConsumable(item: Consumable): Promise<Consumable> {
  const index = store.consumables.findIndex((row) => row.id === item.id);
  if (index === -1) {
    throw new Error("Consumable not found.");
  }
  store.consumables[index] = item;
  persist();
  return item;
}

export async function deleteConsumable(
  consumableId: string
): Promise<Consumable | undefined> {
  const item = store.consumables.find((row) => row.id === consumableId);
  if (!item) return undefined;
  store.consumables = store.consumables.filter((row) => row.id !== consumableId);
  persist();
  return item;
}
