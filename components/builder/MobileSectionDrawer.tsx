"use client";

import { useEffect, useId, useRef, useState } from "react";
import { setMobileMenuOpen, useMobileMenuOpen } from "./mobileMenuStore";
import type { NavKey } from "./nav";
import { SectionNav } from "./SectionNav";

// iOS-style: a longer decelerating open, a quicker accelerating close.
const OPEN_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const OPEN_MS = 420;
const CLOSE_EASE = "cubic-bezier(0.4, 0, 0.9, 0.6)";
const DRAWER_MS = 260;
const DISMISS_PX = 80;
const DISMISS_VELOCITY = 0.5;

export function MenuIcon({ open = false }: { open?: boolean }) {
  const line = "absolute left-0 h-[1.5px] w-full rounded-full bg-current transition-transform duration-300 ease-out";
  return (
    <span className="relative block h-3 w-4" aria-hidden="true">
      <span className={`${line} top-0 ${open ? "translate-y-[5.25px] rotate-45" : ""}`} />
      <span className={`${line} top-[5.25px] transition-opacity ${open ? "opacity-0" : ""}`} />
      <span className={`${line} bottom-0 ${open ? "-translate-y-[5.25px] -rotate-45" : ""}`} />
    </span>
  );
}

/** The ☰ button. Subscribes to the menu store on its own so the builder
 * around it doesn't re-render when the menu opens. */
export function MobileMenuButton({ className }: { className: string }) {
  const open = useMobileMenuOpen();
  return (
    <button
      type="button"
      onClick={() => setMobileMenuOpen(true)}
      aria-label="Open sections menu"
      aria-haspopup="dialog"
      aria-expanded={open}
      data-mtour="menu"
      className={className}
    >
      <MenuIcon open={open} />
    </button>
  );
}

/** Mounts the drawer when it's open, or ahead of time once `warm`. */
export function MobileSectionMenu({
  warm,
  ...props
}: {
  warm: boolean;
  active: NavKey;
  onSelect: (key: NavKey) => void;
  onReplayTour?: () => void;
}) {
  const open = useMobileMenuOpen();
  if (!open && !warm) return null;
  return <MobileSectionDrawer open={open} onClose={() => setMobileMenuOpen(false)} {...props} />;
}

/** Mobile side menu holding the full section list — the same switches,
 * status dots, and reorder handles as the desktop sidebar. Slides in from
 * the left; closes on backdrop tap, Escape, the close button, a swipe left
 * on the header, or picking a section.
 *
 * It can stay mounted while closed (hidden and inert), so opening only has
 * to start the slide instead of building the whole list on the tap. */
