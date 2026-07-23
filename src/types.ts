export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
}

export interface Lab {
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
}

export interface Booking {
  id: string;
  equipmentId: string;
  userId: string;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string; // ISO date (YYYY-MM-DD)
}
