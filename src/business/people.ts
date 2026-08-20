/**
 * Staff records used as equipment owners.
 */
import {
  getPeopleByIds as getPeopleByIdsRow,
  getPerson as getPersonRow,
  listPeople,
} from "../data/repositories/people";
import type { Person } from "../shared/types";

export async function getPeople(): Promise<Person[]> {
  return (await listPeople()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPerson(
  personId: string
): Promise<Person | undefined> {
  return getPersonRow(personId);
}

export async function getPeopleByIds(ids: string[]): Promise<Person[]> {
  return getPeopleByIdsRow(ids);
}
