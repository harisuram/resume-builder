import { useSyncExternalStore } from "react";

/** Open/closed state for the mobile sections menu, kept outside
 * BuilderShell so toggling it re-renders only the ☰ button and the menu —
 * not the whole builder (form, preview) in the frame the slide starts. */
let open = false;
const listeners = new Set<() => void>();

export function setMobileMenuOpen(next: boolean): void {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMobileMenuOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}
