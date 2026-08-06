import type { Lab, User } from "../types";
import { getAccountByUsername } from "./accountService";
import {
  getAssignedLabIds,
  isLabManagerAccount,
} from "./labManagerService";
import { isTrainerAccount } from "./trainerService";

// MOCK IMPLEMENTATION - replace with server-side auth checks when the API exists.

/** Local demo bypass: username "dev" sees and can manage every lab. */
export function isDevUser(user: User | null): boolean {
  return user?.username.trim().toLowerCase() === "dev";
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

export function isLabOwnerSession(user: User | null): boolean {
  return user?.role === "labOwner";
}

/** Admins can add shared software licenses from the main menu. */
export function canAddSoftware(user: User | null): boolean {
  return isAdmin(user);
}

/**
 * Admins and lab managers can enter Edit Labs mode on the main menu
 * (red X + three-dot controls on lab cards).
 */
export function canManageLabs(user: User | null): boolean {
  return isAdmin(user) || isLabOwnerSession(user) || isDevUser(user);
}

/** Only admins can create brand-new labs. */
export function canAddLab(user: User | null): boolean {
  return isAdmin(user);
}

/** @deprecated Use canManageLabs / canAddLab. */
export function canCreateLabs(user: User | null): boolean {
  return canAddLab(user);
}

/** Admins can assign labs to lab managers. */
export function canAssignLabsToManagers(user: User | null): boolean {
  return isAdmin(user);
}

/** Admins can view the full activity log (audit trail). */
export function canViewActivityLog(user: User | null): boolean {
  return isAdmin(user);
}

/** Admins maintain the shared training catalog. */
export function canManageTrainings(user: User | null): boolean {
  return isAdmin(user);
}

/**
 * Admins and assigned lab managers can maintain the global trainer directory
 * (header → Trainers). Session must be Lab Owner for managers.
 */
export async function canManageTrainers(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user) || isDevUser(user)) return true;
  if (!isLabOwnerSession(user)) return false;

  const account = await getAccountByUsername(user.username);
  if (!account || !(await isLabManagerAccount(account.id))) return false;
  return true;
}

/**
 * Admins, assigned lab managers and certified trainers get the Requests tab
 * and the approve/deny actions on training access requests.
 */
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

/**
 * Who can set required trainings on an item: admins always; lab managers
 * only for equipment in labs they are assigned to; software is admin-only.
 */
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

/** Lab managers only see labs they are assigned to on the main menu. */
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
