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

/** Ignore subpixel rounding; a collapsed preview column is width 0. */
const CLIPPED_MIN_PX = 2;

function clipsOverflow(style: CSSStyleDeclaration): boolean {
  // Longhands are what browsers compute. jsdom only fills the shorthand.
  return [style.overflow, style.overflowX, style.overflowY].some((value) => value === "hidden" || value === "clip");
}

/**
 * False while the unit cannot be seen: display:none / visibility:hidden, or
 * clipped by a collapsed ancestor (the preview column is width 0 below lg).
 * The slot's own wrapper is height 0 until Google fills it — that collapse
 * is not a hidden ad. body/html are skipped so a page-level overflow rule
 * can't block every unit.
 */
function isRendered(node: HTMLElement): boolean {
  for (let el: HTMLElement | null = node; el; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
  }
  const wrapper = node.parentElement;
  for (
    let el: HTMLElement | null = wrapper?.parentElement ?? null;
    el && el !== document.body && el !== document.documentElement;
    el = el.parentElement
  ) {
    if (!clipsOverflow(getComputedStyle(el))) continue;
    if (el.clientWidth < CLIPPED_MIN_PX || el.clientHeight < CLIPPED_MIN_PX) return false;
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

    // Request only once the unit is actually visible. A unit hidden at this
    // breakpoint (`md:hidden`, `max-lg:hidden`) or clipped in a zero-width
    // column would otherwise be filled and then invisible — a served but
    // hidden impression. A resize that reveals it retries.
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
    if (node.parentElement) resizeObserver.observe(node.parentElement);
    window.addEventListener("resize", requestAd);

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
      window.removeEventListener("resize", requestAd);
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
