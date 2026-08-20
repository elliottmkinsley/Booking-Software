/**
 * Trainings catalog, enrollment, completion, and access-request review.
 *
 * Until Azure exists, "completed" is partly faked from the username so demo
 * accounts look different, unless a reviewer has approved a request.
 */
import { getAccountByUsername } from "../data/repositories/accounts";
import {
  getEquipment,
  listEquipment,
} from "../data/repositories/equipment";
import { listLabs } from "../data/repositories/labs";
import { listPeople } from "../data/repositories/people";
import {
  deleteTraining,
  getAccessRequest,
  getApprovedTrainingIds,
  getEnrolledTrainingIds as loadEnrolledIds,
  getTraining as getTrainingRow,
  getTrainingsByIds as getTrainingsByIdsRow,
  insertAccessRequest,
  insertTraining,
  listAccessRequests,
  listTrainings,
  saveAccessRequest,
  setApprovedTrainingIds,
  setEnrolledTrainingIds,
} from "../data/repositories/trainings";
import type {
  Account,
  Equipment,
  Lab,
  Person,
  Training,
  TrainingAccessRequest,
  User,
} from "../shared/types";
import { isoDateOffset } from "../shared/utils/dates";
import { logActivity } from "./activity";
import { getLabManagerProfiles } from "./labManagers";
import { createTrainingRequestNotification } from "./notifications";
import {
  canReviewTrainingRequests,
  isAdmin,
  isDevUser,
} from "./permissions";
import { getTrainersByIds } from "./trainers";

