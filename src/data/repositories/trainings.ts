/**
 * Trainings catalog, enrollments, approvals, and access requests.
 */
import type { Training, TrainingAccessRequest } from "../../shared/types";
import { nextId, persist, store } from "../mockStore";

export async function listTrainings(): Promise<Training[]> {
  return [...store.trainings];
}

export async function getTraining(
  trainingId: string
): Promise<Training | undefined> {
  return store.trainings.find((training) => training.id === trainingId);
}

export async function getTrainingsByIds(ids: string[]): Promise<Training[]> {
  return ids
    .map((id) => store.trainings.find((training) => training.id === id))
    .filter((training): training is Training => training !== undefined);
}

export async function insertTraining(input: {
  name: string;
  description: string;
  howToComplete: string;
}): Promise<Training> {
  const training: Training = {
    id: nextId("train"),
    name: input.name,
    description: input.description,
    howToComplete: input.howToComplete,
  };
  store.trainings.push(training);
  persist();
  return training;
}

export async function deleteTraining(
  trainingId: string
): Promise<Training | undefined> {
  const training = store.trainings.find((item) => item.id === trainingId);
  if (!training) return undefined;

  store.trainings = store.trainings.filter((item) => item.id !== trainingId);

  for (const item of store.equipment) {
    item.trainingIds = item.trainingIds.filter((id) => id !== trainingId);
  }

  for (const userId of Object.keys(store.userTrainingIds)) {
    store.userTrainingIds[userId] = (
      store.userTrainingIds[userId] ?? []
    ).filter((id) => id !== trainingId);
  }

  for (const userId of Object.keys(store.approvedTrainingIds)) {
    store.approvedTrainingIds[userId] = (
      store.approvedTrainingIds[userId] ?? []
    ).filter((id) => id !== trainingId);
  }

  store.trainingAccessRequests = store.trainingAccessRequests.filter(
    (request) => request.trainingId !== trainingId
  );
  store.notifications = store.notifications.filter(
    (notice) => notice.trainingId !== trainingId
  );

  persist();
  return training;
}

export async function getEnrolledTrainingIds(userId: string): Promise<string[]> {
  return [...(store.userTrainingIds[userId] ?? [])];
}

export async function setEnrolledTrainingIds(
  userId: string,
  trainingIds: string[]
): Promise<void> {
  store.userTrainingIds[userId] = trainingIds;
  persist();
}

export async function getApprovedTrainingIds(userId: string): Promise<string[]> {
  return [...(store.approvedTrainingIds[userId] ?? [])];
}

export async function setApprovedTrainingIds(
  userId: string,
  trainingIds: string[]
): Promise<void> {
  store.approvedTrainingIds[userId] = trainingIds;
  persist();
}

export async function listAccessRequests(): Promise<TrainingAccessRequest[]> {
  return [...store.trainingAccessRequests];
}

export async function getAccessRequest(
  requestId: string
): Promise<TrainingAccessRequest | undefined> {
  return store.trainingAccessRequests.find((request) => request.id === requestId);
}

export async function insertAccessRequest(input: {
  trainingId: string;
  userId: string;
  userName: string;
  message: string;
}): Promise<TrainingAccessRequest> {
  const request: TrainingAccessRequest = {
    id: nextId("tareq"),
    trainingId: input.trainingId,
    userId: input.userId,
    userName: input.userName,
    message: input.message,
    status: "pending",
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedByUserId: null,
    reviewedByUserName: null,
  };
  store.trainingAccessRequests.push(request);
  persist();
  return request;
}

export async function saveAccessRequest(
  request: TrainingAccessRequest
): Promise<TrainingAccessRequest> {
  const index = store.trainingAccessRequests.findIndex(
    (item) => item.id === request.id
  );
  if (index === -1) {
    throw new Error("Training request not found.");
  }
  store.trainingAccessRequests[index] = request;
  persist();
  return request;
}
