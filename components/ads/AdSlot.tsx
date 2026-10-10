"use client";

import { useEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT_ID, adsenseClientAttr } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdFormat = "auto" | "fluid";
type FillStatus = "pending" | "filled" | "unfilled";

/** False while the node or any ancestor is display:none. */
function isRendered(node: HTMLElement): boolean {
  for (let el: HTMLElement | null = node; el; el = el.parentElement) {
    if (getComputedStyle(el).display === "none") return false;
  }
  return true;
}

/**
 * Visible only once Google has filled the unit. Unfilled or blocked
 * requests take no layout space; the `ins` stays in the DOM for the crawler.
 */
export function AdSlot({
  slot,
  format = "auto",
  name,
  className = "flex flex-col items-center gap-1",
}: {
  slot: string;
  format?: AdFormat;
  name?: string;
  className?: string;
}) {
  const insRef = useRef<HTMLModElement>(null);
  const [status, setStatus] = useState<FillStatus>("pending");
  const client = adsenseClientAttr(ADSENSE_CLIENT_ID);
  const enabled = Boolean(client && slot);
  const visible = status === "filled";

  useEffect(() => {
    if (!enabled) return;
    const node = insRef.current;
    if (!node) return;

    // Request only once the unit is actually rendered. A unit hidden at this
    // breakpoint (e.g. `md:hidden`) would otherwise be filled and then shown
    // as display:none — a served but invisible impression. A resize that
    // reveals it retries via the ResizeObserver.
    let requested = false;
    const requestAd = () => {
      if (requested || !isRendered(node)) return;
      requested = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Script blocked — stay collapsed; the ins remains for the crawler.
      }
    };
    requestAd();
    const resizeObserver = new ResizeObserver(requestAd);
    resizeObserver.observe(node);

    const syncStatus = () => {
      const next = node.getAttribute("data-ad-status");
      if (next === "filled" || next === "unfilled") setStatus(next);
    };
    syncStatus();
    const observer = new MutationObserver(syncStatus);
    observer.observe(node, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => {
      resizeObserver.disconnect();
      observer.disconnect();
    };
  }, [enabled, slot]);

  if (!enabled) return null;

  // Never apply Tailwind `hidden` (`display: none`). AdsBot skips those units,
  // and a filled ad that is display:none also violates AdSense's hidden-ads rule.
  const tokens = className.split(/\s+/).filter((token) => token && token !== "hidden");
  const shownClass = tokens.join(" ");
  // Breakpoint hides (`md:hidden`) apply while pending too, so the unit is
  // never requested at a width where it would end up hidden once filled.
  const pendingClass = ["h-0 overflow-hidden", ...tokens.filter((token) => /^(?:[\w-]+:)+hidden$/.test(token))].join(" ");

  return (
    <div
      className={`no-print ${visible ? shownClass : pendingClass}`}
      aria-hidden={visible ? undefined : true}
      aria-label={visible ? name : undefined}
    >
      {visible && (
        <span className="text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">Advertisement</span>
      )}
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
