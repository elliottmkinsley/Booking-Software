import { isoDateOffset } from "../utils/dates";
import type {
  Account,
  ActivityEvent,
  Booking,
  Consumable,
  Equipment,
  Lab,
  Person,
  Training,
} from "../types";

// Placeholder seed data invented for the remote-sensing domain.
// Replace with real Radiant Center inventory, staff, and trainings once the
// database exists. Emails and user guide links are fake placeholders.

export const seedLabs: Lab[] = [
  {
    id: "lab-uas",
    name: "UAS & Drone Lab",
    description:
      "Unmanned aerial systems for aerial imaging, photogrammetry, and multispectral surveys.",
    imageUrl: "images/labs/uas.svg",
  },
  {
    id: "lab-lidar",
    name: "LiDAR & Terrestrial Scanning Lab",
    description:
      "Terrestrial and mobile laser scanning systems for 3D terrain and vegetation structure mapping.",
    imageUrl: "images/labs/lidar.svg",
  },
  {
    id: "lab-spectro",
    name: "Spectroscopy Lab",
    description:
      "Field and lab spectroradiometers for surface reflectance and calibration work.",
    imageUrl: "images/labs/spectro.svg",
  },
  {
    id: "lab-gis",
    name: "GIS & Computing Lab",
    description:
      "High-performance workstations and geospatial software licenses for analysis and modeling.",
    imageUrl: "images/labs/gis.svg",
  },
  {
    id: "lab-field",
    name: "Field Instruments Lab",
    description:
      "GPS/GNSS receivers, weather stations, and general field survey equipment.",
    imageUrl: "images/labs/field.svg",
  },
];

export const seedPeople: Person[] = [
  {
    id: "person-reyes",
    name: "Dr. Alan Reyes",
    title: "UAS Lab Director",
    email: "alan.reyes@nau.edu",
  },
  {
    id: "person-nakai",
    name: "Marisa Nakai",
    title: "UAS Flight Operations Coordinator",
    email: "marisa.nakai@nau.edu",
  },
  {
    id: "person-obrien",
    name: "Dr. Kate O'Brien",
    title: "LiDAR Lab Manager",
    email: "kate.obrien@nau.edu",
  },
  {
    id: "person-tsosie",
    name: "Daniel Tsosie",
    title: "Geomatics Research Technician",
    email: "daniel.tsosie@nau.edu",
  },
  {
    id: "person-huang",
    name: "Dr. Wei Huang",
    title: "Spectroscopy Lab Lead",
    email: "wei.huang@nau.edu",
  },
  {
    id: "person-alvarez",
    name: "Priya Alvarez",
    title: "GIS & Computing Systems Administrator",
    email: "priya.alvarez@nau.edu",
  },
  {
    id: "person-becker",
    name: "Sam Becker",
    title: "Field Instruments Coordinator",
    email: "sam.becker@nau.edu",
  },
];

