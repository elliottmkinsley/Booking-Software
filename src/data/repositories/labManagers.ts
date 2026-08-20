/**
 * Lab manager role + which labs each manager owns.
 */
import { persist, store } from "../mockStore";

export async function listLabManagerAccountIds(): Promise<string[]> {
  return [...store.labManagerAccountIds];
}

export async function isLabManagerAccount(accountId: string): Promise<boolean> {
  return store.labManagerAccountIds.includes(accountId);
}

export async function getAssignedLabIds(accountId: string): Promise<string[]> {
  return [...(store.labManagerLabIds[accountId] ?? [])];
}

export async function addLabManager(accountId: string): Promise<boolean> {
  if (store.labManagerAccountIds.includes(accountId)) {
    return false;
  }
  store.labManagerAccountIds.push(accountId);
  if (!store.labManagerLabIds[accountId]) {
    store.labManagerLabIds[accountId] = [];
  }
  persist();
  return true;
}

export async function removeLabManager(accountId: string): Promise<boolean> {
  if (!store.labManagerAccountIds.includes(accountId)) {
    return false;
  }
  store.labManagerAccountIds = store.labManagerAccountIds.filter(
    (id) => id !== accountId
  );
  delete store.labManagerLabIds[accountId];
  persist();
  return true;
}

export async function setAssignedLabs(
  accountId: string,
  labIds: string[]
): Promise<void> {
  store.labManagerLabIds[accountId] = labIds;
  persist();
}
