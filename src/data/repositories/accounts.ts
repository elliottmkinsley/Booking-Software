/**
 * Directory accounts. Swap this module for GET /api/users later.
 */
import type { Account } from "../../shared/types";
import { store } from "../mockStore";

export async function listAccounts(): Promise<Account[]> {
  return [...store.accounts];
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
