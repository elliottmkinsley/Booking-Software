/**
 * Builds Diagrams and Tables/radiant-tables.xlsx from the planned Azure schema.
 *
 * Run from the repo root:
 *   node scripts/build-schema-workbook.mjs
 *
 * The workbook is the spreadsheet teammates can open without dbdiagram.io —
 * one sheet per table, plus a roles matrix. Edit the `tables` array below
 * when the schema changes, then re-run this script.
 */
import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "Diagrams and Tables", "radiant-tables.xlsx");

/** @typedef {{ name: string, type: string, null: string, notes: string }} Col */
/** @typedef {{ table: string, purpose: string, mapsFrom: string, columns: Col[] }} TableSpec */

/** @type {TableSpec[]} */
const tables = [
  {
    table: "Users",
    purpose: "Directory + auth identity",
    mapsFrom: "accounts + session User + people",
    columns: [
      ["id", "uniqueidentifier", "N", "PK"],
      ["username", "nvarchar(100)", "N", "Unique, case-insensitive index"],
      ["display_name", "nvarchar(200)", "N", ""],
      ["email", "nvarchar(256)", "N", "Unique"],
      ["password_hash", "nvarchar(500)", "Y", "Null if Azure AD / Entra only"],
      ["title", "nvarchar(200)", "Y", "From Person.title (staff)"],
      ["is_active", "bit", "N", "Default 1"],
      ["created_at", "datetime2", "N", ""],
    ],
  },
  {
    table: "UserRoles",
    purpose: "Capability roles on a user",
    mapsFrom: "labManagerAccountIds, trainerAccountIds, admin session",
    columns: [
      ["user_id", "uniqueidentifier", "N", "PK, FK → Users"],
      [
        "role",
        "nvarchar(32)",
        "N",
        "PK. Values: user | lab_manager | trainer | admin",
      ],
    ],
  },
  {
    table: "Labs",
    purpose: "Physical labs in the center",
    mapsFrom: "labs",
    columns: [
      ["id", "uniqueidentifier", "N", "PK"],
      ["name", "nvarchar(200)", "N", ""],
      ["description", "nvarchar(max)", "N", ""],
      ["image_url", "nvarchar(1000)", "Y", "Blob URL or path"],
    ],
  },
  {
    table: "LabManagerLabs",
    purpose: "Which labs each lab manager owns",
    mapsFrom: "labManagerLabIds",
    columns: [
      ["user_id", "uniqueidentifier", "N", "PK, FK → Users"],
      ["lab_id", "uniqueidentifier", "N", "PK, FK → Labs"],
    ],
  },
  {
    table: "Equipment",
    purpose: "Physical gear and shared software (category discriminator)",
    mapsFrom: "equipment",
    columns: [
      ["id", "uniqueidentifier", "N", "PK"],
      ["lab_id", "uniqueidentifier", "Y", "FK → Labs. Null for software"],
      ["name", "nvarchar(200)", "N", "Unique per lab recommended"],
      ["description", "nvarchar(max)", "N", ""],
      ["category", "nvarchar(32)", "N", "equipment | software"],
      ["status", "nvarchar(32)", "N", "available | maintenance"],
      [
        "rental_granularity",
        "nvarchar(32)",
        "N",
        "30min | hourly | daily | weekly",
      ],
      ["owner_user_id", "uniqueidentifier", "Y", "FK → Users (was Person.id)"],
      ["image_url", "nvarchar(1000)", "Y", ""],
      ["user_guide_url", "nvarchar(1000)", "Y", ""],
      ["download_url", "nvarchar(1000)", "Y", "Software only"],
      ["access_instructions", "nvarchar(max)", "Y", "Software only"],
      ["contact_name", "nvarchar(200)", "Y", "Software only"],
      ["contact_email", "nvarchar(256)", "Y", "Software only"],
    ],
  },
  {
    table: "Trainings",
    purpose: "Training catalog",
    mapsFrom: "trainings",
    columns: [
      ["id", "uniqueidentifier", "N", "PK"],
      ["name", "nvarchar(200)", "N", "Unique recommended"],
      ["description", "nvarchar(max)", "N", ""],
      ["how_to_complete", "nvarchar(max)", "N", ""],
    ],
  },
  {
    table: "EquipmentTrainings",
    purpose: "Required trainings before booking an item",
    mapsFrom: "equipment.trainingIds",
    columns: [
      ["equipment_id", "uniqueidentifier", "N", "PK, FK → Equipment"],
      ["training_id", "uniqueidentifier", "N", "PK, FK → Trainings"],
    ],
  },
  {
    table: "EquipmentTrainers",
    purpose: "Certified trainers for one item",
    mapsFrom: "equipment.trainerIds",
    columns: [
      ["equipment_id", "uniqueidentifier", "N", "PK, FK → Equipment"],
      ["user_id", "uniqueidentifier", "N", "PK, FK → Users"],
    ],
  },
  {
    table: "Bookings",
    purpose: "Equipment reservations",
    mapsFrom: "bookings",
    columns: [
      ["id", "uniqueidentifier", "N", "PK"],
      ["equipment_id", "uniqueidentifier", "N", "FK → Equipment"],
      ["user_id", "uniqueidentifier", "N", "FK → Users"],
      ["start_date", "date", "N", ""],
      ["end_date", "date", "N", "Inclusive"],
      ["start_time", "time", "Y", "Null = whole day(s)"],
      ["end_time", "time", "Y", "Null with start_time"],
    ],
  },
  {
    table: "UserTrainingEnrollments",
    purpose: "Your trainings list",
    mapsFrom: "userTrainingIds",
    columns: [
      ["user_id", "uniqueidentifier", "N", "PK, FK → Users"],
      ["training_id", "uniqueidentifier", "N", "PK, FK → Trainings"],
      ["enrolled_at", "datetime2", "N", ""],
    ],
  },
  {
    table: "UserTrainingCompletions",
    purpose: "Real completion records (replaces hash demo)",
    mapsFrom: "approvedTrainingIds + trainingService.buildRecord",
    columns: [
      ["user_id", "uniqueidentifier", "N", "PK, FK → Users"],
      ["training_id", "uniqueidentifier", "N", "PK, FK → Trainings"],
      ["completed_at", "datetime2", "N", ""],
      ["approved_by_user_id", "uniqueidentifier", "Y", "FK → Users"],
      [
        "access_request_id",
        "uniqueidentifier",
        "Y",
        "FK → TrainingAccessRequests",
      ],
    ],
  },
  {
    table: "TrainingAccessRequests",
    purpose: "User requests for training approval",
    mapsFrom: "trainingAccessRequests",
    columns: [
      ["id", "uniqueidentifier", "N", "PK"],
      ["training_id", "uniqueidentifier", "N", "FK → Trainings"],
      ["user_id", "uniqueidentifier", "N", "FK → Users"],
      ["message", "nvarchar(max)", "N", ""],
      ["status", "nvarchar(32)", "N", "pending | approved | denied"],
      ["created_at", "datetime2", "N", ""],
      ["reviewed_at", "datetime2", "Y", ""],
      ["reviewed_by_user_id", "uniqueidentifier", "Y", "FK → Users"],
    ],
  },
  {
    table: "Consumables",
    purpose: "Lab or equipment supplies",
    mapsFrom: "consumables",
    columns: [
      ["id", "uniqueidentifier", "N", "PK"],
      ["name", "nvarchar(200)", "N", ""],
      ["description", "nvarchar(max)", "N", ""],
      ["lab_id", "uniqueidentifier", "Y", "FK → Labs"],
      ["equipment_id", "uniqueidentifier", "Y", "FK → Equipment; null = lab-general"],
      ["image_url", "nvarchar(1000)", "Y", ""],
      ["low_notify_enabled", "bit", "N", ""],
      ["status", "nvarchar(32)", "N", "ok | low"],
      ["reported_low_at", "datetime2", "Y", ""],
      ["reported_low_by_user_id", "uniqueidentifier", "Y", "FK → Users"],
    ],
  },
  {
    table: "Notifications",
    purpose: "In-app notices (audience preferably computed at read time)",
    mapsFrom: "notifications",
    columns: [
      ["id", "uniqueidentifier", "N", "PK"],
      ["type", "nvarchar(32)", "N", "consumableLow | trainingRequest"],
      ["created_at", "datetime2", "N", ""],
      ["summary", "nvarchar(500)", "N", ""],
      ["consumable_id", "uniqueidentifier", "Y", "FK → Consumables"],
      ["training_id", "uniqueidentifier", "Y", "FK → Trainings"],
      ["request_id", "uniqueidentifier", "Y", "FK → TrainingAccessRequests"],
      ["lab_id", "uniqueidentifier", "Y", "FK → Labs"],
      ["notify_admin", "bit", "N", ""],
    ],
  },
  {
    table: "NotificationReads",
    purpose: "Per-user read state",
    mapsFrom: "notifications.readByUserIds",
    columns: [
      ["notification_id", "uniqueidentifier", "N", "PK, FK → Notifications"],
      ["user_id", "uniqueidentifier", "N", "PK, FK → Users"],
      ["read_at", "datetime2", "N", ""],
    ],
  },
  {
    table: "ActivityLog",
    purpose: "Admin audit trail",
    mapsFrom: "activities",
    columns: [
      ["id", "uniqueidentifier", "N", "PK"],
      ["timestamp", "datetime2", "N", ""],
      ["actor_user_id", "uniqueidentifier", "N", "FK → Users"],
      ["action", "nvarchar(64)", "N", "See ActivityAction in src/types.ts"],
      ["summary", "nvarchar(500)", "N", "Immutable human text"],
    ],
  },
].map((t) => ({
  ...t,
  columns: t.columns.map(([name, type, nullable, notes]) => ({
    name,
    type,
    null: nullable,
    notes,
  })),
}));

