export type UserRole = "user" | "labOwner" | "admin";

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface Lab {
  id: string;
  name: string;
  description: string;
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
}

export type EquipmentCategory = "equipment" | "software";

export type EquipmentStatus = "available" | "maintenance";

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
  /** Trainings that must be completed before this item can be reserved */
  trainingIds: string[];
  ownerId: string | null;
  trainerIds: string[];
  /** null means no guide has been uploaded yet */
  userGuideUrl: string | null;
}

export interface Booking {
  id: string;
  equipmentId: string;
  userId: string;
  /** Denormalized for display; the API will join on the user table instead. */
  userName: string;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string; // ISO date (YYYY-MM-DD)
}