export const seedTrainings: Training[] = [
  {
    id: "train-lab-safety",
    name: "General Lab Safety Orientation",
    description:
      "Center-wide orientation covering lab access, checkout procedures, and incident reporting.",
    howToComplete:
      "1. Review the Radiant Center safety handbook (posted in each lab).\n2. Attend a scheduled orientation with a lab manager or certified trainer.\n3. Complete the short quiz at the end of the session.\n4. Request access below so an admin can mark your completion.",
  },
  {
    id: "train-part107",
    name: "FAA Part 107 Certification Check",
    description:
      "Verification of a current remote pilot certificate before any UAS flight operation.",
    howToComplete:
      "1. Obtain or renew your FAA Part 107 Remote Pilot Certificate.\n2. Bring a digital or printed copy of your certificate to a UAS lab trainer.\n3. The trainer verifies expiration date and airman certificate number.\n4. Request access below so an admin can record the check.",
  },
  {
    id: "train-uas-flight",
    name: "UAS Flight Operations",
    description:
      "Hands-on preflight checks, mission planning, and emergency procedures for lab drone platforms.",
    howToComplete:
      "1. Complete General Lab Safety Orientation first.\n2. Schedule a hands-on flight briefing with a UAS certified trainer.\n3. Demonstrate preflight checklist, failsafe settings, and emergency procedures.\n4. Request access below after the trainer signs off.",
  },
  {
    id: "train-lidar-ops",
    name: "Terrestrial LiDAR Operation",
    description:
      "Scanner setup, registration targets, and safe handling of Class 1 laser instruments.",
    howToComplete:
      "1. Complete General Lab Safety Orientation.\n2. Book a scanner walkthrough with the LiDAR lab manager or trainer.\n3. Practice target placement, scan registration, and instrument packing.\n4. Request access below once you have been signed off.",
  },
  {
    id: "train-spectro-cal",
    name: "Spectroradiometer Handling & Calibration",
    description:
      "White reference calibration, fiber optic care, and reflectance measurement protocol.",
    howToComplete:
      "1. Review fiber optic handling rules with a Spectroscopy trainer.\n2. Complete a supervised white-reference calibration.\n3. Collect a practice reflectance spectrum and discuss quality checks.\n4. Request access below after the trainer approves your session.",
  },
  {
    id: "train-gnss-survey",
    name: "GNSS Survey Basics",
    description:
      "Base/rover setup, RTK corrections, and coordinate system selection for survey work.",
    howToComplete:
      "1. Complete General Lab Safety Orientation.\n2. Attend a field demo covering base/rover setup and RTK corrections.\n3. Demonstrate a short survey workflow with a certified trainer.\n4. Request access below so an admin can record completion.",
  },
  {
    id: "train-software-onboard",
    name: "Geospatial Software Onboarding",
    description:
      "License checkout rules, data storage policy, and shared workstation etiquette.",
    howToComplete:
      "1. Read the shared software license and data storage policy.\n2. Complete the short onboarding checklist with a software owner or trainer.\n3. Confirm you can check out a license and save work to the approved location.\n4. Request access below for admin confirmation.",
  },
];

const GUIDE_BASE = "https://example.com/radiant/guides";

