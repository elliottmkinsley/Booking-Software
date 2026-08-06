import type {
  Account,
  Equipment,
  Lab,
  Person,
  Training,
  TrainingAccessRequest,
  User,
} from "../types";
import { isoDateOffset } from "../utils/dates";
import { getAccountByUsername } from "./accountService";
import { logActivity } from "./activityService";
import { getLabManagerProfiles } from "./labManagerService";
import { nextId, persist, store } from "./mockStore";
import { createTrainingRequestNotification } from "./notificationService";
import {
  canReviewTrainingRequests,
  isAdmin,
  isDevUser,
} from "./permissionsService";
import { getTrainersByIds } from "./trainerService";

// MOCK IMPLEMENTATION - replace bodies with fetch() calls when the API exists.

export interface TrainingRecord {
  training: Training;
  completed: boolean;
  /** null when the training has not been completed */
  completedDate: string | null;
}

export type TrainingCatalogSort =
  | "name"
  | "incompleteFirst"
  | "mostEquipment"
  | "lab";

export type TrainingScopeFilter = "all" | "labEquipment" | "software";

export type TrainingStatusFilter = "all" | "completed" | "incomplete";

export interface TrainingCatalogQuery {
  search?: string;
  labId?: string | "all";
  /** Filter to trainings required by equipment owned by this person. */
  ownerId?: string | "all";
  scope?: TrainingScopeFilter;
  status?: TrainingStatusFilter;
  sort?: TrainingCatalogSort;
  /** Only trainings the user added via equipment "Add training". */
  enrolledOnly?: boolean;
}

