/**
 * Labs. deleteLab also removes that lab's equipment and manager assignments.
 */
import type { Lab } from "../../shared/types";
import { nextId, persist, store } from "../mockStore";

export async function listLabs(): Promise<Lab[]> {
  return [...store.labs];
}

export async function getLab(labId: string): Promise<Lab | undefined> {
  return store.labs.find((lab) => lab.id === labId);
}

export async function insertLab(input: {
  name: string;
  description: string;
  imageUrl?: string | null;
}): Promise<Lab> {
  const lab: Lab = {
    id: nextId("lab"),
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl ?? null,
  };
  store.labs.push(lab);
  persist();
  return lab;
}

export async function updateLab(
  labId: string,
  input: {
    name: string;
    description: string;
    imageUrl?: string | null;
  }
): Promise<Lab | undefined> {
  const lab = store.labs.find((item) => item.id === labId);
  if (!lab) return undefined;
  lab.name = input.name;
  lab.description = input.description;
  if (input.imageUrl !== undefined) {
    lab.imageUrl = input.imageUrl;
  }
  persist();
  return lab;
}

/** Removes the lab, its equipment, and that lab from manager assignments. */
export async function deleteLab(labId: string): Promise<Lab | undefined> {
  const lab = store.labs.find((item) => item.id === labId);
  if (!lab) return undefined;

  store.labs = store.labs.filter((item) => item.id !== labId);
  store.equipment = store.equipment.filter((item) => item.labId !== labId);

  for (const accountId of Object.keys(store.labManagerLabIds)) {
    store.labManagerLabIds[accountId] = (
      store.labManagerLabIds[accountId] ?? []
    ).filter((id) => id !== labId);
  }

  persist();
  return lab;
}
