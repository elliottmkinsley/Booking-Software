/** Saves a generated file to the user's downloads folder. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a tick to start the download before releasing the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
