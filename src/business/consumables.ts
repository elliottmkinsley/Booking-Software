/**
 * Consumables and "getting low" reports.
 */
import {
  deleteConsumable,
  getConsumable,
  insertConsumable,
  listConsumablesForEquipment,
  listConsumablesForLab,
  saveConsumable,
} from "../data/repositories/consumables";
import { getEquipment } from "../data/repositories/equipment";
import { getLab } from "../data/repositories/labs";
import type { Consumable, User } from "../shared/types";
import { logActivity } from "./activity";
import { createConsumableLowNotification } from "./notifications";

export async function getConsumablesForLab(labId: string): Promise<Consumable[]> {
  return (await listConsumablesForLab(labId)).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function getConsumablesForEquipment(
  equipmentId: string
): Promise<Consumable[]> {
  return (await listConsumablesForEquipment(equipmentId)).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
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
    const equipment = await getEquipment(input.equipmentId);
    if (!equipment) {
      throw new Error("Equipment not found.");
    }
    labId = equipment.labId;
  }

  const consumable = await insertConsumable({
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
  });

  const scope = consumable.equipmentId
    ? (await getEquipment(consumable.equipmentId))?.name ?? "equipment"
    : (await getLab(consumable.labId ?? ""))?.name ?? "a lab";
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
  const item = await getConsumable(consumableId);
  if (!item) {
    throw new Error("Consumable not found.");
  }
  item.lowNotifyEnabled = enabled;
  await saveConsumable(item);
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
  const item = await getConsumable(consumableId);
  if (!item) {
    throw new Error("Consumable not found.");
  }

  item.status = "low";
  item.reportedLowAt = new Date().toISOString();
  item.reportedLowByUserId = actor.id;
  item.reportedLowByUserName = actor.username;
  await saveConsumable(item);

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

export async function clearConsumableLow(
  consumableId: string,
  actor: User
): Promise<Consumable> {
  const item = await getConsumable(consumableId);
  if (!item) {
    throw new Error("Consumable not found.");
  }
  item.status = "ok";
  item.reportedLowAt = null;
  item.reportedLowByUserId = null;
  item.reportedLowByUserName = null;
  await saveConsumable(item);
  logActivity(actor, "clearConsumableLow", `Marked ${item.name} as restocked`);
  return item;
}

export async function removeConsumable(
  consumableId: string,
  actor: User
): Promise<void> {
  const item = await deleteConsumable(consumableId);
  if (!item) {
    throw new Error("Consumable not found.");
  }
  logActivity(actor, "updateConsumable", `Removed consumable ${item.name}`);
}
