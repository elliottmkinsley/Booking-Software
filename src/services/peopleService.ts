import type { Person } from "../types";
import { store } from "./mockStore";

// MOCK IMPLEMENTATION - replace bodies with fetch() calls when the API exists.

export async function getPeople(): Promise<Person[]> {
  return [...store.people].sort((a, b) => a.name.localeCompare(b.name));
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
