/**
 * Spreadsheet import for one lab: download a template, drop in a filled .xlsx,
 * preview rows (green = ready, red = problems), then import the good ones.
 */
import { useRef, useState, type DragEvent } from "react";
import { useAuth } from "../context/AuthContext";
import {
  buildEquipmentTemplate,
  importEquipmentRows,
  parseEquipmentWorkbook,
  templateFileName,
  type EquipmentImportPreview,
} from "../../business/equipmentImport";
import type { Lab } from "../../shared/types";
import { downloadBlob } from "../../shared/utils/download";
import { RENTAL_GRANULARITY_LABELS } from "../../shared/utils/rental";

interface ImportEquipmentModalProps {
  lab: Lab;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportEquipmentModal({
  lab,
  onClose,
  onImported,
}: ImportEquipmentModalProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<EquipmentImportPreview | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleDownloadTemplate() {
    setBusy(true);
    setError("");
    try {
      const blob = await buildEquipmentTemplate(lab);
      downloadBlob(blob, templateFileName(lab));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not build the template."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    setImportedCount(null);
    try {
      setPreview(await parseEquipmentWorkbook(file, lab.id));
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  async function handleImport() {
    if (!user || !preview) return;
    setBusy(true);
    setError("");
    try {
      const count = await importEquipmentRows(lab.id, preview.rows, user);
      setImportedCount(count);
      setPreview(null);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-xwide" onClick={(e) => e.stopPropagation()}>
        <h3>Import equipment from Excel</h3>
        <p className="muted">
          Add many items to {lab.name} at once. Pictures cannot come from a
          spreadsheet, so imported items use the placeholder image until you
          add a photo.
        </p>

        <section className="import-step">
          <h4>1. Download the blank template</h4>
          <p className="muted">
            One row per item. The Instructions sheet explains every column and
            the Valid values sheet lists the owners, trainers, and trainings
            you can reference.
          </p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleDownloadTemplate}
            disabled={busy}
          >
            Download template
          </button>
        </section>

        <section className="import-step">
          <h4>2. Upload the filled-in file</h4>
          <div
            className={
              dragging ? "file-dropzone file-dropzone-active" : "file-dropzone"
            }
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={handleDrop}
          >
            <p className="muted">
              Drag your .xlsx file here, or choose it from your device.
            </p>
            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              Choose file
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="image-upload-input"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </div>
        </section>

        {busy && !preview && <p className="muted">Working...</p>}
        {error && <p className="form-error">{error}</p>}

        {importedCount !== null && (
          <p className="import-success">
            Imported {importedCount}{" "}
            {importedCount === 1 ? "item" : "items"} into {lab.name}.
          </p>
        )}

        {preview && (
          <section className="import-step">
            <h4>3. Check the rows</h4>
            <p className="muted">
              {preview.fileName}: {preview.readyCount} ready to import
              {preview.problemCount > 0
                ? `, ${preview.problemCount} need fixing (they will be skipped).`
                : "."}
            </p>
            <div className="import-preview">
              <table className="import-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Booking</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Trainings</th>
                    <th>Trainers</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={
                        row.problems.length > 0 ? "import-row-problem" : ""
                      }
                    >
                      <td>{row.rowNumber}</td>
                      <td>
                        {row.name || <span className="muted">(blank)</span>}
                        {row.problems.length > 0 && (
                          <ul className="import-problems">
                            {row.problems.map((problem) => (
                              <li key={problem}>{problem}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>
                        {RENTAL_GRANULARITY_LABELS[row.rentalGranularity]}
                      </td>
                      <td>
                        {row.status === "maintenance"
                          ? "Under maintenance"
                          : "Available"}
                      </td>
                      <td>{row.ownerLabel || "-"}</td>
                      <td>{row.trainingLabel || "-"}</td>
                      <td>{row.trainerLabel || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {importedCount === null ? "Cancel" : "Close"}
          </button>
          {preview && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImport}
              disabled={busy || preview.readyCount === 0}
            >
              {busy
                ? "Importing..."
                : `Import ${preview.readyCount} ${
                    preview.readyCount === 1 ? "item" : "items"
                  }`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
