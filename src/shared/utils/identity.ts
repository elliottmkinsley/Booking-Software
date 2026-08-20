/**
 * Temporary bridge: directory Account → Person shape used by PersonCard.
 *
 * Owners are still Person ids; trainers are Account ids. After Azure unifies
 * identity into Users, delete this helper and pass one type everywhere.
 * See `Diagrams and Tables/azure-migration-notes.md`.
 */
import type { Account, Person } from "../types";

export function accountAsPerson(account: Account): Person {
  return {
    id: account.id,
    name: account.displayName,
    title: `@${account.username}`,
    email: account.email,
  };
}
