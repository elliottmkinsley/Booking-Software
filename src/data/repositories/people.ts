/**
 * Staff used as equipment owners. Azure: merge into Users.
 */
import type { Person } from "../../shared/types";
import { store } from "../mockStore";

export async function listPeople(): Promise<Person[]> {
  return [...store.people];
}

export async function getPerson(
  personId: string
): Promise<Person | undefined> {
  return store.people.find((person) => person.id === personId);
}

export async function getPeopleByIds(ids: string[]): Promise<Person[]> {
  return ids
    .map((id) => store.people.find((person) => person.id === id))
    .filter((person): person is Person => person !== undefined);
}
