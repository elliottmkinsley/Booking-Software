import type { Workbook, Worksheet } from "exceljs";
import type {
  EquipmentStatus,
  Lab,
  RentalGranularity,
  User,
} from "../types";
import { addEquipmentBatch, getEquipmentForLab } from "./labService";
import { getPeople } from "./peopleService";
import { getTrainers } from "./trainerService";
import { getAllTrainings } from "./trainingService";

// MOCK IMPLEMENTATION - the workbook is built and parsed in the browser today.
// With a real API the upload would be posted to the server, which would do the
// parsing and validation instead.

/** ExcelJS is ~900 KB, so it is only fetched when someone opens the importer. */
async function loadExcelJs(): Promise<{ Workbook: new () => Workbook }> {
  const mod = (await import("exceljs")) as unknown as {
    Workbook?: new () => Workbook;
    default?: { Workbook: new () => Workbook };
  };
  if (mod.Workbook) return { Workbook: mod.Workbook };
  if (mod.default?.Workbook) return { Workbook: mod.default.Workbook };
  throw new Error("Could not load the spreadsheet library.");
}

const SHEET_NAME = "Equipment";
const INSTRUCTIONS_SHEET = "Instructions";
const REFERENCE_SHEET = "Valid values";
/** Rows that get dropdowns and borders in the blank template. */
const TEMPLATE_ROWS = 200;

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const GRANULARITY_CHOICES = ["30 minutes", "Hourly", "Daily", "Weekly"];
const STATUS_CHOICES = ["Available", "Under maintenance"];

type ColumnKey =
  | "name"
  | "description"
  | "rentalGranularity"
  | "status"
  | "owner"
  | "trainers"
  | "trainings"
  | "userGuideUrl";

interface ColumnSpec {
  key: ColumnKey;
  header: string;
  width: number;
  /** Normalized fragments used to find this column in an uploaded file. */
  aliases: string[];
  help: string;
  example: string;
}

const COLUMNS: ColumnSpec[] = [
  {
    key: "name",
    header: "Name *",
    width: 32,
    aliases: ["name"],
    help: "Required. Must be unique within the lab.",
    example: "Trimble R12i GNSS Receiver",
  },
  {
    key: "description",
    header: "Description",
    width: 46,
    aliases: ["description"],
    help: "One or two sentences shown on the equipment card.",
    example: "Survey-grade GNSS receiver with tilt compensation.",
  },
  {
    key: "rentalGranularity",
    header: "Rental granularity",
    width: 20,
    aliases: ["rentalgranularity", "granularity", "rental"],
    help: `How finely it can be booked: ${GRANULARITY_CHOICES.join(
      ", "
    )}. Blank means Daily.`,
    example: "Daily",
  },
  {
    key: "status",
    header: "Status",
    width: 20,
    aliases: ["status"],
    help: `${STATUS_CHOICES.join(" or ")}. Blank means Available.`,
    example: "Available",
  },
  {
    key: "owner",
    header: "Owner (name or email)",
    width: 28,
    aliases: ["owner"],
    help: "Must match a staff member on the 'Valid values' sheet. Optional.",
    example: "",
  },
  {
    key: "trainers",
    header: "Certified trainers (separate with ;)",
    width: 34,
    aliases: ["certifiedtrainers", "trainers", "trainer"],
    help: "Names or emails of trainers, separated by semicolons. Optional.",
    example: "",
  },
  {
    key: "trainings",
    header: "Required trainings (separate with ;)",
    width: 34,
    aliases: ["requiredtrainings", "trainings", "training"],
    help:
      "Trainings someone must finish before booking, separated by " +
      "semicolons. Optional.",
    example: "",
  },
  {
    key: "userGuideUrl",
    header: "User guide link",
    width: 30,
    aliases: ["userguide", "guide", "manual"],
    help: "Link to a manual or SOP. Optional.",
    example: "",
  },
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Turns any ExcelJS cell value (rich text, formula, link, date) into text. */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    const candidate = value as {
      text?: unknown;
      result?: unknown;
      hyperlink?: unknown;
      richText?: { text: string }[];
    };
    if (Array.isArray(candidate.richText)) {
      return candidate.richText.map((part) => part.text).join("").trim();
    }
    if (typeof candidate.text === "string") return candidate.text.trim();
    if (candidate.result !== undefined) return cellText(candidate.result);
    if (typeof candidate.hyperlink === "string") {
      return candidate.hyperlink.trim();
    }
  }
  return "";
}

