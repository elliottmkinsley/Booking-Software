/**
 * Placeholder images and upload helpers for lab / equipment / software photos.
 *
 * Paths go through Vite's BASE_URL so they still work on GitHub Pages
 * (`/Booking-Software/…`) instead of breaking as `/file.svg`.
 */
import type { Equipment, Lab } from "../types";

const base = import.meta.env.BASE_URL;

export const LAB_PLACEHOLDER = `${base}lab-placeholder.svg`;
export const EQUIPMENT_PLACEHOLDER = `${base}equipment-placeholder.svg`;
export const SOFTWARE_PLACEHOLDER = `${base}software-placeholder.svg`;

/** Shown under every image picker so uploads match card framing. */
export const IMAGE_UPLOAD_HINT =
  "Best results: 16:10 landscape (e.g. 1280×800 or 960×600). JPG, PNG, or WebP under 2 MB. Cards crop with cover — keep the subject centered; edges may clip.";

export const IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

/** Resolve a mock asset path against the Vite base URL. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  return `${base}${url.replace(/^\//, "")}`;
}

export function labImage(lab: Lab): string {
  return resolveImageUrl(lab.imageUrl) ?? LAB_PLACEHOLDER;
}

export function equipmentImage(item: Equipment): string {
  const resolved = resolveImageUrl(item.imageUrl);
  if (resolved) return resolved;
  return item.category === "software"
    ? SOFTWARE_PLACEHOLDER
    : EQUIPMENT_PLACEHOLDER;
}

/** Read a local image file as a data URL for the mock store. */
export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file (JPG, PNG, or WebP)."));
      return;
    }
    if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
      reject(new Error("Image must be under 2 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read that image."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}