export const seedEquipment: Equipment[] = [
  {
    id: "eq-1",
    labId: "lab-uas",
    name: "DJI Matrice 350 RTK",
    description:
      "Heavy-lift drone platform with RTK positioning for survey-grade mapping. Supports interchangeable payloads and up to 55 minutes of flight time.",
    category: "equipment",
    status: "available",
    imageUrl: "images/equipment/matrice.svg",
    rentalGranularity: "daily",
    trainingIds: ["train-lab-safety", "train-part107", "train-uas-flight"],
    ownerId: "person-reyes",
    trainerIds: ["acct-nakai", "acct-tsosie"],
    userGuideUrl: `${GUIDE_BASE}/matrice-350-rtk.pdf`,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  },
  {
    id: "eq-2",
    labId: "lab-uas",
    name: "MicaSense RedEdge-P",
    description:
      "Multispectral camera for vegetation and agriculture imaging, capturing five discrete bands plus a panchromatic channel.",
    category: "equipment",
    status: "available",
    imageUrl: "images/equipment/rededge.svg",
    rentalGranularity: "daily",
    trainingIds: ["train-lab-safety", "train-uas-flight"],
    ownerId: "person-reyes",
    trainerIds: ["acct-nakai"],
    userGuideUrl: `${GUIDE_BASE}/rededge-p.pdf`,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  },
  {
    id: "eq-3",
    labId: null,
    name: "Pix4Dmapper License",
    description:
      "Photogrammetry software seat for drone imagery processing, including point cloud and orthomosaic generation.",
    category: "software",
    status: "available",
    imageUrl: "images/software/pix4d.svg",
    rentalGranularity: "daily",
    trainingIds: [],
    ownerId: "person-alvarez",
    trainerIds: [],
    userGuideUrl: `${GUIDE_BASE}/pix4dmapper.pdf`,
    downloadUrl: "https://cloud.pix4d.com/",
    accessInstructions:
      "Request a floating license seat from GIS & Computing. After approval, sign in at the Pix4D cloud portal with your NAU email and install the desktop client from the downloads page.",
    contactName: "Priya Alvarez",
    contactEmail: "priya.alvarez@nau.edu",
  },
  {
    id: "eq-4",
    labId: "lab-lidar",
    name: "RIEGL VZ-400i",
    description:
      "Terrestrial laser scanner for high-resolution 3D scanning with onboard registration and up to 800 m range.",
    category: "equipment",
    status: "available",
    imageUrl: "images/equipment/riegl.svg",
    rentalGranularity: "daily",
    trainingIds: ["train-lab-safety", "train-lidar-ops"],
    ownerId: "person-obrien",
    trainerIds: ["acct-tsosie"],
    userGuideUrl: `${GUIDE_BASE}/riegl-vz-400i.pdf`,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  },
  {
    id: "eq-5",
    labId: "lab-lidar",
    name: "Velodyne Puck (VLP-16)",
    description:
      "Compact LiDAR sensor for mobile mapping experiments and backpack/vehicle-mounted scanning rigs.",
    category: "equipment",
    status: "maintenance",
    imageUrl: "images/equipment/velodyne.svg",
    rentalGranularity: "daily",
    trainingIds: ["train-lab-safety", "train-lidar-ops"],
    ownerId: "person-obrien",
    trainerIds: ["acct-tsosie"],
    userGuideUrl: null,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  },
  {
    id: "eq-6",
    labId: "lab-lidar",
    name: "CloudCompare Workstation",
    description:
      "Dedicated workstation configured for large point-cloud processing with 256 GB RAM and fast local scratch storage.",
    category: "equipment",
    status: "available",
    imageUrl: "images/equipment/cloudcompare.svg",
    rentalGranularity: "daily",
    trainingIds: ["train-lab-safety"],
    ownerId: "person-obrien",
    trainerIds: ["acct-alvarez"],
    userGuideUrl: `${GUIDE_BASE}/cloudcompare-workstation.pdf`,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  },
  {
    id: "eq-7",
    labId: "lab-spectro",
    name: "ASD FieldSpec 4",
    description:
      "Full-range field spectroradiometer (350-2500 nm) for surface reflectance measurement and sensor calibration.",
    category: "equipment",
    status: "available",
    imageUrl: "images/equipment/fieldspec.svg",
    rentalGranularity: "daily",
    trainingIds: ["train-lab-safety", "train-spectro-cal"],
    ownerId: "person-huang",
    trainerIds: ["acct-huang", "acct-tsosie"],
    userGuideUrl: `${GUIDE_BASE}/fieldspec-4.pdf`,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  },
  {
    id: "eq-8",
    labId: "lab-spectro",
    name: "Spectralon Calibration Panel",
    description:
      "White reference panel for reflectance calibration. Handle with gloves and store in the protective case.",
    category: "equipment",
    status: "available",
    imageUrl: "images/equipment/spectralon.svg",
    rentalGranularity: "daily",
    trainingIds: ["train-spectro-cal"],
    ownerId: "person-huang",
    trainerIds: ["acct-huang"],
    userGuideUrl: `${GUIDE_BASE}/spectralon-panel.pdf`,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  },
  {
    id: "eq-9",
    labId: null,
    name: "ArcGIS Pro License",
    description:
      "Floating license seat for ArcGIS Pro with Spatial Analyst and Image Analyst extensions.",
    category: "software",
    status: "available",
    imageUrl: "images/software/arcgis.svg",
    rentalGranularity: "daily",
    trainingIds: [],
    ownerId: "person-alvarez",
    trainerIds: [],
    userGuideUrl: `${GUIDE_BASE}/arcgis-pro.pdf`,
    downloadUrl: "https://www.esri.com/en-us/arcgis/products/arcgis-pro/trial",
    accessInstructions:
      "ArcGIS Pro seats are managed by the GIS lab. Email the contact below with your NAU username; you will receive a license authorization file and install steps for lab or personal workstations.",
    contactName: "Priya Alvarez",
    contactEmail: "priya.alvarez@nau.edu",
  },
  {
    id: "eq-10",
    labId: null,
    name: "ENVI + IDL License",
    description:
      "Hyperspectral image analysis software seat with IDL scripting for custom processing workflows.",
    category: "software",
    status: "available",
    imageUrl: "images/software/envi.svg",
    rentalGranularity: "daily",
    trainingIds: [],
    ownerId: "person-alvarez",
    trainerIds: [],
    userGuideUrl: `${GUIDE_BASE}/envi-idl.pdf`,
    downloadUrl: "https://www.nv5geospatialsoftware.com/Downloads",
    accessInstructions:
      "ENVI + IDL is available on GIS lab workstations and via a limited number of home-use licenses. Contact the software lead for the current download portal credentials and license server address.",
    contactName: "Priya Alvarez",
    contactEmail: "priya.alvarez@nau.edu",
  },
  {
    id: "eq-11",
    labId: "lab-gis",
    name: "GPU Workstation (RTX 6000)",
    description:
      "High-performance workstation for deep learning on imagery, with CUDA toolchain and common ML frameworks preinstalled.",
    category: "equipment",
    status: "available",
    imageUrl: "images/equipment/gpu.svg",
    rentalGranularity: "hourly",
    trainingIds: ["train-lab-safety", "train-software-onboard"],
    ownerId: "person-alvarez",
    trainerIds: ["acct-alvarez"],
    userGuideUrl: `${GUIDE_BASE}/gpu-workstation.pdf`,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  },
  {
    id: "eq-12",
    labId: "lab-field",
    name: "Trimble R12i GNSS Receiver",
    description:
      "Survey-grade GNSS receiver with tilt compensation for rapid ground control point collection.",
    category: "equipment",
    status: "available",
    imageUrl: "images/equipment/trimble.svg",
    rentalGranularity: "daily",
    trainingIds: ["train-lab-safety", "train-gnss-survey"],
    ownerId: "person-becker",
    trainerIds: ["acct-becker", "acct-tsosie"],
    userGuideUrl: `${GUIDE_BASE}/trimble-r12i.pdf`,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  },
  {
    id: "eq-13",
    labId: "lab-field",
    name: "Kestrel 5500 Weather Meter",
    description:
      "Portable weather station for field campaigns, logging wind, temperature, humidity, and pressure.",
    category: "equipment",
    status: "available",
    imageUrl: "images/equipment/kestrel.svg",
    rentalGranularity: "daily",
    trainingIds: ["train-lab-safety"],
    ownerId: "person-becker",
    trainerIds: ["acct-becker"],
    userGuideUrl: `${GUIDE_BASE}/kestrel-5500.pdf`,
    downloadUrl: null,
    accessInstructions: null,
    contactName: null,
    contactEmail: null,
  },
];

