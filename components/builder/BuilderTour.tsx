"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";

type TourTarget = "skip-switch" | "section-sort" | "page-separator";

interface TourStep {
  target: TourTarget;
  title: string;
  body: string;
  placement: "right" | "left" | "center";
}

const STEPS: TourStep[] = [
  {
    target: "skip-switch",
    title: "Skip what this resume doesn’t need",
    body: "Every section has a switch in the list. Turn it off and that block never prints — no empty heading left behind. On a phone, Skip at the bottom of a section does the same thing.",
    placement: "right",
  },
  {
    target: "section-sort",
    title: "This list is the page order",
    body: "The arrows next to a section move it up or down. The preview follows that order, so the page reads in the same sequence as this list.",
    placement: "right",
  },
  {
    target: "page-separator",
    title: "Keep a section from splitting across pages",
    body: "When a block runs over a page edge, a dashed line appears on the preview. Click it to start that section — or a single entry — on the next sheet. Click again to undo.",
    placement: "left",
  },
];

function isVisibleRect(rect: DOMRect): boolean {
  return rect.width > 8 && rect.height > 8 && rect.bottom > 0 && rect.right > 0;
}

function SwitchDemo() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-accent)_18%,transparent),color-mix(in_srgb,var(--color-focus)_12%,transparent))] p-3">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-surface)]/90 px-3 py-2.5 shadow-card">
        <span className="text-[12.5px] font-medium text-[var(--color-ink)]">Skills</span>
        <span className="tour-switch relative inline-flex h-5 w-9 items-center rounded-full">
          <span className="tour-switch-knob inline-block h-3.5 w-3.5 rounded-full bg-[var(--color-surface)] shadow" />
        </span>
      </div>
      <p className="tour-caption mt-2 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
        Off = skipped, never printed
      </p>
    </div>
  );
}

function SortDemo() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-accent)_18%,transparent),color-mix(in_srgb,var(--color-focus)_12%,transparent))] p-3">
      <div className="space-y-1.5">
        {["Experience", "Projects", "Education"].map((label, i) => (
          <div
            key={label}
            className={`tour-sort-row flex items-center justify-between rounded-lg bg-[var(--color-surface)]/90 px-3 py-1.5 text-[12px] font-medium shadow-card ${
              i === 1 ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
            }`}
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            <span>{label}</span>
            <span className="flex flex-col text-[9px] leading-none text-[var(--color-ink-faint)]" aria-hidden="true">
              ▲
              <span className={i === 1 ? "text-[var(--color-accent)]" : ""}>▼</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageDemo() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-accent)_18%,transparent),color-mix(in_srgb,var(--color-focus)_12%,transparent))] px-3 py-4">
      <div className="relative mx-auto h-[5.5rem] w-[7.5rem] rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card">
        <div className="space-y-1 p-2">
          <div className="h-1.5 w-10 rounded-full bg-[var(--color-ink)]/80" />
          <div className="h-1 w-full rounded-full bg-[var(--color-border)]" />
          <div className="h-1 w-4/5 rounded-full bg-[var(--color-border)]" />
        </div>
        <div className="tour-page-rule absolute inset-x-0 top-[52%] flex items-center">
          <div className="h-px flex-1 border-t border-dashed border-[var(--color-accent)]" />
          <span className="tour-page-pill mx-0.5 shrink-0 rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-[var(--color-accent-ink)]">
            Move to page 2
          </span>
        </div>
        <div className="absolute inset-x-2 bottom-2 space-y-1">
          <div className="h-1 w-full rounded-full bg-[var(--color-border)]" />
          <div className="h-1 w-2/3 rounded-full bg-[var(--color-border)]" />
        </div>
      </div>
    </div>
  );
}

function Demo({ target }: { target: TourTarget }) {
  if (target === "skip-switch") return <SwitchDemo />;
  if (target === "section-sort") return <SortDemo />;
  return <PageDemo />;
}

function cardPosition(rect: DOMRect | null, placement: TourStep["placement"]): CSSProperties {
  const width = 360;
  if (!rect || !isVisibleRect(rect) || placement === "center") {
    return { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width };
  }
  const gap = 18;
  const maxLeft = Math.max(16, window.innerWidth - width - 16);
  const left =
    placement === "right"
      ? Math.min(rect.right + gap, maxLeft)
      : Math.max(16, Math.min(rect.left - gap - width, maxLeft));
  const top = Math.max(16, Math.min(rect.top, window.innerHeight - 420));
  return { left, top, width };
}

export function BuilderTour({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const current = STEPS[step];

  const measure = useCallback(() => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${STEPS[step].target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    const next = el.getBoundingClientRect();
    setRect(isVisibleRect(next) ? next : null);
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      } else if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        if (step < STEPS.length - 1) setStep((n) => n + 1);
        else onDismiss();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStep((n) => Math.max(0, n - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss, step]);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const hole = rect && isVisibleRect(rect) ? rect : null;
  const pad = 10;

  return createPortal(
    <div className="builder-tour no-print fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {hole ? (
          <div
            className="tour-spotlight absolute rounded-2xl"
            style={{
              left: hole.left - pad,
              top: hole.top - pad,
              width: hole.width + pad * 2,
              height: hole.height + pad * 2,
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-black/55" />
        )}
      </div>
      <div className="absolute inset-0" aria-hidden="true" />

      <div
        className="pointer-events-auto absolute max-w-[calc(100vw-2rem)]"
        style={cardPosition(hole, hole ? current.placement : "center")}
      >
        <div
          key={current.target}
          className="tour-card overflow-hidden rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-surface)] shadow-[0_24px_80px_-24px_rgb(0_0_0_/_0.55)]"
        >
          <div className="h-1 bg-[linear-gradient(90deg,var(--color-accent),var(--color-focus))]" />
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                {step + 1} of {STEPS.length}
              </p>
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-md px-1.5 py-0.5 text-[12px] font-medium text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
              >
                Skip tour
              </button>
            </div>

            <div className="mt-3">
              <Demo target={current.target} />
            </div>

            <h2 id={titleId} className="mt-4 font-display text-[18px] font-semibold leading-snug text-[var(--color-ink)]">
              {current.title}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-soft)]">{current.body}</p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step
                        ? "w-5 bg-[var(--color-accent)]"
                        : i < step
                          ? "w-1.5 bg-[var(--color-focus)]"
                          : "w-1.5 bg-[var(--color-border)]"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {step > 0 ? (
                  <Button variant="ghost" size="sm" onClick={() => setStep((n) => n - 1)}>
                    Previous
                  </Button>
                ) : null}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (step < STEPS.length - 1) setStep((n) => n + 1);
                    else onDismiss();
                  }}
                >
                  {step < STEPS.length - 1 ? "Continue" : "Start building"}
                </Button>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[var(--color-ink-faint)]">Press Esc to skip anytime.</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
