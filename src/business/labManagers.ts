/**
 * Lab manager directory: who has the role, and which labs they own.
 */
import {
  addLabManager as addLabManagerRow,
  getAssignedLabIds as getAssignedLabIdsRow,
  isLabManagerAccount as isLabManagerAccountRow,
  listLabManagerAccountIds,
  removeLabManager as removeLabManagerRow,
  setAssignedLabs as setAssignedLabsRow,
} from "../data/repositories/labManagers";
import { getLab, listLabs } from "../data/repositories/labs";
import type { Account, Lab, User } from "../shared/types";
import { getAccount } from "./accounts";
import { logActivity } from "./activity";

export interface LabManagerProfile {
  account: Account;
  assignedLabIds: string[];
  assignedLabs: Lab[];
}

export async function getLabManagers(): Promise<Account[]> {
  const ids = await listLabManagerAccountIds();
  const managers = await Promise.all(ids.map((id) => getAccount(id)));
  return managers
    .filter((account): account is Account => account !== undefined)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getLabManagerProfiles(): Promise<LabManagerProfile[]> {
  const managers = await getLabManagers();
  return Promise.all(
    managers.map(async (account) => {
      const assignedLabIds = await getAssignedLabIdsRow(account.id);
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
  const added = await addLabManagerRow(accountId);
  if (added) {
    logActivity(
      actor,
      "addLabManager",
      `Added ${account.displayName} as a lab manager`
    );
  }
  return account;
}

export async function removeLabManager(
  accountId: string,
  actor: User
): Promise<void> {
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error("Account not found.");
  }
  const removed = await removeLabManagerRow(accountId);
  if (!removed) return;
  logActivity(
    actor,
    "removeLabManager",
    `Removed ${account.displayName} as a lab manager`
  );
}

export async function isLabManagerAccount(accountId: string): Promise<boolean> {
  return isLabManagerAccountRow(accountId);
}

export async function getAssignedLabIds(accountId: string): Promise<string[]> {
  return getAssignedLabIdsRow(accountId);
}

export async function setAssignedLabs(
  accountId: string,
  labIds: string[],
  actor: User
): Promise<void> {
  if (!(await isLabManagerAccountRow(accountId))) {
    throw new Error("Account is not a lab manager.");
  }
  const allLabs = await listLabs();
  const validIds = new Set(allLabs.map((lab) => lab.id));
  const assigned = labIds.filter((id) => validIds.has(id));
  await setAssignedLabsRow(accountId, assigned);

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
  const current = await getAssignedLabIdsRow(accountId);
  if (current.includes(labId)) return;
  await setAssignedLabs(accountId, [...current, labId], actor);
}

export async function unassignLabFromManager(
  accountId: string,
  labId: string,
  actor: User
): Promise<void> {
  const current = await getAssignedLabIdsRow(accountId);
  await setAssignedLabs(
    accountId,
    current.filter((id) => id !== labId),
    actor
  );
}
