"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { getSectionMeta, resolveSectionOrder, SUMMARY_COPY } from "@/lib/persona";
import { isBasicInfoComplete, useBuilderStore } from "@/lib/store";
import type { SectionKey, SectionStatus } from "@/lib/types";
import { Switch } from "@/components/ui/Switch";
import { showToast } from "@/lib/toast";
import { FilledDownloadIcon } from "./AnimatedIcons";
import { dropIndexFromY, type NavKey } from "./nav";
import { NavSectionIcon } from "./NavSectionIcon";

const DRAG_THRESHOLD_PX = 4;
const DRAG_SETTLE_MS = 220;
const DRAG_SHIFT_EASE = "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)";
const DRAG_SETTLE_EASE = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease";

const DOT_COLOR: Record<SectionStatus, string> = {
  complete: "var(--color-focus)",
  skipped: "var(--color-ink-faint)",
  not_started: "transparent",
};

interface DragSession {
  key: SectionKey;
  startY: number;
  pointerY: number;
  fromIndex: number;
  toIndex: number;
  origin: SectionKey[];
  rects: { top: number; height: number }[];
  active: boolean;
}

/** Runs a reorder and confirms it with a toast naming the section and its
 * new neighbor — only when the order really changed (a drop back in place,
 * or a nudge past the end, says nothing). */
