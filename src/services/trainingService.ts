import type { Training } from "../types";
import { isoDateOffset } from "../utils/dates";
import { store } from "./mockStore";

// MOCK IMPLEMENTATION - replace bodies with fetch() calls when the API exists.

export interface TrainingRecord {
  training: Training;
  completed: boolean;
  /** null when the training has not been completed */
  completedDate: string | null;
}

// Real completion records live in the database. Until then, completion is
// derived from the username so different demo accounts show different records
// while staying stable across page loads.
function completionSeed(userId: string, trainingId: string): number {
  let sum = 0;
  for (const char of `${userId}:${trainingId}`) {
    sum += char.charCodeAt(0);
  }
  return sum;
}

function buildRecord(userId: string, training: Training): TrainingRecord {
  const seed = completionSeed(userId, training.id);
  const completed = seed % 3 !== 0;
  return {
    training,
    completed,
    completedDate: completed ? isoDateOffset(-((seed % 200) + 5)) : null,
  };
}

export async function getAllTrainings(): Promise<Training[]> {
  return [...store.trainings];
}

export async function getTrainingsByIds(ids: string[]): Promise<Training[]> {
  return ids
    .map((id) => store.trainings.find((training) => training.id === id))
    .filter((training): training is Training => training !== undefined);
}

/** Training records for a user; pass trainingIds to scope to specific ones. */
export async function getTrainingRecordsForUser(
  userId: string,
  trainingIds?: string[]
): Promise<TrainingRecord[]> {
  const trainings = trainingIds
    ? await getTrainingsByIds(trainingIds)
    : await getAllTrainings();
  return trainings.map((training) => buildRecord(userId, training));
}
