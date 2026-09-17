"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PreviewPane } from "./PreviewPane";

const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const SHEET_MS = 480;
const DISMISS_PX = 96;
const DISMISS_VELOCITY = 0.65;

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MobilePreviewSheet({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; startY: number; y: number; t: number; vy: number } | null>(null);
  const closedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setOpen(true);
      });
    });
    panelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // The template list also listens for Escape; don't dismiss the sheet
      // out from under an open picker.
      if (document.querySelector('[role="listbox"][aria-label="Templates"]')) return;
      requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
    // requestClose is stable for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishClose() {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  }

  function requestClose() {
    if (closedRef.current) return;
    setDragging(false);
    setDragY(0);
    setOpen(false);
    closeTimerRef.current = window.setTimeout(finishClose, SHEET_MS);
  }

  function onSheetTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.target !== panelRef.current) return;
    if (event.propertyName !== "transform") return;
    if (!open) finishClose();
  }

  function onHandlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const now = performance.now();
    dragRef.current = { id: event.pointerId, startY: event.clientY, y: event.clientY, t: now, vy: 0 };
    setDragging(true);
  }

  function onHandlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const now = performance.now();
    const y = event.clientY;
    const dy = Math.max(0, y - drag.startY);
    const dt = now - drag.t;
    if (dt > 0) drag.vy = (y - drag.y) / dt;
    drag.y = y;
    drag.t = now;
    setDragY(dy);
  }

  function onHandlePointerUp(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    const shouldDismiss = dragY > DISMISS_PX || drag.vy > DISMISS_VELOCITY;
    setDragging(false);
    if (shouldDismiss) requestClose();
    else setDragY(0);
  }

  return (
    <div
      className={`no-print fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out md:hidden ${
        open ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={requestClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        style={{
          transform: `translate3d(0, ${open ? `${dragY}px` : "100%"}, 0)`,
          transition: dragging ? "none" : `transform ${SHEET_MS}ms ${SHEET_EASE}`,
        }}
        onTransitionEnd={onSheetTransitionEnd}
        onClick={(event) => event.stopPropagation()}
        className="flex h-[90dvh] max-h-[90dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-3xl border border-b-0 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-12px_48px_color-mix(in_srgb,var(--color-ink)_18%,transparent)] outline-none will-change-transform"
      >
        <div
          className="flex shrink-0 touch-none cursor-grab flex-col active:cursor-grabbing"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
            <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
          </div>
          <div className="flex items-start justify-between gap-3 px-4 pt-1 pb-3">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">
                Resume preview
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
                Tap a dashed line to start a block on the next page. Close to keep editing this section.
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close preview"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--color-ink-faint)] transition duration-150 hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden bg-[color-mix(in_srgb,var(--color-ink)_3.5%,var(--color-paper))] px-3 pt-1">
          <PreviewPane showAd={false} />
        </div>

        <div className="shrink-0 border-t border-[var(--color-border)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="primary" className="min-h-11 w-full" onClick={requestClose}>
            Continue editing
          </Button>
        </div>
      </div>
    </div>
  );
}
