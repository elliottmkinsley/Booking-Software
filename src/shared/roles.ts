/**
 * Human-readable role names and a few simple "can this person…?" checks.
 *
 * Most permission logic lives in `business/permissions.ts`. This file
 * only holds labels shown on the sign-in form and two coarse checks used by
 * the header. Fine-grained rules (which labs a manager owns, who reviews
 * trainings) are looked up from the directory, not from the session role alone.
 */
import type { User, UserRole } from "./types";

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Standard User",
  labOwner: "Lab Owner",
  admin: "Admin",
};

/** Roles offered on the sign-in form (the session role is chosen here, not looked up). */
export const SIGN_IN_ROLES: UserRole[] = ["user", "labOwner", "admin"];

/** Only admins can open the Lab Managers directory. */
export function canManageLabManagers(user: User | null): boolean {
  return user?.role === "admin";
}

/** Standard users can request access to catalog trainings. */
export function canRequestTrainings(user: User | null): boolean {
  return user?.role === "user";
}