/** Accounts marked as certified trainers (future: role / join table). */
export const seedTrainerAccountIds: string[] = [
  "acct-nakai",
  "acct-tsosie",
  "acct-huang",
  "acct-alvarez",
  "acct-becker",
];

// Placeholder directory of Radiant Center accounts (future: Users table).
export const seedAccounts: Account[] = [
  {
    id: "acct-reyes",
    username: "areyes",
    displayName: "Dr. Alan Reyes",
    email: "alan.reyes@nau.edu",
  },
  {
    id: "acct-nakai",
    username: "mnakai",
    displayName: "Marisa Nakai",
    email: "marisa.nakai@nau.edu",
  },
  {
    id: "acct-obrien",
    username: "kobrien",
    displayName: "Dr. Kate O'Brien",
    email: "kate.obrien@nau.edu",
  },
  {
    id: "acct-tsosie",
    username: "dtsosie",
    displayName: "Daniel Tsosie",
    email: "daniel.tsosie@nau.edu",
  },
  {
    id: "acct-huang",
    username: "whuang",
    displayName: "Dr. Wei Huang",
    email: "wei.huang@nau.edu",
  },
  {
    id: "acct-alvarez",
    username: "palvarez",
    displayName: "Priya Alvarez",
    email: "priya.alvarez@nau.edu",
  },
  {
    id: "acct-becker",
    username: "sbecker",
    displayName: "Sam Becker",
    email: "sam.becker@nau.edu",
  },
  {
    id: "acct-jsmith",
    username: "jsmith",
    displayName: "Jordan Smith",
    email: "jsmith@nau.edu",
  },
  {
    id: "acct-lchen",
    username: "lchen",
    displayName: "Lin Chen",
    email: "lchen@nau.edu",
  },
  {
    id: "acct-mgarcia",
    username: "mgarcia",
    displayName: "Maria Garcia",
    email: "mgarcia@nau.edu",
  },
  {
    id: "acct-rpatel",
    username: "rpatel",
    displayName: "Ravi Patel",
    email: "rpatel@nau.edu",
  },
  {
    id: "acct-kim",
    username: "jkim",
    displayName: "Jamie Kim",
    email: "jkim@nau.edu",
  },
  {
    id: "acct-foster",
    username: "afoster",
    displayName: "Alex Foster",
    email: "afoster@nau.edu",
  },
  {
    id: "acct-nguyen",
    username: "tnguyen",
    displayName: "Taylor Nguyen",
    email: "tnguyen@nau.edu",
  },
  {
    id: "acct-wright",
    username: "ewright",
    displayName: "Emily Wright",
    email: "ewright@nau.edu",
  },
];

