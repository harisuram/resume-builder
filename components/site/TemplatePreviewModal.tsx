"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { layoutLabel, type TemplateTheme } from "@/components/templates/shared/theme";
import { ctaPrimary } from "@/components/ui/cta";
import { TemplateSkeleton } from "./TemplateSkeleton";

/** Layout width the skeleton is drawn at before it is scaled down to the
 * modal body. Narrow phones otherwise squash the sidebar until headings
 * like EDUCATION clip. */
const PAPER_WIDTH = 520;
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

function ScaledSkeleton({ theme }: { theme: TemplateTheme }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const page = pageRef.current;
    if (!viewport || !page) return;

    function measure() {
      const width = viewport!.clientWidth;
      const nextScale = width > 0 ? Math.min(1, width / PAPER_WIDTH) : 1;
      const nextHeight = page!.offsetHeight * nextScale;
      setScale((prev) => (prev === nextScale ? prev : nextScale));
      setHeight((prev) => (Math.abs(prev - nextHeight) < 0.5 ? prev : nextHeight));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(page);
    return () => observer.disconnect();
  }, [theme.id]);

  const scaled = scale < 0.999;

  return (
    <div ref={viewportRef} className="w-full">
      <div className="relative overflow-hidden" style={height > 0 && scaled ? { height } : undefined}>
        <div
          ref={pageRef}
          className="origin-top-left"
          style={scaled ? { width: PAPER_WIDTH, transform: `scale(${scale})` } : { width: "100%" }}
        >
          <TemplateSkeleton theme={theme} />
        </div>
      </div>
    </div>
  );
}

function matchesNarrowSheet() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(max-width: 639px)").matches;
}

function useNarrowSheet() {
  const [narrow, setNarrow] = useState(matchesNarrowSheet);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return narrow;
}

export function TemplatePreviewModal({ theme, onClose }: { theme: TemplateTheme; onClose: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; startY: number; y: number; t: number; vy: number } | null>(null);
  const closedRef = useRef(false);
  const narrow = useNarrowSheet();
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
      if (event.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
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
    window.setTimeout(finishClose, SHEET_MS);
  }

  function onSheetTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.target !== panelRef.current) return;
    if (event.propertyName !== "transform") return;
    if (!open) finishClose();
  }

  function onHandlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!narrow || event.button !== 0) return;
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

  const sheetStyle = narrow
    ? {
        transform: `translate3d(0, ${open ? `${dragY}px` : "100%"}, 0)`,
        transition: dragging ? "none" : `transform ${SHEET_MS}ms ${SHEET_EASE}`,
      }
    : undefined;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
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
        style={sheetStyle}
        onTransitionEnd={onSheetTransitionEnd}
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-b-0 border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-12px_48px_color-mix(in_srgb,var(--color-ink)_18%,transparent)] outline-none will-change-transform sm:max-h-[min(90vh,900px)] sm:rounded-2xl sm:border-b sm:shadow-card ${
          narrow
            ? ""
            : `origin-center transition duration-300 ease-out ${open ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"}`
        }`}
      >
        <div
          className="flex shrink-0 touch-none cursor-grab flex-col active:cursor-grabbing sm:cursor-auto sm:touch-auto"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <div className="flex justify-center pt-2.5 pb-1 sm:hidden" aria-hidden="true">
            <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
          </div>
          <div className="flex items-start justify-between gap-3 px-4 pt-1 pb-3 sm:px-5 sm:pt-4 sm:pb-4 sm:border-b sm:border-[var(--color-border)]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id={titleId} className="font-display text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">
                  {theme.name}
                </h2>
                <span className="rounded-full bg-[var(--color-accent-tint)] px-2 py-0.5 text-[10.5px] font-medium tracking-wide text-[var(--color-accent)]">
                  {layoutLabel(theme.layout)}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{theme.description}</p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close preview"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--color-ink-faint)] transition duration-150 hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:h-8 sm:w-8"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-[var(--color-paper)]">
          <div className="w-full px-3 py-3 sm:px-6 sm:py-5">
            <ScaledSkeleton theme={theme} />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--color-border)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pt-4 sm:pb-4">
          <button
            type="button"
            onClick={requestClose}
            className="hidden rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--color-ink-soft)] transition duration-150 hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:inline-flex"
          >
            Close
          </button>
          <Link href={`/builder?template=${encodeURIComponent(theme.id)}`} className={`${ctaPrimary.sm} min-h-11 w-full sm:min-h-0 sm:w-auto`}>
            Use this template
          </Link>
        </div>
      </div>
    </div>
  );
}
