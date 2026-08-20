/**
 * People directory (search by name, username, or email).
 */
import {
  getAccount as getAccountRow,
  getAccountByUsername as getAccountByUsernameRow,
  listAccounts,
} from "../data/repositories/accounts";
import type { Account } from "../shared/types";

export async function getAllAccounts(): Promise<Account[]> {
  return (await listAccounts()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

export async function searchAccounts(
  query: string,
  options?: { excludeIds?: string[] }
): Promise<Account[]> {
  const exclude = new Set(options?.excludeIds ?? []);
  const needle = query.trim().toLowerCase();
  const pool = (await listAccounts()).filter(
    (account) => !exclude.has(account.id)
  );

  if (!needle) {
    return pool.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  return pool
    .filter(
      (account) =>
        account.displayName.toLowerCase().includes(needle) ||
        account.username.toLowerCase().includes(needle) ||
        account.email.toLowerCase().includes(needle)
    )
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getAccount(
  accountId: string
): Promise<Account | undefined> {
  return getAccountRow(accountId);
}

export async function getAccountByUsername(
  username: string
): Promise<Account | undefined> {
  return getAccountByUsernameRow(username);
}