/** Account IDs with the lab manager role assigned (future: role_assignments table). */
export const seedLabManagerAccountIds: string[] = [
  "acct-reyes",
  "acct-obrien",
  "acct-huang",
];

/** Lab IDs each lab manager account is allowed to manage (future: join table). */
export const seedLabManagerLabIds: Record<string, string[]> = {
  "acct-reyes": ["lab-uas"],
  "acct-obrien": ["lab-lidar"],
  "acct-huang": ["lab-spectro"],
};

export const seedConsumables: Consumable[] = [
  {
    id: "cons-uas-towels",
    name: "Paper towels",
    description: "General lab stock for cleaning workstations and gear.",
    labId: "lab-uas",
    equipmentId: null,
    imageUrl: null,
    lowNotifyEnabled: true,
    status: "ok",
    reportedLowAt: null,
    reportedLowByUserId: null,
    reportedLowByUserName: null,
  },
  {
    id: "cons-uas-wipes",
    name: "Isopropyl alcohol wipes",
    description: "For cleaning lenses and sensor surfaces before flights.",
    labId: "lab-uas",
    equipmentId: null,
    imageUrl: null,
    lowNotifyEnabled: true,
    status: "ok",
    reportedLowAt: null,
    reportedLowByUserId: null,
    reportedLowByUserName: null,
  },
  {
    id: "cons-eq1-batteries",
    name: "TB65 flight batteries",
    description: "Spare batteries for the Matrice 350 RTK.",
    labId: "lab-uas",
    equipmentId: "eq-1",
    imageUrl: null,
    lowNotifyEnabled: true,
    status: "ok",
    reportedLowAt: null,
    reportedLowByUserId: null,
    reportedLowByUserName: null,
  },
  {
    id: "cons-lidar-targets",
    name: "Registration targets",
    description: "Reflective targets used during terrestrial scans.",
    labId: "lab-lidar",
    equipmentId: null,
    imageUrl: null,
    lowNotifyEnabled: true,
    status: "ok",
    reportedLowAt: null,
    reportedLowByUserId: null,
    reportedLowByUserName: null,
  },
  {
    id: "cons-eq4-sd",
    name: "High-capacity SD cards",
    description: "Spare media for the RIEGL VZ-400i.",
    labId: "lab-lidar",
    equipmentId: "eq-4",
    imageUrl: null,
    lowNotifyEnabled: false,
    status: "ok",
    reportedLowAt: null,
    reportedLowByUserId: null,
    reportedLowByUserName: null,
  },
  {
    id: "cons-spectro-refs",
    name: "White reference panels",
    description: "Spectralon panels for FieldSpec calibration.",
    labId: "lab-spectro",
    equipmentId: "eq-7",
    imageUrl: null,
    lowNotifyEnabled: true,
    status: "ok",
    reportedLowAt: null,
    reportedLowByUserId: null,
    reportedLowByUserName: null,
  },
];

