/**
 * In-app inbox for admins, lab managers, and certified trainers.
 */
import { getAssignedLabIds, isLabManagerAccount } from "../data/repositories/labManagers";
import { getLab } from "../data/repositories/labs";
import { getEquipment, listEquipmentRequiringTraining } from "../data/repositories/equipment";
import {
  getNotification,
  insertNotification,
  listNotifications,
  saveNotification,
  saveNotifications,
} from "../data/repositories/notifications";
import { isTrainerAccount } from "../data/repositories/trainers";
import type { AppNotification, Consumable, Training, User } from "../shared/types";
import { getAccountByUsername } from "./accounts";
import { isAdmin, isDevUser, isLabOwnerSession } from "./permissions";

export async function createConsumableLowNotification(
  consumable: Consumable,
  reporter: User
): Promise<AppNotification> {
  const labName = consumable.labId
    ? (await getLab(consumable.labId))?.name
    : null;
  const equipmentName = consumable.equipmentId
    ? (await getEquipment(consumable.equipmentId))?.name
    : null;

  const place = equipmentName
    ? `${equipmentName}${labName ? ` (${labName})` : ""}`
    : labName ?? "shared software";

  return insertNotification({
    type: "consumableLow",
    createdAt: new Date().toISOString(),
    summary: `${reporter.username} reported "${consumable.name}" getting low for ${place}.`,
    consumableId: consumable.id,
    trainingId: null,
    requestId: null,
    labId: consumable.labId,
    notifyAdmin: true,
    notifyLabIds: consumable.labId ? [consumable.labId] : [],
    notifyTrainerAccountIds: [],
    readByUserIds: [],
  });
}

export async function createTrainingRequestNotification(
  training: Training,
  requester: User,
  message: string,
  requestId: string
): Promise<AppNotification> {
  const relatedEquipment = await listEquipmentRequiringTraining(training.id);
  const labIds = Array.from(
    new Set(
      relatedEquipment
        .filter((item) => item.labId !== null)
        .map((item) => item.labId as string)
    )
  );
  const trainerAccountIds = Array.from(
    new Set(relatedEquipment.flatMap((item) => item.trainerIds))
  );

  return insertNotification({
    type: "trainingRequest",
    createdAt: new Date().toISOString(),
    summary: `${requester.username} requested the training "${training.name}".${
      message.trim() ? ` Note: ${message.trim()}` : ""
    }`,
    consumableId: null,
    trainingId: training.id,
    requestId,
    labId: labIds[0] ?? null,
    notifyAdmin: true,
    notifyLabIds: labIds,
    notifyTrainerAccountIds: trainerAccountIds,
    readByUserIds: [],
  });
}

async function canSeeNotification(
  user: User,
  notification: AppNotification
): Promise<boolean> {
  if (isAdmin(user) || isDevUser(user)) {
    return notification.notifyAdmin;
  }

  const account = await getAccountByUsername(user.username);
  if (!account) return false;

  if (
    notification.type === "trainingRequest" &&
    notification.notifyTrainerAccountIds.includes(account.id)
  ) {
    return true;
  }

  if (!isLabOwnerSession(user) || notification.notifyLabIds.length === 0) {
    return false;
  }
  if (!(await isLabManagerAccount(account.id))) return false;
  const assigned = await getAssignedLabIds(account.id);
  return notification.notifyLabIds.some((labId) => assigned.includes(labId));
}

export async function getNotificationsForUser(
  user: User
): Promise<AppNotification[]> {
  const visible: AppNotification[] = [];
  for (const notification of await listNotifications()) {
    if (await canSeeNotification(user, notification)) {
      visible.push(notification);
    }
  }
  return visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUnreadNotificationCount(user: User): Promise<number> {
  const list = await getNotificationsForUser(user);
  return list.filter((n) => !n.readByUserIds.includes(user.id)).length;
}

export async function markNotificationRead(
  notificationId: string,
  user: User
): Promise<void> {
  const notification = await getNotification(notificationId);
  if (!notification) return;
  if (!notification.readByUserIds.includes(user.id)) {
    notification.readByUserIds.push(user.id);
    await saveNotification(notification);
  }
}

export async function markAllNotificationsRead(user: User): Promise<void> {
  const list = await getNotificationsForUser(user);
  for (const notification of list) {
    if (!notification.readByUserIds.includes(user.id)) {
      notification.readByUserIds.push(user.id);
    }
  }
  await saveNotifications();
}

export async function canViewNotifications(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user) || isDevUser(user)) return true;
  const account = await getAccountByUsername(user.username);
  if (!account) return false;
  if (await isTrainerAccount(account.id)) return true;
  if (!isLabOwnerSession(user)) return false;
  if (!(await isLabManagerAccount(account.id))) return false;
  const assigned = await getAssignedLabIds(account.id);
  return assigned.length > 0;
}