const workbook = new ExcelJS.Workbook();
workbook.creator = "Radiant Booking";
workbook.created = new Date();

const catalog = workbook.addWorksheet("Catalog", {
  views: [{ state: "frozen", ySplit: 1 }],
});
catalog.columns = [
  { header: "Table", key: "table", width: 28 },
  { header: "Purpose", key: "purpose", width: 48 },
  { header: "Maps from mock", key: "mapsFrom", width: 44 },
  { header: "Columns", key: "count", width: 10 },
];
styleHeader(catalog.getRow(1));
for (const table of tables) {
  catalog.addRow({
    table: table.table,
    purpose: table.purpose,
    mapsFrom: table.mapsFrom,
    count: table.columns.length,
  });
}

const roles = workbook.addWorksheet("Roles", {
  views: [{ state: "frozen", ySplit: 1 }],
});
roles.columns = [
  { header: "Capability", key: "cap", width: 40 },
  { header: "Standard user", key: "user", width: 14 },
  { header: "Lab manager*", key: "mgr", width: 14 },
  { header: "Trainer", key: "trn", width: 12 },
  { header: "Admin", key: "adm", width: 10 },
];
styleHeader(roles.getRow(1));
const roleRows = [
  ["Browse labs / equipment / software", "Y", "Y (assigned)", "Y", "Y"],
  ["Book equipment", "Y", "Y", "Y", "Y"],
  ["Request training access", "Y", "", "", ""],
  ["Add/edit equipment in a lab", "", "Y assigned", "", "Y"],
  ["Import Excel equipment", "", "Y assigned", "", "Y"],
  ["Manage trainer directory", "", "Y", "", "Y"],
  ["Review training requests", "", "Y", "Y", "Y"],
  ["Manage training catalog", "", "", "", "Y"],
  ["Add software / create labs", "", "", "", "Y"],
  ["Assign lab managers", "", "", "", "Y"],
  ["View activity log", "", "", "", "Y"],
];
for (const [cap, user, mgr, trn, adm] of roleRows) {
  roles.addRow({ cap, user, mgr, trn, adm });
}
roles.addRow({});
roles.addRow({
  cap: "* Lab manager = persisted lab_manager role + LabManagerLabs assignment (not client-chosen session role).",
});

for (const table of tables) {
  const sheet = workbook.addWorksheet(table.table.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Column", key: "name", width: 26 },
    { header: "Type", key: "type", width: 22 },
    { header: "Null", key: "null", width: 8 },
    { header: "Notes", key: "notes", width: 55 },
  ];
  styleHeader(sheet.getRow(1));
  for (const col of table.columns) {
    sheet.addRow(col);
  }
  sheet.getCell("A" + (table.columns.length + 3)).value = "Purpose";
  sheet.getCell("B" + (table.columns.length + 3)).value = table.purpose;
  sheet.getCell("A" + (table.columns.length + 4)).value = "Maps from mock";
  sheet.getCell("B" + (table.columns.length + 4)).value = table.mapsFrom;
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4E79" },
  };
  row.alignment = { vertical: "middle" };
}

mkdirSync(dirname(outPath), { recursive: true });
await workbook.xlsx.writeFile(outPath);
console.log("Wrote", outPath);
