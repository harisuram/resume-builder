import { useBuilderStore } from "./store";
import { saveResumeData } from "./storage";
import { showToast } from "./toast";

const DEFAULT_ERROR = "Couldn't save this resume on this device. Storage may be full.";

/** Writes the current draft to this browser. Save & Next, Skip, import, and PDF
 * download all go through here so a later visit can pick up where they left. */
export function persistCurrentResume(errorMessage = DEFAULT_ERROR): boolean {
  try {
    saveResumeData(useBuilderStore.getState().getResumeData());
    useBuilderStore.getState().setHasSavedCopy(true);
    return true;
  } catch {
    showToast(errorMessage);
    return false;
  }
}
