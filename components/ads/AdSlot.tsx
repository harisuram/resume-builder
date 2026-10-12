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

/** Tailwind tokens that compile to display:none. AdsBot skips those units, so
 * they never go on the element. They only decide when a request is allowed.
 * Breakpoints match this app's defaults: md 48rem, lg 64rem. */
const BREAKPOINT_HIDDEN = /^(?:[\w-]+:)+hidden$/;

function hideQueries(className: string): string[] {
  const tokens = className.split(/\s+/);
  const queries: string[] = [];
  if (tokens.includes("md:hidden")) queries.push("(min-width: 48rem)");
  if (tokens.includes("max-lg:hidden")) queries.push("(width < 64rem)");
  return queries;
}

/** True when a breakpoint token would have set display:none at this width. */
function hiddenAtThisWidth(className: string): boolean {
  const queries = hideQueries(className);
  if (queries.length === 0 || typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return true;
  return queries.some((query) => window.matchMedia(query).matches);
}

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
  request = true,
}: {
  slot: string;
  format?: AdFormat;
  name?: string;
  className?: string;
  /** False keeps the `ins` in the HTML for AdsBot without asking for a fill.
   * Used when the unit's visible placement is a later step: the crawler only
   * fetches the first screen, and a request here would show the ad on the
   * form. */
  request?: boolean;
}) {
  const insRef = useRef<HTMLModElement>(null);
  const [status, setStatus] = useState<FillStatus>("pending");
  const [covered, setCovered] = useState(false);
  const client = adsenseClientAttr(ADSENSE_CLIENT_ID);
  const enabled = Boolean(client && slot);
  const visible = status === "filled" && !covered;

  useEffect(() => {
    const sync = () => setCovered(hiddenAtThisWidth(className));
    sync();
    if (typeof window.matchMedia !== "function") return;
    const medias = hideQueries(className).map((query) => window.matchMedia(query));
    for (const media of medias) media.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      for (const media of medias) media.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, [className]);

  useEffect(() => {
    if (!enabled || !request) return;
    const node = insRef.current;
    if (!node) return;

    // Request only once the unit is actually visible. A unit meant for the
    // other breakpoint, or clipped in a zero-width column, would otherwise
    // be filled and then invisible — a served but hidden impression. A
    // resize that reveals it retries. Breakpoint hides stay off the element:
    // `md:hidden` is display:none, and AdsBot skips that.
    let requested = false;
    const requestAd = () => {
      if (requested || hiddenAtThisWidth(className) || !isRendered(node)) return;
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
  }, [className, enabled, request, slot]);

  if (!enabled) return null;

  // Never apply Tailwind `hidden` or `md:hidden` (`display: none`). AdsBot
  // skips those units, and a filled ad that is display:none also violates
  // AdSense's hidden-ads rule. Breakpoint tokens are honored by not requesting.
  const tokens = className.split(/\s+/).filter((token) => token && token !== "hidden" && !BREAKPOINT_HIDDEN.test(token));
  const shownClass = tokens.join(" ");
  const pendingClass = "h-0 overflow-hidden";

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
