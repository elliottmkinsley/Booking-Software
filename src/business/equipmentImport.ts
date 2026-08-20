/**
 * Import equipment from a spreadsheet: parse/build live in data/excel;
 * creating the rows goes through labs.addEquipmentBatch.
 */
import {
  buildEquipmentTemplate,
  parseEquipmentWorkbook,
  templateFileName,
  type EquipmentImportPreview,
  type ParsedEquipmentRow,
} from "../data/excel/equipmentImport";
import type { User } from "../shared/types";
import { addEquipmentBatch } from "./labs";

export {
  buildEquipmentTemplate,
  parseEquipmentWorkbook,
  templateFileName,
};
export type { EquipmentImportPreview, ParsedEquipmentRow };

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