const GRANULARITY_BY_TEXT: Record<string, RentalGranularity> = {
  "30min": "30min",
  "30minutes": "30min",
  "30": "30min",
  halfhour: "30min",
  hourly: "hourly",
  hour: "hourly",
  daily: "daily",
  day: "daily",
  weekly: "weekly",
  week: "weekly",
};

const STATUS_BY_TEXT: Record<string, EquipmentStatus> = {
  available: "available",
  ready: "available",
  maintenance: "maintenance",
  undermaintenance: "maintenance",
  outofservice: "maintenance",
  down: "maintenance",
};

/**
 * Splits a multi-value cell. Semicolons are the documented separator, but a
 * comma-separated cell still works as long as the names themselves match.
 */
function resolveList<T>(
  raw: string,
  resolve: (token: string) => T | undefined
): { matched: T[]; unmatched: string[] } {
  const matched: T[] = [];
  const unmatched: string[] = [];
  const chunks = raw
    .split(/[;\n]/)
    .map((token) => token.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const direct = resolve(chunk);
    if (direct !== undefined) {
      matched.push(direct);
      continue;
    }
    if (chunk.includes(",")) {
      for (const part of chunk.split(",").map((token) => token.trim())) {
        if (!part) continue;
        const hit = resolve(part);
        if (hit === undefined) unmatched.push(part);
        else matched.push(hit);
      }
      continue;
    }
    unmatched.push(chunk);
  }

  return { matched: Array.from(new Set(matched)), unmatched };
}

export interface ParsedEquipmentRow {
  /** Spreadsheet row number, so problems point at the right line. */
  rowNumber: number;
  name: string;
  description: string;
  status: EquipmentStatus;
  rentalGranularity: RentalGranularity;
  ownerId: string | null;
  ownerLabel: string;
  trainerIds: string[];
  trainerLabel: string;
  trainingIds: string[];
  trainingLabel: string;
  userGuideUrl: string | null;
  /** Empty when the row is ready to import. */
  problems: string[];
}

export interface EquipmentImportPreview {
  fileName: string;
  rows: ParsedEquipmentRow[];
  readyCount: number;
  problemCount: number;
}

