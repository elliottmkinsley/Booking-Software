/**
 * In-app inbox rows. Visibility rules live in business, not here.
 */
import type { AppNotification } from "../../shared/types";
import { nextId, persist, store } from "../mockStore";

export async function listNotifications(): Promise<AppNotification[]> {
  return [...store.notifications];
}

export async function getNotification(
  notificationId: string
): Promise<AppNotification | undefined> {
  return store.notifications.find((item) => item.id === notificationId);
}

export async function insertNotification(
  input: Omit<AppNotification, "id">
): Promise<AppNotification> {
  const notification: AppNotification = { ...input, id: nextId("notif") };
  store.notifications.unshift(notification);
  persist();
  return notification;
}

export async function saveNotification(
  notification: AppNotification
): Promise<void> {
  const index = store.notifications.findIndex(
    (item) => item.id === notification.id
  );
  if (index === -1) return;
  store.notifications[index] = notification;
  persist();
}

export async function saveNotifications(): Promise<void> {
  persist();
}
