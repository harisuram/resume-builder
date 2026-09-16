import { create } from "zustand";

export type ToastTone = "error";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const DISMISS_MS = 5000;

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
    const id = nextId++;
    const timeout = window.setTimeout(() => get().dismiss(id), DISMISS_MS);
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