/** Blank workbook with headers, dropdowns, instructions, and valid values. */
export async function buildEquipmentTemplate(lab: Lab): Promise<Blob> {
  const [{ Workbook }, people, trainers, trainings] = await Promise.all([
    loadExcelJs(),
    getPeople(),
    getTrainers(),
    getAllTrainings(),
  ]);

  const workbook = new Workbook();
  workbook.creator = "Radiant Booking";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(SHEET_NAME, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = COLUMNS.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", wrapText: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E79" },
    };
  });
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: COLUMNS.length },
  };

  const granularityColumn =
    COLUMNS.findIndex((column) => column.key === "rentalGranularity") + 1;
  const statusColumn =
    COLUMNS.findIndex((column) => column.key === "status") + 1;

  for (let row = 2; row <= TEMPLATE_ROWS; row += 1) {
    sheet.getCell(row, granularityColumn).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${GRANULARITY_CHOICES.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Pick from the list",
      error: `Choose one of: ${GRANULARITY_CHOICES.join(", ")}`,
    };
    sheet.getCell(row, statusColumn).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${STATUS_CHOICES.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Pick from the list",
      error: `Choose one of: ${STATUS_CHOICES.join(", ")}`,
    };
  }

  const instructions = workbook.addWorksheet(INSTRUCTIONS_SHEET);
  instructions.columns = [
    { header: "Column", key: "column", width: 34 },
    { header: "What to put in it", key: "help", width: 78 },
  ];
  instructions.getRow(1).font = { bold: true };
  instructions.addRow({
    column: `Fill in one row per item on the "${SHEET_NAME}" sheet.`,
    help: `Everything is imported into ${lab.name}. Leave the header row alone.`,
  });
  instructions.addRow({ column: "", help: "" });
  for (const column of COLUMNS) {
    instructions.addRow({ column: column.header, help: column.help });
  }
  instructions.addRow({ column: "", help: "" });
  instructions.addRow({
    column: "Pictures",
    help:
      "Pictures cannot come from a spreadsheet. Imported items use the " +
      "placeholder image; add photos afterwards with Edit Equipment.",
  });
  instructions.addRow({ column: "", help: "" });
  instructions.addRow({ column: "Example row", help: "" }).font = {
    bold: true,
  };
  for (const column of COLUMNS) {
    if (!column.example) continue;
    instructions.addRow({ column: column.header, help: column.example });
  }
  instructions.getColumn("help").alignment = { wrapText: true };

  const reference = workbook.addWorksheet(REFERENCE_SHEET);
  reference.columns = [
    { header: "Owners", key: "owners", width: 34 },
    { header: "Certified trainers", key: "trainers", width: 34 },
    { header: "Trainings", key: "trainings", width: 44 },
  ];
  reference.getRow(1).font = { bold: true };
  const referenceRows = Math.max(
    people.length,
    trainers.length,
    trainings.length
  );
  for (let index = 0; index < referenceRows; index += 1) {
    reference.addRow({
      owners: people[index]?.name ?? "",
      trainers: trainers[index]?.displayName ?? "",
      trainings: trainings[index]?.name ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: XLSX_MIME });
}

export function templateFileName(lab: Lab): string {
  const slug =
    lab.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "lab";
  return `${slug}-equipment-template.xlsx`;
}

function findSheet(workbook: Workbook): Worksheet {
  const named = workbook.getWorksheet(SHEET_NAME);
  if (named) return named;
  const first = workbook.worksheets[0];
  if (!first) {
    throw new Error("That file does not have any sheets we can read.");
  }
  return first;
}