export function MobileSectionDrawer({
  open: requested,
  active,
  onSelect,
  onClose,
  onReplayTour,
}: {
  /** The parent wants the menu open. It flips back via `onClose` once the
   * close animation has finished. */
  open: boolean;
  active: NavKey;
  onSelect: (key: NavKey) => void;
  onClose: () => void;
  /** Close the menu and walk the phone tour again. */
  onReplayTour?: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const swipeRef = useRef<{ id: number; startX: number; x: number; t: number; vx: number } | null>(null);
  // A section picked in the menu is applied once the panel has slid away,
  // so swapping the form doesn't compete with the close animation.
  const pendingSelectRef = useRef<NavKey | null>(null);
  const [open, setOpen] = useState(false);
  const hidden = !requested && !open;
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!requested) return;
    closedRef.current = false;
    pendingSelectRef.current = null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The builder behind is made inert here rather than through React, so
    // opening doesn't re-render it.
    const content = document.querySelector<HTMLElement>("[data-builder-content]");
    const contentWasInert = content?.hasAttribute("inert") ?? false;
    if (content && !contentWasInert) content.setAttribute("inert", "");
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setOpen(true);
      });
    });
    panelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      // Escape mid-reorder cancels the drag (SectionNav) rather than the menu.
      if (document.body.classList.contains("nav-section-dragging")) return;
      requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      if (content && !contentWasInert) content.removeAttribute("inert");
      // Closed from outside (e.g. the viewport grew past md): drop straight
      // to hidden rather than leaving the panel drawn.
      setOpen(false);
      setDragX(0);
      setDragging(false);
    };
    // requestClose only reads refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested]);

  function finishClose() {
    if (closedRef.current) return;
    closedRef.current = true;
    const pending = pendingSelectRef.current;
    onClose();
    if (pending) onSelect(pending);
  }

  function requestClose() {
    if (closedRef.current) return;
    setDragging(false);
    setDragX(0);
    setOpen(false);
    closeTimerRef.current = window.setTimeout(finishClose, DRAWER_MS);
  }

  function onPanelTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.target !== panelRef.current || event.propertyName !== "transform") return;
    if (!open) finishClose();
  }

  function onHeaderPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    swipeRef.current = { id: event.pointerId, startX: event.clientX, x: event.clientX, t: performance.now(), vx: 0 };
    setDragging(true);
  }

  function onHeaderPointerMove(event: React.PointerEvent<HTMLElement>) {
    const swipe = swipeRef.current;
    if (!swipe || swipe.id !== event.pointerId) return;
    const now = performance.now();
    const dt = now - swipe.t;
    if (dt > 0) swipe.vx = (event.clientX - swipe.x) / dt;
    swipe.x = event.clientX;
    swipe.t = now;
    setDragX(Math.min(0, event.clientX - swipe.startX));
  }

  function onHeaderPointerUp(event: React.PointerEvent<HTMLElement>) {
    const swipe = swipeRef.current;
    if (!swipe || swipe.id !== event.pointerId) return;
    swipeRef.current = null;
    const dismiss = dragX < -DISMISS_PX || swipe.vx < -DISMISS_VELOCITY;
    setDragging(false);
    if (dismiss) requestClose();
    else setDragX(0);
  }

  const panelWidth = panelRef.current?.offsetWidth || 320;
  const backdropOpacity = open ? Math.max(0, 1 + dragX / panelWidth) : 0;
  const ease = open ? OPEN_EASE : CLOSE_EASE;
  const ms = open ? OPEN_MS : DRAWER_MS;

  return (
    <div
      className={`no-print fixed inset-0 z-50 md:hidden ${hidden ? "invisible pointer-events-none" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      {/* Backdrop and panel are separate layers so each animates on the
          compositor alone: a plain fade (no backdrop blur, which phones
          re-rasterise every frame) and a transform-only slide. */}
      <div
        className="absolute inset-0 bg-black/45 will-change-[opacity]"
        style={{
          opacity: backdropOpacity,
          transition: dragging ? "none" : `opacity ${ms}ms ${ease}`,
        }}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        style={{
          transform: `translate3d(${open ? `${dragX}px` : "-100%"}, 0, 0)`,
          transition: dragging ? "none" : `transform ${ms}ms ${ease}`,
        }}
        onTransitionEnd={onPanelTransitionEnd}
        className={`absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] min-w-0 flex-col overflow-hidden rounded-r-3xl border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-[12px_0_48px_color-mix(in_srgb,var(--color-ink)_18%,transparent)] outline-none [backface-visibility:hidden] [contain:layout_paint] will-change-transform ${
          open ? "section-drawer-open" : ""
        }`}
      >
        <div
          className="flex shrink-0 touch-pan-y items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3"
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onPointerCancel={onHeaderPointerUp}
        >
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">
              Sections
            </h2>
            <p className="mt-0.5 text-[12px] leading-snug text-[var(--color-ink-soft)]">
              Switch a section off to skip it. Drag the grip to reorder.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close sections menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--color-ink-faint)] transition duration-150 hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <MenuIcon open />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          <SectionNav
            variant="drawer"
            active={active}
            onSelect={(key) => {
              if (key !== active) pendingSelectRef.current = key;
              requestClose();
            }}
          />
          {onReplayTour ? (
            <div className="px-3 pt-1 pb-4">
              <button
                type="button"
                onClick={() => {
                  requestClose();
                  window.setTimeout(onReplayTour, DRAWER_MS);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-[var(--color-border)] py-2.5 text-[12.5px] font-medium text-[var(--color-ink-soft)] transition active:scale-[0.98] active:text-[var(--color-ink)]"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.25" />
                  <path d="M6.4 6.2a1.7 1.7 0 1 1 2.3 1.6c-.5.2-.7.6-.7 1.1v.3" />
                  <path d="M8 11.4h.01" />
                </svg>
                Take the quick tour
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
