/**
 * Global trainer directory.
 */
import { getAccount as getAccountRow } from "../data/repositories/accounts";
import { removeTrainerFromAllEquipment } from "../data/repositories/equipment";
import {
  addTrainer as addTrainerRow,
  isTrainerAccount as isTrainerAccountRow,
  listTrainerAccountIds,
  removeTrainer as removeTrainerRow,
} from "../data/repositories/trainers";
import type { Account, User } from "../shared/types";
import { logActivity } from "./activity";

async function accountsForIds(ids: string[]): Promise<Account[]> {
  const unique = Array.from(new Set(ids));
  const trainers = await Promise.all(unique.map((id) => getAccountRow(id)));
  return trainers
    .filter((account): account is Account => account !== undefined)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getTrainers(): Promise<Account[]> {
  return accountsForIds(await listTrainerAccountIds());
}

export async function getTrainersByIds(ids: string[]): Promise<Account[]> {
  return accountsForIds(ids);
}

export async function isTrainerAccount(accountId: string): Promise<boolean> {
  return isTrainerAccountRow(accountId);
}

export async function addTrainer(
  accountId: string,
  actor: User
): Promise<Account> {
  const account = await getAccountRow(accountId);
  if (!account) {
    throw new Error("Account not found.");
  }
  const added = await addTrainerRow(accountId);
  if (added) {
    logActivity(
      actor,
      "addTrainer",
      `Added ${account.displayName} as a trainer`
    );
  }
  return account;
}

export async function removeTrainer(
  accountId: string,
  actor: User
): Promise<void> {
  const account = await getAccountRow(accountId);
  if (!account) {
    throw new Error("Account not found.");
  }
  const removed = await removeTrainerRow(accountId);
  if (!removed) return;
  await removeTrainerFromAllEquipment(accountId);
  logActivity(
    actor,
    "removeTrainer",
    `Removed ${account.displayName} as a trainer`
  );
}