export interface TrainingCatalogEntry {
  training: Training;
  completed: boolean;
  completedDate: string | null;
  equipment: Equipment[];
  labs: Lab[];
  owners: Person[];
  pendingRequest: TrainingAccessRequest | null;
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

function approvedRequestFor(
  userId: string,
  trainingId: string
): TrainingAccessRequest | null {
  return (
    store.trainingAccessRequests.find(
      (request) =>
        request.userId === userId &&
        request.trainingId === trainingId &&
        request.status === "approved"
    ) ?? null
  );
}

function buildRecord(userId: string, training: Training): TrainingRecord {
  // An approved access request always wins over the demo seed.
  if ((store.approvedTrainingIds[userId] ?? []).includes(training.id)) {
    const approved = approvedRequestFor(userId, training.id);
    return {
      training,
      completed: true,
      completedDate:
        approved?.reviewedAt?.slice(0, 10) ??
        new Date().toISOString().slice(0, 10),
    };
  }
  const seed = completionSeed(userId, training.id);
  const completed = seed % 3 !== 0;
  return {
    training,
    completed,
    completedDate: completed ? isoDateOffset(-((seed % 200) + 5)) : null,
  };
}

function equipmentForTraining(trainingId: string): Equipment[] {
  return store.equipment.filter((item) =>
    item.trainingIds.includes(trainingId)
  );
}

function labsForEquipment(equipment: Equipment[]): Lab[] {
  const labIds = new Set(
    equipment
      .map((item) => item.labId)
      .filter((labId): labId is string => labId !== null)
  );
  return store.labs
    .filter((lab) => labIds.has(lab.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function ownersForEquipment(equipment: Equipment[]): Person[] {
  const ownerIds = new Set(
    equipment
      .map((item) => item.ownerId)
      .filter((ownerId): ownerId is string => ownerId !== null)
  );
  return store.people
    .filter((person) => ownerIds.has(person.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function pendingRequestFor(
  userId: string,
  trainingId: string
): TrainingAccessRequest | null {
  return (
    store.trainingAccessRequests.find(
      (request) =>
        request.userId === userId &&
        request.trainingId === trainingId &&
        request.status === "pending"
    ) ?? null
  );
}

function enrolledIdsFor(userId: string): string[] {
  return [...(store.userTrainingIds[userId] ?? [])];
}

export async function getEnrolledTrainingIds(
  userId: string
): Promise<string[]> {
  return enrolledIdsFor(userId);
}

export async function areEquipmentTrainingsEnrolled(
  userId: string,
  equipmentId: string
): Promise<boolean> {
  const item = store.equipment.find((eq) => eq.id === equipmentId);
  if (!item || item.trainingIds.length === 0) return true;
  const enrolled = new Set(enrolledIdsFor(userId));
  return item.trainingIds.every((id) => enrolled.has(id));
}

/**
 * Adds every required training for an equipment/software item to the user's
 * "Your trainings" list. Already-enrolled trainings are left as-is.
 */
export async function addTrainingsFromEquipment(
  equipmentId: string,
  actor: User
): Promise<{ added: Training[]; alreadyEnrolled: Training[] }> {
  const item = store.equipment.find((eq) => eq.id === equipmentId);
  if (!item) {
    throw new Error("Equipment not found.");
  }
  if (item.trainingIds.length === 0) {
    throw new Error("This item has no required trainings to add.");
  }

  const current = new Set(enrolledIdsFor(actor.id));
  const added: Training[] = [];
  const alreadyEnrolled: Training[] = [];

  for (const trainingId of item.trainingIds) {
    const training = store.trainings.find((t) => t.id === trainingId);
    if (!training) continue;
    if (current.has(trainingId)) {
      alreadyEnrolled.push(training);
    } else {
      current.add(trainingId);
      added.push(training);
    }
  }

  store.userTrainingIds[actor.id] = [...current];
  persist();

  if (added.length > 0) {
    logActivity(
      actor,
      "enrollTrainings",
      `Added ${added.map((t) => t.name).join(", ")} from ${item.name} to Your trainings`
    );
  }

  return { added, alreadyEnrolled };
}

function buildCatalogEntry(
  userId: string,
  training: Training
): TrainingCatalogEntry {
  const record = buildRecord(userId, training);
  const equipment = equipmentForTraining(training.id);
  return {
    training,
    completed: record.completed,
    completedDate: record.completedDate,
    equipment,
    labs: labsForEquipment(equipment),
    owners: ownersForEquipment(equipment),
    pendingRequest: pendingRequestFor(userId, training.id),
  };
}

export async function getAllTrainings(): Promise<Training[]> {
  return [...store.trainings].sort((a, b) => a.name.localeCompare(b.name));
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

/** Enriched catalog for the Trainings browser (search / filter / sort). */
export async function getTrainingCatalog(
  userId: string,
  query: TrainingCatalogQuery = {}
): Promise<TrainingCatalogEntry[]> {
  const {
    search = "",
    labId = "all",
    ownerId = "all",
    scope = "all",
    status = "all",
    sort = "name",
    enrolledOnly = false,
  } = query;

  const needle = search.trim().toLowerCase();
  const enrolled = new Set(enrolledIdsFor(userId));
  let entries = store.trainings
    .filter((training) => !enrolledOnly || enrolled.has(training.id))
    .map((training) => buildCatalogEntry(userId, training));

  if (needle) {
    entries = entries.filter(
      (entry) =>
        entry.training.name.toLowerCase().includes(needle) ||
        entry.training.description.toLowerCase().includes(needle) ||
        entry.equipment.some((item) =>
          item.name.toLowerCase().includes(needle)
        ) ||
        entry.labs.some((lab) => lab.name.toLowerCase().includes(needle)) ||
        entry.owners.some((owner) =>
          owner.name.toLowerCase().includes(needle)
        )
    );
  }

  if (labId !== "all") {
    entries = entries.filter((entry) =>
      entry.labs.some((lab) => lab.id === labId)
    );
  }

  if (ownerId !== "all") {
    entries = entries.filter((entry) =>
      entry.owners.some((owner) => owner.id === ownerId)
    );
  }

  if (scope === "labEquipment") {
    entries = entries.filter((entry) =>
      entry.equipment.some((item) => item.labId !== null)
    );
  } else if (scope === "software") {
    entries = entries.filter((entry) =>
      entry.equipment.some((item) => item.labId === null)
    );
  }

  if (status === "completed") {
    entries = entries.filter((entry) => entry.completed);
  } else if (status === "incomplete") {
    entries = entries.filter((entry) => !entry.completed);
  }

  return entries.sort((a, b) => {
    if (sort === "incompleteFirst") {
      return (
        Number(a.completed) - Number(b.completed) ||
        a.training.name.localeCompare(b.training.name)
      );
    }
    if (sort === "mostEquipment") {
      return (
        b.equipment.length - a.equipment.length ||
        a.training.name.localeCompare(b.training.name)
      );
    }
    if (sort === "lab") {
      const labA = a.labs[0]?.name ?? "zzz";
      const labB = b.labs[0]?.name ?? "zzz";
      return (
        labA.localeCompare(labB) ||
        a.training.name.localeCompare(b.training.name)
      );
    }
    return a.training.name.localeCompare(b.training.name);
  });
}

export async function getTrainingCatalogEntry(
  userId: string,
  trainingId: string
): Promise<TrainingCatalogEntry | undefined> {
  const training = await getTraining(trainingId);
  if (!training) return undefined;
  return buildCatalogEntry(userId, training);
}

/** People who own equipment that requires at least one training (filter options). */
export async function getTrainingEquipmentOwners(): Promise<Person[]> {
  const ownerIds = new Set<string>();
  for (const item of store.equipment) {
    if (item.ownerId && item.trainingIds.length > 0) {
      ownerIds.add(item.ownerId);
    }
  }
  return store.people
    .filter((person) => ownerIds.has(person.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function requestTrainingAccess(
  trainingId: string,
  message: string,
  actor: User
): Promise<TrainingAccessRequest> {
  const training = await getTraining(trainingId);
  if (!training) {
    throw new Error("Training not found.");
  }

  const existing = pendingRequestFor(actor.id, trainingId);
  if (existing) {
    return existing;
  }

  const request: TrainingAccessRequest = {
    id: nextId("tareq"),
    trainingId,
    userId: actor.id,
    userName: actor.username,
    message: message.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedByUserId: null,
    reviewedByUserName: null,
  };
  store.trainingAccessRequests.push(request);
  persist();
  await createTrainingRequestNotification(
    training,
    actor,
    request.message,
    request.id
  );
  logActivity(
    actor,
    "requestTrainingAccess",
    `Requested access for training ${training.name}`
  );
  return request;
}

/** A pending/handled request plus everyone a reviewer might need to contact. */
export interface TrainingRequestReview {
  request: TrainingAccessRequest;
  training: Training;
  equipment: Equipment[];
  labs: Lab[];
  trainers: Account[];
  managers: Account[];
}

async function trainingLabIds(trainingId: string): Promise<string[]> {
  return Array.from(
    new Set(
      equipmentForTraining(trainingId)
        .map((item) => item.labId)
        .filter((labId): labId is string => labId !== null)
    )
  );
}

/**
 * Can this user act on this specific request? Admins and the dev account can
 * review anything; lab managers only trainings tied to labs they are assigned
 * to; trainers only trainings they are listed as a trainer for.
 */
export async function canReviewRequest(
  user: User | null,
  request: TrainingAccessRequest
): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user) || isDevUser(user)) return true;
  if (!(await canReviewTrainingRequests(user))) return false;

  const account = await getAccountByUsername(user.username);
  if (!account) return false;

  const equipment = equipmentForTraining(request.trainingId);
  if (equipment.some((item) => item.trainerIds.includes(account.id))) {
    return true;
  }

  const labIds = new Set(await trainingLabIds(request.trainingId));
  if (labIds.size === 0) return false;
  const profile = (await getLabManagerProfiles()).find(
    (entry) => entry.account.id === account.id
  );
  return (profile?.assignedLabIds ?? []).some((labId) => labIds.has(labId));
}

/** Every request the user is allowed to review, newest first. */
export async function getTrainingRequestReviews(
  user: User
): Promise<TrainingRequestReview[]> {
  if (!(await canReviewTrainingRequests(user))) return [];

  const profiles = await getLabManagerProfiles();
  const reviews: TrainingRequestReview[] = [];

  for (const request of store.trainingAccessRequests) {
    if (!(await canReviewRequest(user, request))) continue;
    const training = store.trainings.find((t) => t.id === request.trainingId);
    if (!training) continue;

    const equipment = equipmentForTraining(training.id);
    const labs = labsForEquipment(equipment);
    const labIds = new Set(labs.map((lab) => lab.id));
    reviews.push({
      request,
      training,
      equipment,
      labs,
      trainers: await getTrainersByIds(
        equipment.flatMap((item) => item.trainerIds)
      ),
      managers: profiles
        .filter((profile) =>
          profile.assignedLabIds.some((labId) => labIds.has(labId))
        )
        .map((profile) => profile.account),
    });
  }

  return reviews.sort((a, b) => {
    const pendingA = a.request.status === "pending" ? 0 : 1;
    const pendingB = b.request.status === "pending" ? 0 : 1;
    return (
      pendingA - pendingB ||
      b.request.createdAt.localeCompare(a.request.createdAt)
    );
  });
}

async function resolveRequest(
  requestId: string,
  status: "approved" | "denied",
  actor: User
): Promise<TrainingAccessRequest> {
  const request = store.trainingAccessRequests.find((r) => r.id === requestId);
  if (!request) {
    throw new Error("Training request not found.");
  }
  if (!(await canReviewRequest(actor, request))) {
    throw new Error("You do not have permission to review this request.");
  }
  const training = store.trainings.find((t) => t.id === request.trainingId);
  if (!training) {
    throw new Error("Training not found.");
  }

  request.status = status;
  request.reviewedAt = new Date().toISOString();
  request.reviewedByUserId = actor.id;
  request.reviewedByUserName = actor.username;

  if (status === "approved") {
    const approved = new Set(store.approvedTrainingIds[request.userId] ?? []);
    approved.add(training.id);
    store.approvedTrainingIds[request.userId] = [...approved];

    // Approved trainings also land in the requester's "Your trainings" list.
    const enrolled = new Set(store.userTrainingIds[request.userId] ?? []);
    enrolled.add(training.id);
    store.userTrainingIds[request.userId] = [...enrolled];
  }

  persist();
  logActivity(
    actor,
    status === "approved" ? "approveTrainingAccess" : "denyTrainingAccess",
    `${status === "approved" ? "Approved" : "Denied"} ${request.userName}'s request for training ${training.name}`
  );
  return request;
}

export async function approveTrainingRequest(
  requestId: string,
  actor: User
): Promise<TrainingAccessRequest> {
  return resolveRequest(requestId, "approved", actor);
}

export async function denyTrainingRequest(
  requestId: string,
  actor: User
): Promise<TrainingAccessRequest> {
  return resolveRequest(requestId, "denied", actor);
}

export async function getTrainingRequest(
  requestId: string
): Promise<TrainingAccessRequest | undefined> {
  return store.trainingAccessRequests.find((r) => r.id === requestId);
}

/** Admin creates a training that managers can require on equipment. */
export async function addTraining(
  input: { name: string; description: string; howToComplete?: string },
  actor: User
): Promise<Training> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Training name is required.");
  }
  const training: Training = {
    id: nextId("train"),
    name,
    description: input.description.trim(),
    howToComplete:
      input.howToComplete?.trim() ||
      "1. Contact a certified trainer listed on related equipment.\n2. Complete the required briefing or hands-on session.\n3. Request access below so an admin can record your completion.",
  };
  store.trainings.push(training);
  persist();
  logActivity(actor, "addTraining", `Created training ${training.name}`);
  return training;
}
