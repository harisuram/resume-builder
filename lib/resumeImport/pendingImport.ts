/** A resume file chosen on the home page, waiting for the builder to open.
 * The move to /builder is a client-side navigation, so the File object
 * survives in memory; a full page load drops it, and the builder then falls
 * back to asking for the file (`?import=1`). */
let pending: File | null = null;

export function setPendingImport(file: File): void {
  pending = file;
}

/** Hands the waiting file over exactly once. */
export function takePendingImport(): File | null {
  const file = pending;
  pending = null;
  return file;
}
