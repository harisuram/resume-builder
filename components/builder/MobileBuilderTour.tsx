"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MobileTourTarget = "menu" | "capsule" | "preview" | null;

interface MobileTourStep {
  target: MobileTourTarget;
  eyebrow: string;
  title: string;
  body: string;
}

const STEPS: MobileTourStep[] = [
  {
    target: "menu",
    eyebrow: "Sections",
    title: "Every section lives in the menu",
    body: "Tap here to jump anywhere. Switch a section off to skip it, or drag the grip to change its order on the page.",
  },
  {
    target: "capsule",
    eyebrow: "Moving on",
    title: "Save & Next, one step at a time",
    body: "Fill a section and tap Save & Next — or Skip it if it doesn't fit your resume. Your work saves on this device as you go.",
  },
  {
    target: "preview",
    eyebrow: "Preview",
    title: "Peek at the real page anytime",
    body: "Preview opens your resume as it will print. Try on another template there — your details stay put.",
  },
  {
    target: null,
    eyebrow: "All set",
    title: "You're ready to build",
    body: "Start with your basic info. It's the only step you can't skip.",
  },
];

const PAD = 8;
const SWIPE_PX = 48;

interface Hole {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
}

function measureTarget(target: MobileTourTarget): Hole | null {
  if (!target) return null;
  const el = document.querySelector<HTMLElement>(`[data-mtour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;
  return {
    left: r.left - PAD,
    top: r.top - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
    radius: Math.min(28, (r.height + PAD * 2) / 2),
  };
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto h-[7.5rem] w-full max-w-[15rem] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] shadow-inner">
      {children}
    </div>
  );
}

function Lines({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="h-1.5 w-2/5 rounded-full bg-[var(--color-ink)]/70" />
      <div className="h-1 w-full rounded-full bg-[var(--color-border)]" />
      <div className="h-1 w-4/5 rounded-full bg-[var(--color-border)]" />
      <div className="h-1 w-3/5 rounded-full bg-[var(--color-border)]" />
    </div>
  );
}

function MenuDemo() {
  return (
    <Phone>
      <Lines className="p-3 pl-5" />
      <div className="mtour-drawer absolute inset-y-0 left-0 w-[62%] rounded-r-xl border-r border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg">
        {["Summary", "Experience", "Skills", "Projects"].map((label, i) => (
          <div
            key={label}
            className={`mtour-drawer-row mb-1 flex items-center justify-between rounded-md px-1.5 py-1 text-[9px] font-medium ${
              i === 1 ? "mtour-drag-row bg-[var(--color-accent-tint)] text-[var(--color-accent)]" : "text-[var(--color-ink-soft)]"
            }`}
            style={{ animationDelay: `${0.25 + i * 0.07}s` }}
          >
            <span>{label}</span>
            <span className={`relative inline-flex h-2.5 w-4.5 items-center rounded-full ${i === 2 ? "mtour-mini-switch" : "bg-[var(--color-accent)]"}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full bg-white ${i === 2 ? "mtour-mini-knob" : "translate-x-[9px]"}`} />
            </span>
          </div>
        ))}
      </div>
    </Phone>
  );
}

function CapsuleDemo() {
  return (
    <Phone>
      <div className="absolute inset-x-3 top-3 h-1 rounded-full bg-[var(--color-border)]">
        <div className="mtour-progress h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-focus))]" />
      </div>
      <div className="mtour-step-swap absolute inset-x-3 top-6">
        <Lines />
      </div>
      <div className="absolute inset-x-2 bottom-2 flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-1 shadow-md">
        <span className="flex-1 text-center text-[9px] font-medium text-[var(--color-ink-soft)]">Skip</span>
        <span className="mtour-next-press flex-[2] rounded-full bg-[var(--color-accent)] py-1 text-center text-[9px] font-semibold text-[var(--color-accent-ink)]">
          Save &amp; Next →
        </span>
      </div>
    </Phone>
  );
}

function PreviewDemo() {
  return (
    <Phone>
      <Lines className="p-3" />
      <div className="mtour-sheet absolute inset-x-0 bottom-0 h-[82%] rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 pt-1.5 shadow-[0_-8px_20px_-8px_rgb(0_0_0_/_0.25)]">
        <div className="mx-auto mb-1.5 h-0.5 w-6 rounded-full bg-[var(--color-border)]" />
        <div className="mtour-template mb-1.5 rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--color-ink)]">
          Template ▾
        </div>
        <div className="mx-auto w-[70%] rounded-sm bg-[var(--color-paper)] p-1.5 shadow-sm">
          <div className="mtour-accent-bar mb-1 h-1 w-1/2 rounded-full" />
          <div className="space-y-0.5">
            <div className="h-0.5 w-full rounded-full bg-[var(--color-border)]" />
            <div className="h-0.5 w-4/5 rounded-full bg-[var(--color-border)]" />
            <div className="h-0.5 w-3/5 rounded-full bg-[var(--color-border)]" />
          </div>
        </div>
      </div>
    </Phone>
  );
}

function DoneDemo() {
  return (
    <div className="relative mx-auto flex h-[7.5rem] items-center justify-center">
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="mtour-confetti absolute h-1.5 w-1.5 rounded-[2px]"
          style={{
            ["--a" as string]: `${i * (360 / 14)}deg`,
            ["--d" as string]: `${38 + (i % 3) * 10}px`,
            animationDelay: `${(i % 4) * 0.04}s`,
            background: ["var(--color-accent)", "var(--color-success)", "var(--color-focus)", "#f59e0b"][i % 4],
          }}
          aria-hidden="true"
        />
      ))}
      <span className="mtour-done-badge flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)] text-[var(--color-surface)] shadow-[0_12px_30px_-10px_var(--color-success)]">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path className="mtour-done-check" d="m6 12.5 4 4 8-9" />
        </svg>
      </span>
    </div>
  );
}

function Demo({ index }: { index: number }) {
  if (index === 0) return <MenuDemo />;
  if (index === 1) return <CapsuleDemo />;
  if (index === 2) return <PreviewDemo />;
  return <DoneDemo />;
}

/** First-run walkthrough for phones: spotlights the real controls (menu
 * button, bottom bar, Preview) with a looping demo on each card. Swipe
 * the card or use Next / Back; Skip or Esc ends it. */
export function MobileBuilderTour({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [hole, setHole] = useState<Hole | null>(null);
  const [leaving, setLeaving] = useState(false);
  const swipeRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  const measure = useCallback(() => setHole(measureTarget(STEPS[step].target)), [step]);

  useLayoutEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(onDismiss, 260);
  }, [onDismiss]);

  const go = useCallback(
    (delta: 1 | -1) => {
      const next = step + delta;
      if (next < 0) return;
      if (next >= STEPS.length) {
        finish();
        return;
      }
      setDir(delta);
      setStep(next);
    },
    [step, finish],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, finish]);

  if (!open) return null;

  // Card goes to whichever half of the screen the spotlight isn't in.
  const targetLow = hole ? hole.top + hole.height / 2 > window.innerHeight / 2 : false;
  const cardPlacement = !hole ? "center" : targetLow ? "top" : "bottom";

  return createPortal(
    <div
      className={`no-print fixed inset-0 z-[80] transition-opacity duration-300 md:hidden ${leaving ? "opacity-0" : "mtour-fade-in"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Spotlight: one box whose huge shadow is the dim layer, so moving
          between targets is a single smooth morph. With no target it
          shrinks to the centre and the whole screen stays dimmed. */}
      <div
        className="mtour-spotlight pointer-events-none absolute"
        style={
          hole
            ? { left: hole.left, top: hole.top, width: hole.width, height: hole.height, borderRadius: hole.radius }
            : { left: "50%", top: "50%", width: 0, height: 0, borderRadius: 999 }
        }
        aria-hidden="true"
      />
      {hole ? (
        <span
          className="mtour-tap pointer-events-none absolute rounded-full"
          style={{ left: hole.left + hole.width / 2 - 18, top: hole.top + hole.height / 2 - 18 }}
          aria-hidden="true"
        />
      ) : null}

      <div
        className={`absolute inset-x-3 ${
          cardPlacement === "top"
            ? "top-[max(0.75rem,env(safe-area-inset-top))]"
            : cardPlacement === "bottom"
              ? "bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
              : "top-1/2 -translate-y-1/2"
        }`}
      >
        <div
          key={step}
          className={`${dir === 1 ? "mtour-card-next" : "mtour-card-prev"} touch-pan-y overflow-hidden rounded-3xl border border-[var(--color-border)]/70 bg-[var(--color-surface)]/95 shadow-[0_24px_60px_-20px_rgb(0_0_0_/_0.55)] backdrop-blur-xl`}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            swipeRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            const s = swipeRef.current;
            swipeRef.current = null;
            if (!s || s.id !== e.pointerId) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(e.clientY - s.y)) return;
            go(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => (swipeRef.current = null)}
        >
          <div className="h-1 bg-[linear-gradient(90deg,var(--color-accent),var(--color-focus))]" />
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                {current.eyebrow}
              </p>
              {!last ? (
                <button
                  type="button"
                  onClick={finish}
                  className="rounded-full px-2.5 py-1 text-[12px] font-medium text-[var(--color-ink-faint)] transition active:scale-95 active:text-[var(--color-ink)]"
                >
                  Skip tour
                </button>
              ) : null}
            </div>

            <div className="mt-3">
              <Demo index={step} />
            </div>

            <h2 id={titleId} className="mtour-title mt-3 font-display text-[17px] font-semibold leading-snug text-[var(--color-ink)]">
              {current.title}
            </h2>
            <p className="mtour-body mt-1.5 text-[13px] leading-relaxed text-[var(--color-ink-soft)]">{current.body}</p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? "w-5 bg-[var(--color-accent)]" : i < step ? "w-1.5 bg-[var(--color-focus)]" : "w-1.5 bg-[var(--color-border)]"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="h-10 rounded-full px-3.5 text-[13px] font-medium text-[var(--color-ink-soft)] transition active:scale-95"
                  >
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="h-10 rounded-full bg-[var(--color-accent)] px-5 text-[13px] font-semibold text-[var(--color-accent-ink)] shadow-cta transition active:scale-95"
                >
                  {last ? "Start building" : "Next"}
                </button>
              </div>
            </div>
            {step === 0 ? (
              <p className="mt-2.5 text-center text-[11px] text-[var(--color-ink-faint)]">Swipe the card to move between tips</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
