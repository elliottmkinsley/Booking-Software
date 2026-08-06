import type { Account, Lab, User } from "../types";
import { logActivity } from "./activityService";
import { getLab, getLabs } from "./labService";
import { getAccount } from "./accountService";
import { persist, store } from "./mockStore";

// MOCK IMPLEMENTATION - replace bodies with fetch() calls when the API exists.
// Lab manager assignments map to the labOwner role once real auth exists.

export interface LabManagerProfile {
  account: Account;
  assignedLabIds: string[];
  assignedLabs: Lab[];
}

export async function getLabManagers(): Promise<Account[]> {
  const managers = await Promise.all(
    store.labManagerAccountIds.map((id) => getAccount(id))
  );
  return managers
    .filter((account): account is Account => account !== undefined)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getLabManagerProfiles(): Promise<LabManagerProfile[]> {
  const managers = await getLabManagers();
  return Promise.all(
    managers.map(async (account) => {
      const assignedLabIds = await getAssignedLabIds(account.id);
      const assignedLabs = (
        await Promise.all(assignedLabIds.map((id) => getLab(id)))
      ).filter((lab): lab is Lab => lab !== undefined);
      return { account, assignedLabIds, assignedLabs };
    })
  );
}

export async function addLabManager(
  accountId: string,
  actor: User
): Promise<Account> {
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error("Account not found.");
  }
  if (store.labManagerAccountIds.includes(accountId)) {
    return account;
  }
  store.labManagerAccountIds.push(accountId);
  if (!store.labManagerLabIds[accountId]) {
    store.labManagerLabIds[accountId] = [];
  }
  persist();
  logActivity(
    actor,
    "addLabManager",
    `Added ${account.displayName} as a lab manager`
  );
  return account;
}

/** Removes lab manager role and clears their lab assignments. */
export async function removeLabManager(
  accountId: string,
  actor: User
): Promise<void> {
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error("Account not found.");
  }
  if (!store.labManagerAccountIds.includes(accountId)) {
    return;
  }
  store.labManagerAccountIds = store.labManagerAccountIds.filter(
    (id) => id !== accountId
  );
  delete store.labManagerLabIds[accountId];
  persist();
  logActivity(
    actor,
    "removeLabManager",
    `Removed ${account.displayName} as a lab manager`
  );
}

export async function isLabManagerAccount(accountId: string): Promise<boolean> {
  return store.labManagerAccountIds.includes(accountId);
}

export async function getAssignedLabIds(accountId: string): Promise<string[]> {
  return [...(store.labManagerLabIds[accountId] ?? [])];
}

/** Replaces the full lab assignment list for one manager (admin action). */
export async function setAssignedLabs(
  accountId: string,
  labIds: string[],
  actor: User
): Promise<void> {
  if (!store.labManagerAccountIds.includes(accountId)) {
    throw new Error("Account is not a lab manager.");
  }
  const allLabs = await getLabs();
  const validIds = new Set(allLabs.map((lab) => lab.id));
  const assigned = labIds.filter((id) => validIds.has(id));
  store.labManagerLabIds[accountId] = assigned;
  persist();

  const account = await getAccount(accountId);
  const labNames = allLabs
    .filter((lab) => assigned.includes(lab.id))
    .map((lab) => lab.name);
  logActivity(
    actor,
    "assignLabs",
    labNames.length === 0
      ? `Removed all lab assignments from ${account?.displayName ?? "a manager"}`
      : `Assigned ${labNames.join(", ")} to ${account?.displayName ?? "a manager"}`
  );
}

export async function assignLabToManager(
  accountId: string,
  labId: string,
  actor: User
): Promise<void> {
  const current = await getAssignedLabIds(accountId);
  if (current.includes(labId)) return;
  await setAssignedLabs(accountId, [...current, labId], actor);
}

export async function unassignLabFromManager(
  accountId: string,
  labId: string,
  actor: User
): Promise<void> {
  const current = await getAssignedLabIds(accountId);
  await setAssignedLabs(
    accountId,
    current.filter((id) => id !== labId),
    actor
  );
}
