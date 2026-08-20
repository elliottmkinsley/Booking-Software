/**
 * Global trainer directory (account ids).
 */
import { persist, store } from "../mockStore";

export async function listTrainerAccountIds(): Promise<string[]> {
  return [...store.trainerAccountIds];
}

export async function isTrainerAccount(accountId: string): Promise<boolean> {
  return store.trainerAccountIds.includes(accountId);
}

export async function addTrainer(accountId: string): Promise<boolean> {
  if (store.trainerAccountIds.includes(accountId)) {
    return false;
  }
  store.trainerAccountIds.push(accountId);
  persist();
  return true;
}

export async function removeTrainer(accountId: string): Promise<boolean> {
  if (!store.trainerAccountIds.includes(accountId)) {
    return false;
  }
  store.trainerAccountIds = store.trainerAccountIds.filter(
    (id) => id !== accountId
  );
  persist();
  return true;
}
