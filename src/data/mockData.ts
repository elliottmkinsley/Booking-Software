import { isoDateOffset } from "../utils/dates";
import type { Booking, Equipment, Lab, Person, Training } from "../types";

// Placeholder seed data invented for the remote-sensing domain.
// Replace with real Radiant Center inventory, staff, and trainings once the
// database exists. Emails and user guide links are fake placeholders.

export const seedLabs: Lab[] = [
  {
    id: "lab-uas",
    name: "UAS & Drone Lab",
    description:
      "Unmanned aerial systems for aerial imaging, photogrammetry, and multispectral surveys.",
  },
  {
    id: "lab-lidar",
    name: "LiDAR & Terrestrial Scanning Lab",
    description:
      "Terrestrial and mobile laser scanning systems for 3D terrain and vegetation structure mapping.",
  },
  {
    id: "lab-spectro",
    name: "Spectroscopy Lab",
    description:
      "Field and lab spectroradiometers for surface reflectance and calibration work.",
  },
  {
    id: "lab-gis",
    name: "GIS & Computing Lab",
    description:
      "High-performance workstations and geospatial software licenses for analysis and modeling.",
  },
  {
    id: "lab-field",
    name: "Field Instruments Lab",
    description:
      "GPS/GNSS receivers, weather stations, and general field survey equipment.",
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
  },
  {
    id: "train-part107",
    name: "FAA Part 107 Certification Check",
    description:
      "Verification of a current remote pilot certificate before any UAS flight operation.",
  },
  {
    id: "train-uas-flight",
    name: "UAS Flight Operations",
    description:
      "Hands-on preflight checks, mission planning, and emergency procedures for lab drone platforms.",
  },
  {
    id: "train-lidar-ops",
    name: "Terrestrial LiDAR Operation",
    description:
      "Scanner setup, registration targets, and safe handling of Class 1 laser instruments.",
  },
  {
    id: "train-spectro-cal",
    name: "Spectroradiometer Handling & Calibration",
    description:
      "White reference calibration, fiber optic care, and reflectance measurement protocol.",
  },
  {
    id: "train-gnss-survey",
    name: "GNSS Survey Basics",
    description:
      "Base/rover setup, RTK corrections, and coordinate system selection for survey work.",
  },
  {
    id: "train-software-onboard",
    name: "Geospatial Software Onboarding",
    description:
      "License checkout rules, data storage policy, and shared workstation etiquette.",
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
    imageUrl: null,
    trainingIds: ["train-lab-safety", "train-part107", "train-uas-flight"],
    ownerId: "person-reyes",
    trainerIds: ["person-nakai", "person-tsosie"],
    userGuideUrl: `${GUIDE_BASE}/matrice-350-rtk.pdf`,
  },
  {
    id: "eq-2",
    labId: "lab-uas",
    name: "MicaSense RedEdge-P",
    description:
      "Multispectral camera for vegetation and agriculture imaging, capturing five discrete bands plus a panchromatic channel.",
    category: "equipment",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-lab-safety", "train-uas-flight"],
    ownerId: "person-reyes",
    trainerIds: ["person-nakai"],
    userGuideUrl: `${GUIDE_BASE}/rededge-p.pdf`,
  },
  {
    id: "eq-3",
    labId: null,
    name: "Pix4Dmapper License",
    description:
      "Photogrammetry software seat for drone imagery processing, including point cloud and orthomosaic generation.",
    category: "software",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-software-onboard"],
    ownerId: "person-alvarez",
    trainerIds: ["person-tsosie"],
    userGuideUrl: `${GUIDE_BASE}/pix4dmapper.pdf`,
  },
  {
    id: "eq-4",
    labId: "lab-lidar",
    name: "RIEGL VZ-400i",
    description:
      "Terrestrial laser scanner for high-resolution 3D scanning with onboard registration and up to 800 m range.",
    category: "equipment",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-lab-safety", "train-lidar-ops"],
    ownerId: "person-obrien",
    trainerIds: ["person-tsosie"],
    userGuideUrl: `${GUIDE_BASE}/riegl-vz-400i.pdf`,
  },
  {
    id: "eq-5",
    labId: "lab-lidar",
    name: "Velodyne Puck (VLP-16)",
    description:
      "Compact LiDAR sensor for mobile mapping experiments and backpack/vehicle-mounted scanning rigs.",
    category: "equipment",
    status: "maintenance",
    imageUrl: null,
    trainingIds: ["train-lab-safety", "train-lidar-ops"],
    ownerId: "person-obrien",
    trainerIds: ["person-tsosie"],
    userGuideUrl: null,
  },
  {
    id: "eq-6",
    labId: "lab-lidar",
    name: "CloudCompare Workstation",
    description:
      "Dedicated workstation configured for large point-cloud processing with 256 GB RAM and fast local scratch storage.",
    category: "equipment",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-lab-safety"],
    ownerId: "person-obrien",
    trainerIds: ["person-alvarez"],
    userGuideUrl: `${GUIDE_BASE}/cloudcompare-workstation.pdf`,
  },
  {
    id: "eq-7",
    labId: "lab-spectro",
    name: "ASD FieldSpec 4",
    description:
      "Full-range field spectroradiometer (350-2500 nm) for surface reflectance measurement and sensor calibration.",
    category: "equipment",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-lab-safety", "train-spectro-cal"],
    ownerId: "person-huang",
    trainerIds: ["person-huang", "person-tsosie"],
    userGuideUrl: `${GUIDE_BASE}/fieldspec-4.pdf`,
  },
  {
    id: "eq-8",
    labId: "lab-spectro",
    name: "Spectralon Calibration Panel",
    description:
      "White reference panel for reflectance calibration. Handle with gloves and store in the protective case.",
    category: "equipment",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-spectro-cal"],
    ownerId: "person-huang",
    trainerIds: ["person-huang"],
    userGuideUrl: `${GUIDE_BASE}/spectralon-panel.pdf`,
  },
  {
    id: "eq-9",
    labId: null,
    name: "ArcGIS Pro License",
    description:
      "Floating license seat for ArcGIS Pro with Spatial Analyst and Image Analyst extensions.",
    category: "software",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-software-onboard"],
    ownerId: "person-alvarez",
    trainerIds: ["person-alvarez"],
    userGuideUrl: `${GUIDE_BASE}/arcgis-pro.pdf`,
  },
  {
    id: "eq-10",
    labId: null,
    name: "ENVI + IDL License",
    description:
      "Hyperspectral image analysis software seat with IDL scripting for custom processing workflows.",
    category: "software",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-software-onboard"],
    ownerId: "person-alvarez",
    trainerIds: ["person-huang"],
    userGuideUrl: `${GUIDE_BASE}/envi-idl.pdf`,
  },
  {
    id: "eq-11",
    labId: "lab-gis",
    name: "GPU Workstation (RTX 6000)",
    description:
      "High-performance workstation for deep learning on imagery, with CUDA toolchain and common ML frameworks preinstalled.",
    category: "equipment",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-lab-safety", "train-software-onboard"],
    ownerId: "person-alvarez",
    trainerIds: ["person-alvarez"],
    userGuideUrl: `${GUIDE_BASE}/gpu-workstation.pdf`,
  },
  {
    id: "eq-12",
    labId: "lab-field",
    name: "Trimble R12i GNSS Receiver",
    description:
      "Survey-grade GNSS receiver with tilt compensation for rapid ground control point collection.",
    category: "equipment",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-lab-safety", "train-gnss-survey"],
    ownerId: "person-becker",
    trainerIds: ["person-becker", "person-tsosie"],
    userGuideUrl: `${GUIDE_BASE}/trimble-r12i.pdf`,
  },
  {
    id: "eq-13",
    labId: "lab-field",
    name: "Kestrel 5500 Weather Meter",
    description:
      "Portable weather station for field campaigns, logging wind, temperature, humidity, and pressure.",
    category: "equipment",
    status: "available",
    imageUrl: null,
    trainingIds: ["train-lab-safety"],
    ownerId: "person-becker",
    trainerIds: ["person-becker"],
    userGuideUrl: `${GUIDE_BASE}/kestrel-5500.pdf`,
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
  },
  {
    id: "booking-seed-2",
    equipmentId: "eq-1",
    userId: "user-lchen",
    userName: "lchen",
    startDate: isoDateOffset(-5),
    endDate: isoDateOffset(-4),
  },
  {
    id: "booking-seed-3",
    equipmentId: "eq-1",
    userId: "user-mgarcia",
    userName: "mgarcia",
    startDate: isoDateOffset(3),
    endDate: isoDateOffset(6),
  },
  {
    id: "booking-seed-4",
    equipmentId: "eq-4",
    userId: "user-jsmith",
    userName: "jsmith",
    startDate: isoDateOffset(-2),
    endDate: isoDateOffset(1),
  },
  {
    id: "booking-seed-5",
    equipmentId: "eq-4",
    userId: "user-rpatel",
    userName: "rpatel",
    startDate: isoDateOffset(8),
    endDate: isoDateOffset(9),
  },
  {
    id: "booking-seed-6",
    equipmentId: "eq-7",
    userId: "user-lchen",
    userName: "lchen",
    startDate: isoDateOffset(-1),
    endDate: isoDateOffset(-1),
  },
  {
    id: "booking-seed-7",
    equipmentId: "eq-9",
    userId: "user-mgarcia",
    userName: "mgarcia",
    startDate: isoDateOffset(-20),
    endDate: isoDateOffset(-13),
  },
  {
    id: "booking-seed-8",
    equipmentId: "eq-12",
    userId: "user-rpatel",
    userName: "rpatel",
    startDate: isoDateOffset(2),
    endDate: isoDateOffset(2),
  },
];
