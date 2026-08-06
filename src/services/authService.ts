import type { User, UserRole } from "../types";
import { ROLE_LABELS } from "../roles";
import { logActivity } from "./activityService";

// MOCK IMPLEMENTATION
// When the Azure backend exists, replace the body of signIn with a fetch()
// call to the auth API. The function signature should stay the same.

export async function signIn(
  username: string,
  _password: string,
  role: UserRole
): Promise<User> {
  // Any credentials are accepted for now; real validation comes with the DB.
  // The role is picked on the sign-in form instead of being looked up.
  const user: User = {
    id: `user-${username.toLowerCase()}`,
    username,
    role,
  };
  logActivity(user, "signIn", `Signed in as ${ROLE_LABELS[role]}`);
  return user;
}

/** Placeholder until the directory provides real addresses. */
export function emailForUser(user: User): string {
  return `${user.username.toLowerCase()}@nau.edu`;
}