/** Reads an uploaded workbook and validates every row against the lab. */
export async function parseEquipmentWorkbook(
  file: File,
  labId: string
): Promise<EquipmentImportPreview> {
  const [{ Workbook }, existing, people, trainers, trainings] =
    await Promise.all([
      loadExcelJs(),
      getEquipmentForLab(labId),
      getPeople(),
      getTrainers(),
      getAllTrainings(),
    ]);

  const workbook = new Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error(
      "Could not read that file. Save it as .xlsx and try again."
    );
  }

  const sheet = findSheet(workbook);
  const columnByIndex = new Map<number, ColumnKey>();
  sheet.getRow(1).eachCell((cell, index) => {
    const header = normalize(cellText(cell.value));
    if (!header) return;
    const match = COLUMNS.find((column) =>
      column.aliases.some((alias) => header.includes(alias))
    );
    if (match && !Array.from(columnByIndex.values()).includes(match.key)) {
      columnByIndex.set(index, match.key);
    }
  });

  if (!Array.from(columnByIndex.values()).includes("name")) {
    throw new Error(
      'That sheet has no "Name" column. Download the template and fill that in.'
    );
  }

  const ownerByKey = new Map<string, string>();
  for (const person of people) {
    ownerByKey.set(normalize(person.name), person.id);
    ownerByKey.set(normalize(person.email), person.id);
  }
  const trainerByKey = new Map<string, string>();
  for (const trainer of trainers) {
    trainerByKey.set(normalize(trainer.displayName), trainer.id);
    trainerByKey.set(normalize(trainer.username), trainer.id);
    trainerByKey.set(normalize(trainer.email), trainer.id);
  }
  const trainingByKey = new Map<string, string>();
  for (const training of trainings) {
    trainingByKey.set(normalize(training.name), training.id);
  }
  const trainerNameById = new Map(
    trainers.map((trainer) => [trainer.id, trainer.displayName])
  );
  const trainingNameById = new Map(
    trainings.map((training) => [training.id, training.name])
  );
  const ownerNameById = new Map(people.map((person) => [person.id, person.name]));

  const takenNames = new Set(existing.map((item) => normalize(item.name)));
  const rows: ParsedEquipmentRow[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const values: Record<ColumnKey, string> = {
      name: "",
      description: "",
      rentalGranularity: "",
      status: "",
      owner: "",
      trainers: "",
      trainings: "",
      userGuideUrl: "",
    };
    for (const [index, key] of columnByIndex) {
      values[key] = cellText(row.getCell(index).value);
    }
    if (Object.values(values).every((value) => value === "")) return;

    const problems: string[] = [];

    const name = values.name;
    if (!name) {
      problems.push("Name is required.");
    } else if (takenNames.has(normalize(name))) {
      problems.push(`"${name}" is already in this lab or earlier in the file.`);
    } else {
      takenNames.add(normalize(name));
    }

    let rentalGranularity: RentalGranularity = "daily";
    if (values.rentalGranularity) {
      const match = GRANULARITY_BY_TEXT[normalize(values.rentalGranularity)];
      if (match) rentalGranularity = match;
      else {
        problems.push(
          `Rental granularity "${values.rentalGranularity}" is not one of: ` +
            `${GRANULARITY_CHOICES.join(", ")}.`
        );
      }
    }

    let status: EquipmentStatus = "available";
    if (values.status) {
      const match = STATUS_BY_TEXT[normalize(values.status)];
      if (match) status = match;
      else {
        problems.push(
          `Status "${values.status}" is not one of: ` +
            `${STATUS_CHOICES.join(", ")}.`
        );
      }
    }

    let ownerId: string | null = null;
    if (values.owner) {
      ownerId = ownerByKey.get(normalize(values.owner)) ?? null;
      if (!ownerId) {
        problems.push(
          `Owner "${values.owner}" is not on the "${REFERENCE_SHEET}" sheet.`
        );
      }
    }

    const trainerResult = resolveList(values.trainers, (token) =>
      trainerByKey.get(normalize(token))
    );
    for (const missing of trainerResult.unmatched) {
      problems.push(`"${missing}" is not a certified trainer.`);
    }

    const trainingResult = resolveList(values.trainings, (token) =>
      trainingByKey.get(normalize(token))
    );
    for (const missing of trainingResult.unmatched) {
      problems.push(`"${missing}" is not a training in the catalog.`);
    }

    rows.push({
      rowNumber,
      name,
      description: values.description,
      status,
      rentalGranularity,
      ownerId,
      ownerLabel: ownerId ? (ownerNameById.get(ownerId) ?? "") : "",
      trainerIds: trainerResult.matched,
      trainerLabel: trainerResult.matched
        .map((id) => trainerNameById.get(id) ?? "")
        .join(", "),
      trainingIds: trainingResult.matched,
      trainingLabel: trainingResult.matched
        .map((id) => trainingNameById.get(id) ?? "")
        .join(", "),
      userGuideUrl: values.userGuideUrl || null,
      problems,
    });
  });

  if (rows.length === 0) {
    throw new Error("That sheet has no filled-in rows yet.");
  }

  return {
    fileName: file.name,
    rows,
    readyCount: rows.filter((row) => row.problems.length === 0).length,
    problemCount: rows.filter((row) => row.problems.length > 0).length,
  };
}

/** Creates the rows that passed validation; rows with problems are skipped. */
export async function importEquipmentRows(
  labId: string,
  rows: ParsedEquipmentRow[],
  actor: User
): Promise<number> {
  const ready = rows.filter((row) => row.problems.length === 0);
  if (ready.length === 0) {
    throw new Error("None of the rows are ready to import.");
  }
  const created = await addEquipmentBatch(
    labId,
    ready.map((row) => ({
      name: row.name,
      description: row.description,
      status: row.status,
      rentalGranularity: row.rentalGranularity,
      trainingIds: row.trainingIds,
      trainerIds: row.trainerIds,
      ownerId: row.ownerId,
      userGuideUrl: row.userGuideUrl,
    })),
    actor
  );
  return created.length;
}
