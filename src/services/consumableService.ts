import type { Consumable, User } from "../types";
import { logActivity } from "./activityService";
import { nextId, persist, store } from "./mockStore";
import { createConsumableLowNotification } from "./notificationService";

// MOCK IMPLEMENTATION - replace bodies with fetch() calls when the API exists.

export async function getConsumablesForLab(labId: string): Promise<Consumable[]> {
  return store.consumables
    .filter((item) => item.labId === labId && item.equipmentId === null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getConsumablesForEquipment(
  equipmentId: string
): Promise<Consumable[]> {
  return store.consumables
    .filter((item) => item.equipmentId === equipmentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function addConsumable(
  input: {
    name: string;
    description: string;
    labId: string | null;
    equipmentId: string | null;
    lowNotifyEnabled?: boolean;
    imageUrl?: string | null;
  },
  actor: User
): Promise<Consumable> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Consumable name is required.");
  }

  let labId = input.labId;
  if (input.equipmentId) {
    const equipment = store.equipment.find((eq) => eq.id === input.equipmentId);
    if (!equipment) {
      throw new Error("Equipment not found.");
    }
    labId = equipment.labId;
  }

  const consumable: Consumable = {
    id: nextId("cons"),
    name,
    description: input.description.trim(),
    labId,
    equipmentId: input.equipmentId,
    imageUrl: input.imageUrl ?? null,
    lowNotifyEnabled: input.lowNotifyEnabled ?? true,
    status: "ok",
    reportedLowAt: null,
    reportedLowByUserId: null,
    reportedLowByUserName: null,
  };
  store.consumables.push(consumable);
  persist();

  const scope = consumable.equipmentId
    ? store.equipment.find((eq) => eq.id === consumable.equipmentId)?.name ??
      "equipment"
    : store.labs.find((lab) => lab.id === consumable.labId)?.name ?? "a lab";
  logActivity(
    actor,
    "addConsumable",
    `Added consumable ${consumable.name} for ${scope}`
  );
  return consumable;
}

export async function setConsumableLowNotify(
  consumableId: string,
  enabled: boolean,
  actor: User
): Promise<Consumable> {
  const item = store.consumables.find((c) => c.id === consumableId);
  if (!item) {
    throw new Error("Consumable not found.");
  }
  item.lowNotifyEnabled = enabled;
  persist();
  logActivity(
    actor,
    "updateConsumable",
    `${enabled ? "Enabled" : "Disabled"} low-stock notifications for ${item.name}`
  );
  return item;
}

export async function reportConsumableLow(
  consumableId: string,
  actor: User
): Promise<Consumable> {
  const item = store.consumables.find((c) => c.id === consumableId);
  if (!item) {
    throw new Error("Consumable not found.");
  }

  item.status = "low";
  item.reportedLowAt = new Date().toISOString();
  item.reportedLowByUserId = actor.id;
  item.reportedLowByUserName = actor.username;
  persist();

  logActivity(
    actor,
    "reportConsumableLow",
    `Reported ${item.name} as getting low`
  );

  if (item.lowNotifyEnabled) {
    await createConsumableLowNotification(item, actor);
  }

  return item;
}

/** Managers/admins mark a consumable restocked / no longer low. */
export async function clearConsumableLow(
  consumableId: string,
  actor: User
): Promise<Consumable> {
  const item = store.consumables.find((c) => c.id === consumableId);
  if (!item) {
    throw new Error("Consumable not found.");
  }
  item.status = "ok";
  item.reportedLowAt = null;
  item.reportedLowByUserId = null;
  item.reportedLowByUserName = null;
  persist();
  logActivity(actor, "clearConsumableLow", `Marked ${item.name} as restocked`);
  return item;
}

export async function removeConsumable(
  consumableId: string,
  actor: User
): Promise<void> {
  const item = store.consumables.find((c) => c.id === consumableId);
  if (!item) {
    throw new Error("Consumable not found.");
  }
  store.consumables = store.consumables.filter((c) => c.id !== consumableId);
  persist();
  logActivity(actor, "updateConsumable", `Removed consumable ${item.name}`);
}
