import type { Booking, Equipment, Lab } from "../types";

// Placeholder seed data invented for the remote-sensing domain.
// Replace with real Radiant Center inventory once the database exists.

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

export const seedEquipment: Equipment[] = [
  {
    id: "eq-1",
    labId: "lab-uas",
    name: "DJI Matrice 350 RTK",
    description: "Heavy-lift drone platform with RTK positioning for survey-grade mapping.",
    category: "equipment",
    status: "available",
  },
  {
    id: "eq-2",
    labId: "lab-uas",
    name: "MicaSense RedEdge-P",
    description: "Multispectral camera for vegetation and agriculture imaging.",
    category: "equipment",
    status: "available",
  },
  {
    id: "eq-3",
    labId: null,
    name: "Pix4Dmapper License",
    description: "Photogrammetry software seat for drone imagery processing.",
    category: "software",
    status: "available",
  },
  {
    id: "eq-4",
    labId: "lab-lidar",
    name: "RIEGL VZ-400i",
    description: "Terrestrial laser scanner for high-resolution 3D scanning.",
    category: "equipment",
    status: "available",
  },
  {
    id: "eq-5",
    labId: "lab-lidar",
    name: "Velodyne Puck (VLP-16)",
    description: "Compact LiDAR sensor for mobile mapping experiments.",
    category: "equipment",
    status: "maintenance",
  },
  {
    id: "eq-6",
    labId: "lab-lidar",
    name: "CloudCompare Workstation",
    description: "Dedicated workstation configured for large point-cloud processing.",
    category: "equipment",
    status: "available",
  },
  {
    id: "eq-7",
    labId: "lab-spectro",
    name: "ASD FieldSpec 4",
    description: "Full-range field spectroradiometer (350-2500 nm).",
    category: "equipment",
    status: "available",
  },
  {
    id: "eq-8",
    labId: "lab-spectro",
    name: "Spectralon Calibration Panel",
    description: "White reference panel for reflectance calibration.",
    category: "equipment",
    status: "available",
  },
  {
    id: "eq-9",
    labId: null,
    name: "ArcGIS Pro License",
    description: "Floating license seat for ArcGIS Pro with extensions.",
    category: "software",
    status: "available",
  },
  {
    id: "eq-10",
    labId: null,
    name: "ENVI + IDL License",
    description: "Hyperspectral image analysis software seat.",
    category: "software",
    status: "available",
  },
  {
    id: "eq-11",
    labId: "lab-gis",
    name: "GPU Workstation (RTX 6000)",
    description: "High-performance workstation for deep learning on imagery.",
    category: "equipment",
    status: "available",
  },
  {
    id: "eq-12",
    labId: "lab-field",
    name: "Trimble R12i GNSS Receiver",
    description: "Survey-grade GNSS receiver with tilt compensation.",
    category: "equipment",
    status: "available",
  },
  {
    id: "eq-13",
    labId: "lab-field",
    name: "Kestrel 5500 Weather Meter",
    description: "Portable weather station for field campaigns.",
    category: "equipment",
    status: "available",
  },
];

export const seedBookings: Booking[] = [];
