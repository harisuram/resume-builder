"use client";

import { useEffect, useRef, useState } from "react";
import { dropIndexFromY } from "./nav";

const DRAG_THRESHOLD_PX = 4;
const DRAG_SETTLE_MS = 220;
const DRAG_SHIFT_EASE = "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)";
const DRAG_SETTLE_EASE = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease";

interface DragSession<K extends string> {
  key: K;
  startY: number;
  pointerY: number;
  fromIndex: number;
  toIndex: number;
  origin: K[];
  rects: { top: number; height: number }[];
  active: boolean;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function clearRowDragStyles(el: HTMLElement) {
  el.style.transform = "";
  el.style.transition = "";
  el.style.zIndex = "";
  el.style.willChange = "";
  el.style.pointerEvents = "";
  delete el.dataset.shift;
}

/** Pointer drag-to-reorder for a vertical list of nav rows — the same lift,
 * neighbour shift, settle and drop pulse as the resume's section nav, for any
 * list keyed by strings. Rows register through `rowRef(key)`; the grip calls
 * `startDrag`. `onReorder` runs once the dragged row has settled. Escape
 * cancels a drag in progress. */
export function useRowReorder<K extends string>({
  keys,
  isLocked,
  onReorder,
}: {
  keys: K[];
  /** Rows that can't be picked up (skipped ones). They still take drops. */
  isLocked: (key: K) => boolean;
  onReorder: (key: K, toIndex: number) => void;
}) {
  const rowRefs = useRef(new Map<K, HTMLElement>());
  const sessionRef = useRef<DragSession<K> | null>(null);
  const settleTimer = useRef<number>(0);
  const dropPulseTimer = useRef<number>(0);
  const onReorderRef = useRef(onReorder);
  const [draggingKey, setDraggingKey] = useState<K | null>(null);
  const [droppedKey, setDroppedKey] = useState<K | null>(null);

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  useEffect(() => {
    function applyDragTransforms(session: DragSession<K>) {
      const delta = session.pointerY - session.startY;
      const draggedH = session.rects[session.fromIndex]?.height ?? 40;
      for (let i = 0; i < session.origin.length; i++) {
        const el = rowRefs.current.get(session.origin[i]);
        if (!el) continue;
        if (session.origin[i] === session.key) {
          el.style.transition = "box-shadow 160ms ease";
          el.style.transform = `translate3d(0, ${delta}px, 0) scale(1.03)`;
          el.style.zIndex = "8";
          el.style.willChange = "transform";
          el.style.pointerEvents = "none";
          continue;
        }
        let shift = 0;
        if (session.fromIndex < session.toIndex && i > session.fromIndex && i <= session.toIndex) {
          shift = -draggedH;
        } else if (session.fromIndex > session.toIndex && i >= session.toIndex && i < session.fromIndex) {
          shift = draggedH;
        }
        if (el.dataset.shift === String(shift)) continue;
        el.dataset.shift = String(shift);
        el.style.transition = DRAG_SHIFT_EASE;
        el.style.transform = `translate3d(0, ${shift}px, 0)`;
      }
    }

    function clearAllRowStyles() {
      for (const el of rowRefs.current.values()) clearRowDragStyles(el);
      document.body.classList.remove("nav-section-dragging");
    }

    function finishDrag(session: DragSession<K>, commit: boolean) {
      const settleMs = prefersReducedMotion() ? 0 : DRAG_SETTLE_MS;
      const targetOffset = session.rects[session.toIndex].top - session.rects[session.fromIndex].top;
      const dragged = rowRefs.current.get(session.key);
      if (dragged) {
        dragged.style.transition = DRAG_SETTLE_EASE;
        dragged.style.transform = commit
          ? `translate3d(0, ${targetOffset}px, 0) scale(1)`
          : "translate3d(0, 0, 0) scale(1)";
      }
      const { key, toIndex, fromIndex } = session;
      const moved = commit && toIndex !== fromIndex;
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => {
        settleTimer.current = 0;
        if (moved) onReorderRef.current(key, toIndex);
        clearAllRowStyles();
        setDraggingKey(null);
        if (moved) {
          setDroppedKey(key);
          window.clearTimeout(dropPulseTimer.current);
          dropPulseTimer.current = window.setTimeout(() => setDroppedKey(null), 380);
        }
      }, settleMs);
    }

    function onMove(event: PointerEvent) {
      const session = sessionRef.current;
      if (!session) return;
      session.pointerY = event.clientY;
      if (!session.active) {
        if (Math.abs(event.clientY - session.startY) < DRAG_THRESHOLD_PX) return;
        session.active = true;
        setDraggingKey(session.key);
        document.body.classList.add("nav-section-dragging");
      }
      event.preventDefault();
      session.toIndex = dropIndexFromY(event.clientY, session.rects);
      applyDragTransforms(session);
    }

    function suppressClick(event: Event) {
      event.preventDefault();
      event.stopPropagation();
    }

    function onUp() {
      const session = sessionRef.current;
      if (!session) return;
      sessionRef.current = null;
      if (!session.active) return;
      document.addEventListener("click", suppressClick, true);
      window.setTimeout(() => document.removeEventListener("click", suppressClick, true), 0);
      finishDrag(session, true);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || !sessionRef.current) return;
      event.preventDefault();
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session.active) finishDrag(session, false);
      else {
        clearAllRowStyles();
        setDraggingKey(null);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(settleTimer.current);
      window.clearTimeout(dropPulseTimer.current);
      document.body.classList.remove("nav-section-dragging");
    };
  }, []);

  function startDrag(key: K, event: React.PointerEvent<HTMLElement>) {
    if (typeof event.button === "number" && event.button !== 0) return;
    if (sessionRef.current || settleTimer.current) return;
    if (isLocked(key)) return;
    const fromIndex = keys.indexOf(key);
    if (fromIndex === -1) return;
    event.stopPropagation();
    const rects = keys.map((rowKey) => {
      const rect = rowRefs.current.get(rowKey)?.getBoundingClientRect();
      return { top: rect?.top ?? 0, height: rect?.height ?? 0 };
    });
    sessionRef.current = {
      key,
      startY: event.clientY,
      pointerY: event.clientY,
      fromIndex,
      toIndex: fromIndex,
      origin: keys,
      rects,
      active: false,
    };
  }

  function rowRef(key: K) {
    return (node: HTMLElement | null) => {
      if (node) rowRefs.current.set(key, node);
      else rowRefs.current.delete(key);
    };
  }

  return { draggingKey, droppedKey, startDrag, rowRef };
}