export interface TrainingRecord {
  training: Training;
  completed: boolean;
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
  ownerId?: string | "all";
  scope?: TrainingScopeFilter;
  status?: TrainingStatusFilter;
  sort?: TrainingCatalogSort;
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

function completionSeed(userId: string, trainingId: string): number {
  let sum = 0;
  for (const char of `${userId}:${trainingId}`) {
    sum += char.charCodeAt(0);
  }
  return sum;
}

function approvedRequestFor(
  requests: TrainingAccessRequest[],
  userId: string,
  trainingId: string
): TrainingAccessRequest | null {
  return (
    requests.find(
      (request) =>
        request.userId === userId &&
        request.trainingId === trainingId &&
        request.status === "approved"
    ) ?? null
  );
}

function buildRecord(
  userId: string,
  training: Training,
  approvedIds: string[],
  requests: TrainingAccessRequest[]
): TrainingRecord {
  if (approvedIds.includes(training.id)) {
    const approved = approvedRequestFor(requests, userId, training.id);
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

function labsForEquipment(equipment: Equipment[], labs: Lab[]): Lab[] {
  const labIds = new Set(
    equipment
      .map((item) => item.labId)
      .filter((labId): labId is string => labId !== null)
  );
  return labs
    .filter((lab) => labIds.has(lab.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function ownersForEquipment(
  equipment: Equipment[],
  people: Person[]
): Person[] {
  const ownerIds = new Set(
    equipment
      .map((item) => item.ownerId)
      .filter((ownerId): ownerId is string => ownerId !== null)
  );
  return people
    .filter((person) => ownerIds.has(person.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function pendingRequestFor(
  requests: TrainingAccessRequest[],
  userId: string,
  trainingId: string
): TrainingAccessRequest | null {
  return (
    requests.find(
      (request) =>
        request.userId === userId &&
        request.trainingId === trainingId &&
        request.status === "pending"
    ) ?? null
  );
}

function equipmentForTraining(
  allEquipment: Equipment[],
  trainingId: string
): Equipment[] {
  return allEquipment.filter((item) => item.trainingIds.includes(trainingId));
}

function buildCatalogEntry(
  userId: string,
  training: Training,
  allEquipment: Equipment[],
  labs: Lab[],
  people: Person[],
  requests: TrainingAccessRequest[],
  approvedIds: string[]
): TrainingCatalogEntry {
  const record = buildRecord(userId, training, approvedIds, requests);
  const equipment = equipmentForTraining(allEquipment, training.id);
  return {
    training,
    completed: record.completed,
    completedDate: record.completedDate,
    equipment,
    labs: labsForEquipment(equipment, labs),
    owners: ownersForEquipment(equipment, people),
    pendingRequest: pendingRequestFor(requests, userId, training.id),
  };
}

async function catalogContext(userId: string) {
  const [allEquipment, labs, people, requests, approvedIds] = await Promise.all(
    [
      listEquipment(),
      listLabs(),
      listPeople(),
      listAccessRequests(),
      getApprovedTrainingIds(userId),
    ]
  );
  return { allEquipment, labs, people, requests, approvedIds };
}

export async function getEnrolledTrainingIds(
  userId: string
): Promise<string[]> {
  return loadEnrolledIds(userId);
}

export async function areEquipmentTrainingsEnrolled(
  userId: string,
  equipmentId: string
): Promise<boolean> {
  const item = await getEquipment(equipmentId);
  if (!item || item.trainingIds.length === 0) return true;
  const enrolled = new Set(await loadEnrolledIds(userId));
  return item.trainingIds.every((id) => enrolled.has(id));
}

export async function addTrainingsFromEquipment(
  equipmentId: string,
  actor: User
): Promise<{ added: Training[]; alreadyEnrolled: Training[] }> {
  const item = await getEquipment(equipmentId);
  if (!item) {
    throw new Error("Equipment not found.");
  }
  if (item.trainingIds.length === 0) {
    throw new Error("This item has no required trainings to add.");
  }

  const current = new Set(await loadEnrolledIds(actor.id));
  const added: Training[] = [];
  const alreadyEnrolled: Training[] = [];

  for (const trainingId of item.trainingIds) {
    const training = await getTrainingRow(trainingId);
    if (!training) continue;
    if (current.has(trainingId)) {
      alreadyEnrolled.push(training);
    } else {
      current.add(trainingId);
      added.push(training);
    }
  }

  await setEnrolledTrainingIds(actor.id, [...current]);

  if (added.length > 0) {
    logActivity(
      actor,
      "enrollTrainings",
      `Added ${added.map((t) => t.name).join(", ")} from ${item.name} to Your trainings`
    );
  }

  return { added, alreadyEnrolled };
}

export async function getAllTrainings(): Promise<Training[]> {
  return (await listTrainings()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTraining(
  trainingId: string
): Promise<Training | undefined> {
  return getTrainingRow(trainingId);
}

export async function getTrainingsByIds(ids: string[]): Promise<Training[]> {
  return getTrainingsByIdsRow(ids);
}

export async function getTrainingRecordsForUser(
  userId: string,
  trainingIds?: string[]
): Promise<TrainingRecord[]> {
  const [trainings, approvedIds, requests] = await Promise.all([
    trainingIds ? getTrainingsByIdsRow(trainingIds) : getAllTrainings(),
    getApprovedTrainingIds(userId),
    listAccessRequests(),
  ]);
  return trainings.map((training) =>
    buildRecord(userId, training, approvedIds, requests)
  );
}

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
  const [{ allEquipment, labs, people, requests, approvedIds }, enrolled, catalog] =
    await Promise.all([
      catalogContext(userId),
      loadEnrolledIds(userId),
      listTrainings(),
    ]);
  const enrolledSet = new Set(enrolled);

  let entries = catalog
    .filter((training) => !enrolledOnly || enrolledSet.has(training.id))
    .map((training) =>
      buildCatalogEntry(
        userId,
        training,
        allEquipment,
        labs,
        people,
        requests,
        approvedIds
      )
    );

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
  const training = await getTrainingRow(trainingId);
  if (!training) return undefined;
  const ctx = await catalogContext(userId);
  return buildCatalogEntry(
    userId,
    training,
    ctx.allEquipment,
    ctx.labs,
    ctx.people,
    ctx.requests,
    ctx.approvedIds
  );
}

export async function getTrainingEquipmentOwners(): Promise<Person[]> {
  const [equipment, people] = await Promise.all([
    listEquipment(),
    listPeople(),
  ]);
  const ownerIds = new Set<string>();
  for (const item of equipment) {
    if (item.ownerId && item.trainingIds.length > 0) {
      ownerIds.add(item.ownerId);
    }
  }
  return people
    .filter((person) => ownerIds.has(person.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function requestTrainingAccess(
  trainingId: string,
  message: string,
  actor: User
): Promise<TrainingAccessRequest> {
  const training = await getTrainingRow(trainingId);
  if (!training) {
    throw new Error("Training not found.");
  }

  const requests = await listAccessRequests();
  const existing = pendingRequestFor(requests, actor.id, trainingId);
  if (existing) {
    return existing;
  }

  const request = await insertAccessRequest({
    trainingId,
    userId: actor.id,
    userName: actor.username,
    message: message.trim(),
  });
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

export interface TrainingRequestReview {
  request: TrainingAccessRequest;
  training: Training;
  equipment: Equipment[];
  labs: Lab[];
  trainers: Account[];
  managers: Account[];
}

export async function canReviewRequest(
  user: User | null,
  request: TrainingAccessRequest
): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user) || isDevUser(user)) return true;
  if (!(await canReviewTrainingRequests(user))) return false;

  const account = await getAccountByUsername(user.username);
  if (!account) return false;

  const allEquipment = await listEquipment();
  const equipment = equipmentForTraining(allEquipment, request.trainingId);
  if (equipment.some((item) => item.trainerIds.includes(account.id))) {
    return true;
  }

  const labIds = new Set(
    equipment
      .map((item) => item.labId)
      .filter((labId): labId is string => labId !== null)
  );
  if (labIds.size === 0) return false;
  const profile = (await getLabManagerProfiles()).find(
    (entry) => entry.account.id === account.id
  );
  return (profile?.assignedLabIds ?? []).some((labId) => labIds.has(labId));
}

export async function getTrainingRequestReviews(
  user: User
): Promise<TrainingRequestReview[]> {
  if (!(await canReviewTrainingRequests(user))) return [];

  const [profiles, requests, allEquipment, labs] = await Promise.all([
    getLabManagerProfiles(),
    listAccessRequests(),
    listEquipment(),
    listLabs(),
  ]);

  const reviews: TrainingRequestReview[] = [];

  for (const request of requests) {
    if (!(await canReviewRequest(user, request))) continue;
    const training = await getTrainingRow(request.trainingId);
    if (!training) continue;

    const equipment = equipmentForTraining(allEquipment, training.id);
    const relatedLabs = labsForEquipment(equipment, labs);
    const labIds = new Set(relatedLabs.map((lab) => lab.id));
    reviews.push({
      request,
      training,
      equipment,
      labs: relatedLabs,
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
  const request = await getAccessRequest(requestId);
  if (!request) {
    throw new Error("Training request not found.");
  }
  if (!(await canReviewRequest(actor, request))) {
    throw new Error("You do not have permission to review this request.");
  }
  const training = await getTrainingRow(request.trainingId);
  if (!training) {
    throw new Error("Training not found.");
  }

  request.status = status;
  request.reviewedAt = new Date().toISOString();
  request.reviewedByUserId = actor.id;
  request.reviewedByUserName = actor.username;
  await saveAccessRequest(request);

  if (status === "approved") {
    const approved = new Set(await getApprovedTrainingIds(request.userId));
    approved.add(training.id);
    await setApprovedTrainingIds(request.userId, [...approved]);

    const enrolled = new Set(await loadEnrolledIds(request.userId));
    enrolled.add(training.id);
    await setEnrolledTrainingIds(request.userId, [...enrolled]);
  }

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
  return getAccessRequest(requestId);
}

export async function addTraining(
  input: { name: string; description: string; howToComplete?: string },
  actor: User
): Promise<Training> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Training name is required.");
  }
  const training = await insertTraining({
    name,
    description: input.description.trim(),
    howToComplete:
      input.howToComplete?.trim() ||
      "1. Contact a certified trainer listed on related equipment.\n2. Complete the required briefing or hands-on session.\n3. Request access below so an admin can record your completion.",
  });
  logActivity(actor, "addTraining", `Created training ${training.name}`);
  return training;
}

export async function removeTraining(
  trainingId: string,
  actor: User
): Promise<void> {
  const training = await deleteTraining(trainingId);
  if (!training) {
    throw new Error("Training not found.");
  }
  logActivity(actor, "removeTraining", `Removed training ${training.name}`);
}
