/**
 * Sign-in. Today any username/password works; the role is chosen on the form.
 */
import type { User, UserRole } from "../shared/types";
import { ROLE_LABELS } from "../shared/roles";
import { logActivity } from "./activity";

export async function signIn(
  username: string,
  _password: string,
  role: UserRole
): Promise<User> {
  const user: User = {
    id: `user-${username.toLowerCase()}`,
    username,
    role,
  };
  logActivity(user, "signIn", `Signed in as ${ROLE_LABELS[role]}`);
  return user;
}

export function emailForUser(user: User): string {
  return `${user.username.toLowerCase()}@nau.edu`;
}
