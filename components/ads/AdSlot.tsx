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
 * Visible only once Google has actually filled the unit. Until then — and
 * whenever the request comes back unfilled — the wrapper takes no layout
 * space. The `ins.adsbygoogle` stays in the DOM the whole time so AdSense's
 * crawler (and the fill request itself) can still see the tag.
 *
 * Unconfigured builds render nothing at all (no dashed placeholder).
 * Never rendered in the printed/exported resume — every call site keeps ads
 * out of that path, and `no-print` is a defensive second layer here.
 */
export function AdSlot({
  slot,
  format = "auto",
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
  const [status, setStatus] = useState<FillStatus>("pending");
  const client = adsenseClientAttr(ADSENSE_CLIENT_ID);
  const enabled = Boolean(client && slot);
  const visible = status === "filled";

  useEffect(() => {
    if (!enabled) return;
    const node = insRef.current;
    if (!node) return;

    try {
      // Queue the request even if the loader script hasn't run yet — that's
      // the official snippet's pattern (`adsbygoogle = window.adsbygoogle || []`).
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script blocked (ad blocker, offline, not yet approved).
      // Status stays pending, so the slot stays collapsed.
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

  return (
    <div
      className={`no-print ${visible ? className : "h-0 overflow-hidden"}`}
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
