import { create } from "zustand";

export type ToastTone = "error" | "success";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const DISMISS_MS = 5000;
/** Confirmations are glanceable — they clear sooner than errors. */
const SUCCESS_DISMISS_MS = 2500;

let nextId = 1;

interface ToastState {
  toasts: Toast[];
  timers: Record<number, number>;
  show: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  timers: {},
  show: (message, tone = "error") => {
    // Only one confirmation at a time: a new one (e.g. the next of several
    // reorders) replaces the one on screen instead of stacking under it.
    if (tone === "success") {
      for (const t of get().toasts) if (t.tone === "success") get().dismiss(t.id);
    }
    const id = nextId++;
    const timeout = window.setTimeout(() => get().dismiss(id), tone === "success" ? SUCCESS_DISMISS_MS : DISMISS_MS);
    const { toasts, timers } = get();
    set({
      toasts: [...toasts, { id, message, tone }],
      timers: { ...timers, [id]: timeout },
    });
  },
  dismiss: (id) => {
    const { toasts, timers } = get();
    window.clearTimeout(timers[id]);
    const nextTimers = { ...timers };
    delete nextTimers[id];
    set({ toasts: toasts.filter((t) => t.id !== id), timers: nextTimers });
  },
  clear: () => {
    const { timers } = get();
    for (const timeout of Object.values(timers)) window.clearTimeout(timeout);
    set({ toasts: [], timers: {} });
  },
}));

/** Fire-and-forget helper so call sites don't have to subscribe. */
export function showToast(message: string, tone: ToastTone = "error") {
  useToastStore.getState().show(message, tone);
}

export const TOAST_DISMISS_MS = DISMISS_MS;
