/**
 * "Who is allowed to do this?" checks. The same questions should be answered
 * on the API later. Username `dev` is a local bypass — do not ship to production.
 */
import {
  getAssignedLabIds,
  isLabManagerAccount,
} from "../data/repositories/labManagers";
import { isTrainerAccount } from "../data/repositories/trainers";
import type { Lab, User } from "../shared/types";
import { getAccountByUsername } from "./accounts";

export function isDevUser(user: User | null): boolean {
  return user?.username.trim().toLowerCase() === "dev";
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

export function isLabOwnerSession(user: User | null): boolean {
  return user?.role === "labOwner";
}

export function canAddSoftware(user: User | null): boolean {
  return isAdmin(user);
}

export function canManageLabs(user: User | null): boolean {
  return isAdmin(user) || isLabOwnerSession(user) || isDevUser(user);
}

export function canAddLab(user: User | null): boolean {
  return isAdmin(user);
}

/** @deprecated Use canManageLabs / canAddLab. */
export function canCreateLabs(user: User | null): boolean {
  return canAddLab(user);
}

export function canAssignLabsToManagers(user: User | null): boolean {
  return isAdmin(user);
}

export function canViewActivityLog(user: User | null): boolean {
  return isAdmin(user);
}

export function canManageTrainings(user: User | null): boolean {
  return isAdmin(user);
}

export async function canManageTrainers(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user) || isDevUser(user)) return true;
  if (!isLabOwnerSession(user)) return false;

  const account = await getAccountByUsername(user.username);
  if (!account || !(await isLabManagerAccount(account.id))) return false;
  return true;
}

export async function canReviewTrainingRequests(
  user: User | null
): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user) || isDevUser(user)) return true;

  const account = await getAccountByUsername(user.username);
  if (!account) return false;
  if (await isTrainerAccount(account.id)) return true;
  if (!isLabOwnerSession(user)) return false;
  if (!(await isLabManagerAccount(account.id))) return false;
  return (await getAssignedLabIds(account.id)).length > 0;
}

export async function canSetEquipmentTrainings(
  user: User | null,
  labId: string | null
): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user) || isDevUser(user)) return true;
  if (labId === null) return false;
  return canAddEquipmentToLab(user, labId);
}

export async function canAddEquipmentToLab(
  user: User | null,
  labId: string
): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user) || isDevUser(user)) return true;
  if (!isLabOwnerSession(user)) return false;

  const account = await getAccountByUsername(user.username);
  if (!account || !(await isLabManagerAccount(account.id))) return false;

  const assigned = await getAssignedLabIds(account.id);
  return assigned.includes(labId);
}

export async function getVisibleLabsForUser(
  user: User | null,
  allLabs: Lab[]
): Promise<Lab[]> {
  if (!user || isAdmin(user) || isDevUser(user) || !isLabOwnerSession(user)) {
    return allLabs;
  }

  const account = await getAccountByUsername(user.username);
  if (!account || !(await isLabManagerAccount(account.id))) {
    return [];
  }

  const assigned = new Set(await getAssignedLabIds(account.id));
  return allLabs.filter((lab) => assigned.has(lab.id));
}
