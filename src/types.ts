export type UserRole = "user" | "labOwner" | "admin";

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

/** Directory account in the system (future: Users table in Azure). */
export interface Account {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

export interface Lab {
  id: string;
  name: string;
  description: string;
  /** null falls back to the shared placeholder image */
  imageUrl: string | null;
}

/** Staff member who owns equipment or is certified to train others on it. */
export interface Person {
  id: string;
  name: string;
  title: string;
  email: string;
}

export interface Training {
  id: string;
  name: string;
  description: string;
  /** Steps for completing the training (shown on the training detail page). */
  howToComplete: string;
}

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

export type EquipmentCategory = "equipment" | "software";

export type EquipmentStatus = "available" | "maintenance";

/** How finely this item can be reserved. */
export type RentalGranularity = "30min" | "hourly" | "daily" | "weekly";

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
  /** Trainings required before reserving equipment (empty for software) */
  trainingIds: string[];
  ownerId: string | null;
  /** Account ids of certified trainers for this item */
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