// Dates are relative to today so the calendar always has something to show.
export const seedBookings: Booking[] = [
  {
    id: "booking-seed-1",
    equipmentId: "eq-1",
    userId: "user-jsmith",
    userName: "jsmith",
    startDate: isoDateOffset(-12),
    endDate: isoDateOffset(-10),
    startTime: null,
    endTime: null,
  },
  {
    id: "booking-seed-2",
    equipmentId: "eq-1",
    userId: "user-lchen",
    userName: "lchen",
    startDate: isoDateOffset(-5),
    endDate: isoDateOffset(-4),
    startTime: null,
    endTime: null,
  },
  {
    id: "booking-seed-3",
    equipmentId: "eq-1",
    userId: "user-mgarcia",
    userName: "mgarcia",
    startDate: isoDateOffset(3),
    endDate: isoDateOffset(6),
    startTime: null,
    endTime: null,
  },
  {
    id: "booking-seed-4",
    equipmentId: "eq-4",
    userId: "user-jsmith",
    userName: "jsmith",
    startDate: isoDateOffset(-2),
    endDate: isoDateOffset(1),
    startTime: null,
    endTime: null,
  },
  {
    id: "booking-seed-5",
    equipmentId: "eq-4",
    userId: "user-rpatel",
    userName: "rpatel",
    startDate: isoDateOffset(8),
    endDate: isoDateOffset(9),
    startTime: null,
    endTime: null,
  },
  {
    id: "booking-seed-6",
    equipmentId: "eq-7",
    userId: "user-lchen",
    userName: "lchen",
    startDate: isoDateOffset(-1),
    endDate: isoDateOffset(-1),
    startTime: null,
    endTime: null,
  },
  {
    id: "booking-seed-7",
    equipmentId: "eq-9",
    userId: "user-mgarcia",
    userName: "mgarcia",
    startDate: isoDateOffset(-20),
    endDate: isoDateOffset(-13),
    startTime: null,
    endTime: null,
  },
  {
    id: "booking-seed-8",
    equipmentId: "eq-12",
    userId: "user-rpatel",
    userName: "rpatel",
    startDate: isoDateOffset(2),
    endDate: isoDateOffset(2),
    startTime: null,
    endTime: null,
  },
];

/** ISO datetime a given number of hours in the past, for seeded activity. */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// Seeded audit trail matching the story told by the other seed data, so the
// admin Activity view always has content on a fresh session.
export const seedActivities: ActivityEvent[] = [
  {
    id: "act-seed-1",
    timestamp: hoursAgo(30),
    actorId: "user-admin",
    actorName: "admin",
    actorRole: "admin",
    action: "addLabManager",
    summary: "Added Dr. Wei Huang as a lab manager",
  },
  {
    id: "act-seed-2",
    timestamp: hoursAgo(29.8),
    actorId: "user-admin",
    actorName: "admin",
    actorRole: "admin",
    action: "assignLabs",
    summary: "Assigned Spectroscopy Lab to Dr. Wei Huang",
  },
  {
    id: "act-seed-3",
    timestamp: hoursAgo(27),
    actorId: "user-jsmith",
    actorName: "jsmith",
    actorRole: "user",
    action: "signIn",
    summary: "Signed in as Standard User",
  },
  {
    id: "act-seed-4",
    timestamp: hoursAgo(26.5),
    actorId: "user-jsmith",
    actorName: "jsmith",
    actorRole: "user",
    action: "createBooking",
    summary: `Reserved RIEGL VZ-400i (${isoDateOffset(-2)} to ${isoDateOffset(1)})`,
  },
  {
    id: "act-seed-5",
    timestamp: hoursAgo(22),
    actorId: "user-areyes",
    actorName: "areyes",
    actorRole: "labOwner",
    action: "signIn",
    summary: "Signed in as Lab Owner",
  },
  {
    id: "act-seed-6",
    timestamp: hoursAgo(21.5),
    actorId: "user-areyes",
    actorName: "areyes",
    actorRole: "labOwner",
    action: "addEquipment",
    summary: "Added MicaSense RedEdge-P to UAS & Drone Lab",
  },
  {
    id: "act-seed-7",
    timestamp: hoursAgo(8),
    actorId: "user-admin",
    actorName: "admin",
    actorRole: "admin",
    action: "addSoftware",
    summary: "Added ENVI + IDL License to the shared software list",
  },
  {
    id: "act-seed-8",
    timestamp: hoursAgo(5),
    actorId: "user-lchen",
    actorName: "lchen",
    actorRole: "user",
    action: "createBooking",
    summary: `Reserved ASD FieldSpec 4 (${isoDateOffset(-1)} to ${isoDateOffset(-1)})`,
  },
  {
    id: "act-seed-9",
    timestamp: hoursAgo(2),
    actorId: "user-rpatel",
    actorName: "rpatel",
    actorRole: "user",
    action: "createBooking",
    summary: `Reserved Trimble R12i GNSS Receiver (${isoDateOffset(2)} to ${isoDateOffset(2)})`,
  },
];
