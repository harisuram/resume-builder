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

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Script blocked — stay collapsed; the ins remains for the crawler.
    }

    const syncStatus = () => {
      const next = node.getAttribute("data-ad-status");
      if (next === "filled" || next === "unfilled") setStatus(next);
    };
    syncStatus();
    const observer = new MutationObserver(syncStatus);
    observer.observe(node, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => observer.disconnect();
  }, [enabled, slot]);

  if (!enabled) return null;

  // Never apply Tailwind `hidden` (`display: none`). AdsBot skips those units,
  // and a filled ad that is display:none also violates AdSense's hidden-ads rule.
  const shownClass = className
    .split(/\s+/)
    .filter((token) => token && token !== "hidden")
    .join(" ");

  return (
    <div
      className={`no-print ${visible ? shownClass : "h-0 overflow-hidden"}`}
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