function reorderWithToast(key: SectionKey, apply: () => void) {
  const before = useBuilderStore.getState().sectionOrder;
  apply();
  const after = useBuilderStore.getState().sectionOrder;
  if (after === before) return;
  const order = resolveSectionOrder(after);
  const index = order.indexOf(key);
  const label = getSectionMeta(key).label;
  showToast(
    index > 0 ? `${label} moved below ${getSectionMeta(order[index - 1]).label}` : `${label} moved to the top`,
    "success",
  );
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clearRowDragStyles(el: HTMLElement) {
  el.style.transform = "";
  el.style.transition = "";
  el.style.zIndex = "";
  el.style.willChange = "";
  el.style.pointerEvents = "";
  delete el.dataset.shift;
}

/** Separator between two rows. The mobile strip lays the rows out left to
 * right in the same order the wizard walks them, so every gap gets a short
 * connector line and the whole thing reads as one step-to-step run. Stacked
 * from md up that would just be clutter, so only the two group boundaries
 * survive there, as the full-width rules they've always been. */
function RowDivider({ group = false, drawer = false }: { group?: boolean; drawer?: boolean }) {
  if (drawer && !group) return null;
  return (
    <div
      className={
        drawer
          ? "my-1 h-px w-full shrink-0 bg-[var(--color-border)]"
          : `my-auto h-px w-2.5 shrink-0 bg-[var(--color-border)] ${group ? "md:my-1 md:w-full" : "md:hidden"}`
      }
      aria-hidden="true"
    />
  );
}

/** `drawer` renders the stacked desktop list (switches, status dots,
 * reorder handles) at every width — the mobile side menu uses it so phones
 * get the same controls as the desktop sidebar. `collapsed` is the desktop
 * sidebar's icon-only rail: labels fade out and the row controls go. */
export function SectionNav({
  active,
  onSelect,
  variant = "responsive",
  collapsed = false,
}: {
  active: NavKey;
  onSelect: (key: NavKey) => void;
  variant?: "responsive" | "drawer";
  collapsed?: boolean;
}) {
  const drawer = variant === "drawer";
  const rail = collapsed && !drawer;
  /** Display class for a control the mobile strip hides until md. */
  const shown = (display: "flex" | "inline") =>
    display === "flex" ? (drawer ? "flex" : "hidden md:flex") : drawer ? "inline" : "hidden md:inline";
  const basicInfo = useBuilderStore((s) => s.basicInfo);
  const photo = useBuilderStore((s) => s.photo);
  const sectionStatus = useBuilderStore((s) => s.sectionStatus);
  const toggleSkipSection = useBuilderStore((s) => s.toggleSkipSection);
  const sectionOrder = useBuilderStore((s) => s.sectionOrder);
  const moveSection = useBuilderStore((s) => s.moveSection);

  // Summary is fixed first — it renders first in every template regardless
  // of section order, so moving it wouldn't do anything (see
  // getNavSectionOrder). Everything else defaults to SECTION_ORDER until
  // the user moves something, via resolveSectionOrder.
  const committedKeys = resolveSectionOrder(sectionOrder);
  const rowRefs = useRef(new Map<SectionKey, HTMLElement>());
  const sessionRef = useRef<DragSession | null>(null);
  const settleTimer = useRef<number>(0);
  const dropPulseTimer = useRef<number>(0);
  const [draggingKey, setDraggingKey] = useState<SectionKey | null>(null);
  const [droppedKey, setDroppedKey] = useState<SectionKey | null>(null);
  const contentKeys = committedKeys;
  const basicInfoDone = isBasicInfoComplete(basicInfo);
  const summaryLabel = SUMMARY_COPY.label;
  const summaryStatus = sectionStatus.summary ?? "not_started";
  const photoStatus: SectionStatus =
    sectionStatus.photo === "skipped" ? "skipped" : photo ? "complete" : "not_started";

  useEffect(() => {
    function applyDragTransforms(session: DragSession) {
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

    function finishDrag(session: DragSession, commit: boolean) {
      const settleMs = prefersReducedMotion() ? 0 : DRAG_SETTLE_MS;
      const targetOffset = session.rects[session.toIndex].top - session.rects[session.fromIndex].top;
      const dragged = rowRefs.current.get(session.key);
      if (dragged && commit) {
        dragged.style.transition = DRAG_SETTLE_EASE;
        dragged.style.transform = `translate3d(0, ${targetOffset}px, 0) scale(1)`;
      } else if (dragged) {
        dragged.style.transition = DRAG_SETTLE_EASE;
        dragged.style.transform = "translate3d(0, 0, 0) scale(1)";
      }
      const key = session.key;
      const toIndex = session.toIndex;
      const fromIndex = session.fromIndex;
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => {
        settleTimer.current = 0;
        if (commit && toIndex !== fromIndex) {
          reorderWithToast(key, () => useBuilderStore.getState().reorderSection(key, toIndex));
        }
        clearAllRowStyles();
        setDraggingKey(null);
        if (commit && toIndex !== fromIndex) {
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

  function startDrag(key: SectionKey, event: React.PointerEvent<HTMLButtonElement>) {
    if (typeof event.button === "number" && event.button !== 0) return;
    if (sessionRef.current || settleTimer.current) return;
    if (sectionStatus[key] === "skipped") return;
    const fromIndex = contentKeys.indexOf(key);
    if (fromIndex === -1) return;
    event.stopPropagation();
    const rects = contentKeys.map((rowKey) => {
      const rect = rowRefs.current.get(rowKey)?.getBoundingClientRect();
      return { top: rect?.top ?? 0, height: rect?.height ?? 0 };
    });
    sessionRef.current = {
      key,
      startY: event.clientY,
      pointerY: event.clientY,
      fromIndex,
      toIndex: fromIndex,
      origin: contentKeys,
      rects,
      active: false,
    };
  }

  return (
    <>
      <nav
        className={
          drawer
            ? "flex flex-col gap-1 p-3"
            : `flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-x-visible ${rail ? "md:px-2" : ""}`
        }
        aria-label="Resume sections"
      >
        <NavRow
          navKey="basicInfo"
          iconDelay={0}
          label="Basic info"
          active={active === "basicInfo"}
          drawer={drawer}
          rail={rail}
          onClick={() => onSelect("basicInfo")}
          trailing={
            <span className={`${shown("inline")} text-[10.5px] font-medium tracking-wide text-[var(--color-ink-faint)]`}>
              {basicInfoDone ? "Complete" : "Required"}
            </span>
          }
        />

        <RowDivider group drawer={drawer} />

        <NavRow
          navKey="summary"
          iconDelay={40}
          label={summaryLabel}
          active={active === "summary"}
          drawer={drawer}
          rail={rail}
          skipped={summaryStatus === "skipped"}
          onClick={() => onSelect("summary")}
          trailing={
            <div className={`${shown("flex")} shrink-0 items-center gap-2`} data-tour={drawer ? undefined : "skip-switch"}>
              <StatusMark status={summaryStatus} drawer={drawer} />
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={summaryStatus !== "skipped"}
                  onChange={() => toggleSkipSection("summary")}
                  label={summaryStatus === "skipped" ? `Include ${summaryLabel}` : `Skip ${summaryLabel}`}
                />
              </div>
            </div>
          }
        />

        <RowDivider drawer={drawer} />

        <NavRow
          navKey="photo"
          iconDelay={80}
          label="Photo"
          active={active === "photo"}
          drawer={drawer}
          rail={rail}
          skipped={photoStatus === "skipped"}
          onClick={() => onSelect("photo")}
          trailing={
            <div className={`${shown("flex")} shrink-0 items-center gap-2`}>
              <StatusMark status={photoStatus} drawer={drawer} />
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={photoStatus !== "skipped"}
                  onChange={() => toggleSkipSection("photo")}
                  label={photoStatus === "skipped" ? "Include Photo" : "Skip Photo"}
                />
              </div>
            </div>
          }
        />

        {contentKeys.map((key: SectionKey, index) => {
          const label = getSectionMeta(key).label;
          const status = sectionStatus[key] ?? "not_started";
          const skipped = status === "skipped";
          return (
            <Fragment key={key}>
              <RowDivider drawer={drawer} />
              <NavRow
                navKey={key}
                iconDelay={120 + index * 40}
                label={label}
                active={active === key}
                drawer={drawer}
                rail={rail}
                skipped={skipped}
                dragging={draggingKey === key}
                dropped={droppedKey === key}
                sectionKey={key}
                onClick={() => onSelect(key)}
                rowRef={(node) => {
                  if (node) rowRefs.current.set(key, node);
                  else rowRefs.current.delete(key);
                }}
                trailing={
                  <div className={`${shown("flex")} shrink-0 items-center gap-1.5`}>
                    <ReorderHandle
                      label={label}
                      skipped={skipped}
                      dragging={draggingKey === key}
                      tourAnchor={!drawer && index === 1}
                      drawer={drawer}
                      onPointerDown={(event) => startDrag(key, event)}
                      onMoveUp={() => reorderWithToast(key, () => moveSection(key, "up"))}
                      onMoveDown={() => reorderWithToast(key, () => moveSection(key, "down"))}
                    />
                    <StatusMark status={status} drawer={drawer} />
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={status !== "skipped"}
                        onChange={() => toggleSkipSection(key)}
                        label={status === "skipped" ? `Include ${label}` : `Skip ${label}`}
                      />
                    </div>
                  </div>
                }
              />
            </Fragment>
          );
        })}

        <RowDivider group drawer={drawer} />

        {/* The finish line, not another section: an accent call to action
            pinned to the bottom of the scrolling sidebar so "you can
            download" is visible from the first step. */}
        <div
          className={
            drawer
              ? "pt-1"
              : `md:sticky md:bottom-0 md:z-[9] md:-mb-3 md:mt-1 md:bg-[var(--color-surface)] md:pb-3 md:pt-2 ${
                  rail ? "md:-mx-2 md:px-2" : "md:-mx-3 md:px-3"
                }`
          }
        >
          <NavRow
            navKey="export"
            label="Download"
            active={active === "export"}
            drawer={drawer}
            rail={rail}
            cta
            onClick={() => onSelect("export")}
          />
        </div>
      </nav>

    </>
  );
}

/** Status dot; in the mobile side menu a finished section gets a green
 * tick instead, which reads at a glance on a small screen. */
function StatusMark({ status, drawer }: { status: SectionStatus; drawer: boolean }) {
  if (drawer && status === "complete") {
    return (
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)] text-[var(--color-surface)]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 6.2 2 2 4-4.4" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-150"
      style={{ background: DOT_COLOR[status] }}
      aria-hidden="true"
    />
  );
}

/** Drag handle for content-section order — desktop only (`hidden md:flex`):
 * on the mobile horizontal-scroll strip, vertical drag doesn't map and
 * there's no room for it. Skipped sections stay in the list as drop
 * targets but cannot be picked up. Arrow keys on the handle still nudge
 * one slot for keyboard use. */
function ReorderHandle({
  label,
  skipped,
  dragging,
  tourAnchor,
  drawer = false,
  onPointerDown,
  onMoveUp,
  onMoveDown,
}: {
  label: string;
  skipped: boolean;
  dragging: boolean;
  tourAnchor: boolean;
  drawer?: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      data-tour={tourAnchor ? "section-sort" : undefined}
      className={drawer ? "flex shrink-0" : "hidden shrink-0 md:flex"}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={skipped}
        aria-label={skipped ? `${label} is skipped and cannot be reordered` : `Reorder ${label}`}
        aria-disabled={skipped}
        onPointerDown={onPointerDown}
        onKeyDown={(event) => {
          if (skipped) return;
          if (event.key === "ArrowUp") {
            event.preventDefault();
            onMoveUp();
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            onMoveDown();
          }
        }}
        className={`touch-none rounded-sm text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-25 ${
          dragging ? "cursor-grabbing text-[var(--color-accent)]" : "cursor-grab"
        }`}
      >
        <GripIcon />
      </button>
    </div>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <circle cx="5.5" cy="3.5" r="1.15" />
      <circle cx="10.5" cy="3.5" r="1.15" />
      <circle cx="5.5" cy="8" r="1.15" />
      <circle cx="10.5" cy="8" r="1.15" />
      <circle cx="5.5" cy="12.5" r="1.15" />
      <circle cx="10.5" cy="12.5" r="1.15" />
    </svg>
  );
}

function NavRow({
  navKey,
  iconDelay = 0,
  label,
  active,
  drawer = false,
  rail = false,
  cta = false,
  skipped = false,
  dragging = false,
  dropped = false,
  sectionKey,
  onClick,
  trailing,
  rowRef,
}: {
  navKey: NavKey;
  iconDelay?: number;
  label: string;
  active: boolean;
  drawer?: boolean;
  /** Collapsed desktop sidebar: icon only, label kept as the accessible name. */
  rail?: boolean;
  /** Accent call-to-action styling (Download). */
  cta?: boolean;
  skipped?: boolean;
  dragging?: boolean;
  dropped?: boolean;
  sectionKey?: SectionKey;
  onClick: () => void;
  trailing?: React.ReactNode;
  rowRef?: (node: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={rowRef}
      data-section-key={sectionKey}
      aria-grabbed={dragging || undefined}
      className={`group/navrow flex shrink-0 items-center justify-between gap-2 rounded-lg ${cta ? "" : "pr-2"} ${rail ? "md:pr-0" : ""} text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200 ease-out ${drawer ? "w-full" : "md:w-full"} ${
        cta
          ? `bg-[linear-gradient(135deg,var(--color-accent),color-mix(in_srgb,var(--color-accent)_70%,var(--color-focus)))] font-semibold text-[var(--color-accent-ink)] shadow-[0_8px_20px_-10px_var(--accent-glow)] hover:brightness-110 ${
              active ? "ring-2 ring-[var(--color-focus)] ring-offset-2 ring-offset-[var(--color-surface)]" : ""
            }`
          : dragging
          ? "nav-row-lift"
          : dropped
            ? `nav-row-dropped ${active ? "bg-[var(--color-accent-tint)] text-[var(--color-accent)]" : "text-[var(--color-ink-soft)]"}`
            : active
              ? "bg-[var(--color-accent-tint)] text-[var(--color-accent)]"
              : "text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-tint)]/60 hover:text-[var(--color-ink)]"
      }`}
    >
      {/* A plain div wraps this rather than the row itself being a <button>
          — the row's trailing content (the skip Switch) is its own
          interactive button, and a <button> can't contain another
          <button> without breaking HTML validity and event handling. */}
      <button
        type="button"
        onClick={onClick}
        aria-label={rail ? label : undefined}
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left ${cta ? "justify-center" : ""} ${
          rail ? "md:justify-center md:gap-0 md:px-0" : ""
        }`}
      >
        {/* The Download item is text-only while the sidebar is open; the
            collapsed rail has no label, so it keeps the icon there. */}
        {cta ? (
          rail ? (
            <span
              data-nav-icon={navKey}
              data-active={active ? "true" : undefined}
              className="-my-1 flex shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <FilledDownloadIcon />
            </span>
          ) : null
        ) : (
          <NavSectionIcon navKey={navKey} active={active || dragging} skipped={skipped} delayMs={iconDelay} />
        )}
        {/* The mobile strip has no room for the status dot, skip Switch, or
            "Optional" badge, so the label's own color is all that's left to
            carry "this won't be on the resume" — it reverts to the row's
            color from md up, where those controls say it instead. */}
        <span
          className={
            drawer
              ? "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
              : `max-w-[7.25rem] overflow-hidden text-ellipsis whitespace-nowrap transition-[opacity,max-width] duration-300 ease-out ${
                  rail ? "md:max-w-0 md:opacity-0" : "md:max-w-none md:overflow-visible"
                } ${skipped ? "text-[var(--color-ink-faint)] md:text-inherit" : ""}`
          }
        >
          {label}
        </span>
      </button>
      {rail ? null : trailing}
    </div>
  );
}
