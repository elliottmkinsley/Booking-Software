import type { Account } from "../types";
import { store } from "./mockStore";

// MOCK IMPLEMENTATION - replace bodies with fetch() calls when the API exists.

export async function getAllAccounts(): Promise<Account[]> {
  return [...store.accounts].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

/** Search the account directory by name, username, or email. */
export async function searchAccounts(
  query: string,
  options?: { excludeIds?: string[] }
): Promise<Account[]> {
  const exclude = new Set(options?.excludeIds ?? []);
  const needle = query.trim().toLowerCase();
  const pool = store.accounts.filter((account) => !exclude.has(account.id));

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
  return store.accounts.find((account) => account.id === accountId);
}

export async function getAccountByUsername(
  username: string
): Promise<Account | undefined> {
  const needle = username.trim().toLowerCase();
  return store.accounts.find(
    (account) => account.username.toLowerCase() === needle
  );
}
