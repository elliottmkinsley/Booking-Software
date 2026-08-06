import type { Account, User } from "../types";
import { logActivity } from "./activityService";
import { getAccount } from "./accountService";
import { persist, store } from "./mockStore";

// MOCK IMPLEMENTATION - replace bodies with fetch() calls when the API exists.

export async function getTrainers(): Promise<Account[]> {
  const trainers = await Promise.all(
    store.trainerAccountIds.map((id) => getAccount(id))
  );
  return trainers
    .filter((account): account is Account => account !== undefined)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getTrainersByIds(ids: string[]): Promise<Account[]> {
  const unique = Array.from(new Set(ids));
  const trainers = await Promise.all(unique.map((id) => getAccount(id)));
  return trainers
    .filter((account): account is Account => account !== undefined)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function isTrainerAccount(accountId: string): Promise<boolean> {
  return store.trainerAccountIds.includes(accountId);
}

export async function addTrainer(
  accountId: string,
  actor: User
): Promise<Account> {
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error("Account not found.");
  }
  if (store.trainerAccountIds.includes(accountId)) {
    return account;
  }
  store.trainerAccountIds.push(accountId);
  persist();
  logActivity(
    actor,
    "addTrainer",
    `Added ${account.displayName} as a trainer`
  );
  return account;
}

/** Removes trainer role and clears them from all equipment trainer lists. */
export async function removeTrainer(
  accountId: string,
  actor: User
): Promise<void> {
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error("Account not found.");
  }
  if (!store.trainerAccountIds.includes(accountId)) {
    return;
  }
  store.trainerAccountIds = store.trainerAccountIds.filter(
    (id) => id !== accountId
  );
  for (const item of store.equipment) {
    item.trainerIds = item.trainerIds.filter((id) => id !== accountId);
  }
  persist();
  logActivity(
    actor,
    "removeTrainer",
    `Removed ${account.displayName} as a trainer`
  );
}
