/**
 * Shared data shapes for the Radiant booking app.
 *
 * Think of these as the vocabulary the rest of the code uses: a Lab, a piece
 * of Equipment, a Booking, a Training, and so on.
 *
 * The planned Azure SQL tables live in `Diagrams and Tables/`. Until identity
 * is unified there, three kinds of "person" still exist side by side:
 * - User — whoever is signed in right now
 * - Account — a row in the people directory (managers, trainers)
 * - Person — staff used as equipment owners
 * See `Diagrams and Tables/azure-migration-notes.md` for how those merge.
 */

/** Session role chosen on the sign-in form. Lab managers also need directory assignments. */
export type UserRole = "user" | "labOwner" | "admin";

/** Signed-in session identity (not stored in mockStore). Azure: Users + roles. */
export interface User {
  id: string;
  username: string;
  role: UserRole;
}

/** Directory account. Azure: merge into Users. */
export interface Account {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

/** Lab. Azure: Labs. */
export interface Lab {
  id: string;
  name: string;
  description: string;
  /** null falls back to the shared placeholder image */
  imageUrl: string | null;
}

/**
 * Staff profile used for equipment owners today.
 * Azure: merge into Users (owner_user_id). Trainers already use Account ids.
 */
export interface Person {
  id: string;
  name: string;
  title: string;
  email: string;
}

/** Training catalog entry. Azure: Trainings. */
export interface Training {
  id: string;
  name: string;
  description: string;
  /** Steps for completing the training (shown on the training detail page). */
  howToComplete: string;
}

/** Waiting on a reviewer, or already decided. */
export type TrainingAccessRequestStatus = "pending" | "approved" | "denied";

/** User request for admin/manager/trainer approval after starting a training. */
export interface TrainingAccessRequest {
  id: string;
  trainingId: string;
  userId: string;
  userName: string;
  message: string;
  status: TrainingAccessRequestStatus;
  createdAt: string;
  /** Set once a reviewer approves or denies the request */
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  reviewedByUserName: string | null;
}

/** Physical instrument in a lab, or a shared software license. */
export type EquipmentCategory = "equipment" | "software";

/** Available to book, or taken out of service for maintenance. */
export type EquipmentStatus = "available" | "maintenance";

/** How finely this item can be reserved. */
export type RentalGranularity = "30min" | "hourly" | "daily" | "weekly";

/**
 * Equipment or shared software (`category` discriminator).
 * Azure: Equipment (+ EquipmentTrainings / EquipmentTrainers junctions).
 */
export interface Equipment {
  id: string;
  /** null for software, which is shared across labs rather than owned by one */
  labId: string | null;
  name: string;
  description: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  /** null falls back to the shared placeholder image */
  imageUrl: string | null;
  /** Booking increment for equipment (unused for software) */
  rentalGranularity: RentalGranularity;
  /** Training ids required before reserving (Azure: EquipmentTrainings). Empty for software. */
  trainingIds: string[];
  /** Person id today; Azure: owner_user_id → Users */
  ownerId: string | null;
  /** Account ids of certified trainers (Azure: EquipmentTrainers → Users) */
  trainerIds: string[];
  /** null means no guide has been uploaded yet */
  userGuideUrl: string | null;
  /** Software: link to installer, portal, or license request */
  downloadUrl: string | null;
  /** Software: how to get access / install */
  accessInstructions: string | null;
  /** Software: who to ask about licenses */
  contactName: string | null;
  contactEmail: string | null;
}

/** Stock looks fine, or someone reported it running out. */
export type ConsumableStatus = "ok" | "low";

/**
 * Lab-general (equipmentId null) or equipment-specific consumable.
 * labId is the owning lab for notifications (null for software-only items).
 */
export interface Consumable {
  id: string;
  name: string;
  description: string;
  labId: string | null;
  equipmentId: string | null;
  /** Optional photo; null uses no thumbnail */
  imageUrl: string | null;
  /** When true, reports of "getting low" notify admins and lab managers. */
  lowNotifyEnabled: boolean;
  status: ConsumableStatus;
  reportedLowAt: string | null;
  reportedLowByUserId: string | null;
  reportedLowByUserName: string | null;
}

/** Why this inbox row exists: a supply is low, or someone asked for training. */
export type AppNotificationType = "consumableLow" | "trainingRequest";

/** In-app notice for admins / lab managers (future: notifications table). */
export interface AppNotification {
  id: string;
  type: AppNotificationType;
  createdAt: string;
  summary: string;
  /** Set for consumableLow notices */
  consumableId: string | null;
  /** Set for trainingRequest notices */
  trainingId: string | null;
  /** TrainingAccessRequest id for trainingRequest notices */
  requestId: string | null;
  labId: string | null;
  notifyAdmin: boolean;
  /** Lab managers assigned to any of these labs should see the notice. */
  notifyLabIds: string[];
  /** Certified trainers who should see the notice regardless of lab. */
  notifyTrainerAccountIds: string[];
  readByUserIds: string[];
}

export type ActivityAction =
  | "signIn"
  | "createBooking"
  | "addLab"
  | "updateLab"
  | "removeLab"
  | "addEquipment"
  | "updateEquipment"
  | "removeEquipment"
  | "importEquipment"
  | "addSoftware"
  | "updateSoftware"
  | "removeSoftware"
  | "addLabManager"
  | "removeLabManager"
  | "assignLabs"
  | "addTrainer"
  | "removeTrainer"
  | "addTraining"
  | "removeTraining"
  | "setEquipmentTrainings"
  | "setEquipmentTrainers"
  | "requestTrainingAccess"
  | "approveTrainingAccess"
  | "denyTrainingAccess"
  | "enrollTrainings"
  | "addConsumable"
  | "updateConsumable"
  | "reportConsumableLow"
  | "clearConsumableLow";

/** One entry in the admin-visible audit trail (future: activity_log table). */
export interface ActivityEvent {
  id: string;
  /** ISO datetime of when the action happened */
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: ActivityAction;
  /** Human-readable description, e.g. "Reserved DJI Matrice 350 RTK" */
  summary: string;
}

/** A reservation of equipment for one or more days (and optional time slots). */
export interface Booking {
  id: string;
  equipmentId: string;
  userId: string;
  /** Denormalized for display; the API will join on the user table instead. */
  userName: string;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string; // ISO date (YYYY-MM-DD)
  /** "HH:MM" for slot reservations; null means the whole day(s). */
  startTime: string | null;
  endTime: string | null;
}
