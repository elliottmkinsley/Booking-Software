import type { User, UserRole } from "./types";

// Central place for role labels and capability checks. Capabilities are
// intentionally coarse for now and will be refined as the roles grow.

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Standard User",
  labOwner: "Lab Owner",
  admin: "Admin",
};

export const SIGN_IN_ROLES: UserRole[] = ["user", "labOwner", "admin"];

/** Admins and lab owners manage inventory; standard users only browse it. */
export function canManageEquipment(user: User | null): boolean {
  return user?.role === "admin" || user?.role === "labOwner";
}
