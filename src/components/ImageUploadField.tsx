import { useRef, useState, type DragEvent } from "react";
import {
  IMAGE_UPLOAD_HINT,
  readImageFileAsDataUrl,
  resolveImageUrl,
} from "../utils/images";

interface ImageUploadFieldProps {
  label?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Optional override; defaults to the shared card-spec hint. */
  hint?: string;
}

export default function ImageUploadField({
  label = "Picture",
  value,
  onChange,
  hint = IMAGE_UPLOAD_HINT,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const preview = resolveImageUrl(value);

  async function applyFile(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that image.");
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    void applyFile(file);
  }

  return (
    <div className="field image-upload-field">
      <span>{label}</span>
      <div
        className={
          dragging
            ? "image-upload-dropzone image-upload-dropzone-active"
            : "image-upload-dropzone"
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
        {preview ? (
          <img
            className="image-upload-preview"
            src={preview}
            alt="Selected preview"
          />
        ) : (
          <p className="muted image-upload-empty">
            Drag and drop a picture here, or choose a file
          </p>
        )}
        <div className="inline-actions">
          <button
            type="button"
            className="btn btn-outline btn-small"
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </button>
          {value && (
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => {
                onChange(null);
                setError("");
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Remove picture
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="image-upload-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            void applyFile(file);
          }}
        />
      </div>
      <small className="field-hint">{hint}</small>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
