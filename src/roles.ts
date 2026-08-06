import type { User, UserRole } from "./types";

// Central place for role labels and capability checks. Capabilities are
// intentionally coarse for now and will be refined as the roles grow.

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Standard User",
  labOwner: "Lab Owner",
  admin: "Admin",
};

export const SIGN_IN_ROLES: UserRole[] = ["user", "labOwner", "admin"];

export function canManageLabManagers(user: User | null): boolean {
  return user?.role === "admin";
}

/** Standard users can request access to catalog trainings. */
export function canRequestTrainings(user: User | null): boolean {
  return user?.role === "user";
}

/** @deprecated Use permissionsService helpers for granular checks. */
export function canManageEquipment(user: User | null): boolean {
  return user?.role === "admin" || user?.role === "labOwner";
}
