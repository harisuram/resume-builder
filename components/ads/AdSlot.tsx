"use client";

import { useEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT_ID } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdFormat = "auto" | "fluid";

/**
 * Renders nothing — not even an empty placeholder — unless there's a real
 * chance an ad can show:
 *  - no AdSense client id configured (e.g. local dev, preview builds): skip entirely
 *    in production; in `next dev`, render a dashed outline instead (below),
 *    so the layout's ad positions are visible before real credentials exist.
 *  - the slot id isn't set: same as above.
 *  - Google itself reports no fill for this request (`data-ad-status="unfilled"`,
 *    set async once AdSense processes the slot): collapse the whole wrapper,
 *    not just the ad unit, so no leftover blank space or "Advertisement" label
 *    is left behind.
 *
 * Never rendered in the printed/exported resume — every call site keeps ads
 * out of that path, and `no-print` is a defensive second layer here.
 */
export function AdSlot({
  slot,
  format = "auto",
  // Shown only on the dev placeholder (below), to tell slots apart before
  // real slot ids exist to tell them apart by.
  name,
  // A full replacement for the wrapper's layout classes, not an addition —
  // "no-print" is applied separately and always, so a caller overriding this
  // (e.g. to swap flex for hidden/md:flex responsive visibility) can't
  // accidentally end up with two conflicting `display` utilities.
  className = "flex flex-col items-center gap-1",
}: {
  slot: string;
  format?: AdFormat;
  name?: string;
  className?: string;
}) {
  const insRef = useRef<HTMLModElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const enabled = Boolean(ADSENSE_CLIENT_ID && slot);

  useEffect(() => {
    if (!enabled) return;
    const node = insRef.current;
    if (!node) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script blocked (ad blocker, offline, not yet approved) — the
      // slot just never fills, which the observer below already handles.
    }

    const observer = new MutationObserver(() => {
      if (node.getAttribute("data-ad-status") === "unfilled") setCollapsed(true);
    });
    observer.observe(node, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => observer.disconnect();
  }, [enabled, slot]);

  if (!enabled) {
    // Real production behavior is untouched — `NODE_ENV` is "production"
    // for every `next build`, static export included, regardless of
    // whether AdSense credentials happen to be set. This branch only ever
    // runs under `next dev`.
    if (process.env.NODE_ENV !== "development") return null;
    return (
      <div className={`no-print ${className}`}>
        <div className="flex w-full flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-[var(--color-border)] px-4 py-6">
          <span className="text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">
            Ad slot{name ? ` — ${name}` : ""}
          </span>
          <span className="text-[10.5px] text-[var(--color-ink-faint)]">
            Not shown to real users until NEXT_PUBLIC_ADSENSE_* is set
          </span>
        </div>
      </div>
    );
  }

  if (collapsed) return null;

  return (
    <div className={`no-print ${className}`}>
      <span className="text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">Advertisement</span>
      <ins
        ref={insRef}
        className="adsbygoogle block w-full"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
