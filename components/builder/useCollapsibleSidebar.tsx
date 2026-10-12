"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { isBuilderTourViewport } from "@/lib/builderTour";

/** Hover delays for the collapsed sidebar's peek: a short wait before it
 * opens so a cursor passing over doesn't fling it open, and a brief grace
 * before it closes so grazing the edge doesn't snap it shut. */
const PEEK_OPEN_DELAY_MS = 120;
const PEEK_CLOSE_DELAY_MS = 180;

export function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M9.5 4.5v15" />
      <path
        className="transition-transform duration-300 ease-out"
        style={{ transformBox: "fill-box", transformOrigin: "center", transform: collapsed ? "scaleX(-1)" : undefined }}
        d="m15.5 10-2 2 2 2"
      />
    </svg>
  );
}

/** Desktop sidebar that collapses to an icon rail. Open on every visit;
 * collapsing gives the form and the preview the room. While collapsed,
 * hovering it "peeks": it slides open over the page (no layout shift) and
 * shuts when the cursor leaves. Ctrl/Cmd+B toggles it, as in most editors.
 * `forceOpen` holds it open (the builder tour points at sidebar controls). */
export function useCollapsibleSidebar({ forceOpen = false }: { forceOpen?: boolean } = {}) {
  const [collapsed, setCollapsed] = useState(false);
  const [peek, setPeek] = useState(false);
  const peekTimer = useRef(0);
  const layoutCollapsed = collapsed && !forceOpen;
  const peeking = layoutCollapsed && peek;
  const railMode = layoutCollapsed && !peek;

  function toggle() {
    window.clearTimeout(peekTimer.current);
    setPeek(false);
    setCollapsed((current) => !current);
  }

  function schedulePeek(open: boolean, event: PointerEvent) {
    // Mouse only: on a touch tablet a tap would open it with no way to
    // "move out" and close it again.
    if (event.pointerType !== "mouse" || !layoutCollapsed) return;
    window.clearTimeout(peekTimer.current);
    // Mid-drag the rows are measured; don't resize the sidebar under them.
    if (!open && document.body.classList.contains("nav-section-dragging")) return;
    peekTimer.current = window.setTimeout(() => setPeek(open), open ? PEEK_OPEN_DELAY_MS : PEEK_CLOSE_DELAY_MS);
  }

  useEffect(() => () => window.clearTimeout(peekTimer.current), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "b" || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (!isBuilderTourViewport()) return;
      event.preventDefault();
      window.clearTimeout(peekTimer.current);
      setPeek(false);
      setCollapsed((current) => !current);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { layoutCollapsed, peeking, railMode, toggle, schedulePeek };
}
