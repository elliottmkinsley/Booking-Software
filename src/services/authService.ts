import type { User } from "../types";

// MOCK IMPLEMENTATION
// When the Azure backend exists, replace the body of signIn with a fetch()
// call to the auth API. The function signature should stay the same.

export async function signIn(
  username: string,
  _password: string,
  isAdmin: boolean
): Promise<User> {
  // Any credentials are accepted for now; real validation comes with the DB.
  return {
    id: `user-${username.toLowerCase()}`,
    username,
    isAdmin,
  };
}
