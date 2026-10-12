"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { AiLimitError, suggestExperienceBullets } from "@/lib/ai";
import { fallbackBulletSuggestions } from "@/lib/bulletSuggestions";

const CACHE_KEY = "ai-bullet-suggestions-v1";
const CACHE_LIMIT = 40;

type Source = "ai" | "library";
type State =
  | { status: "loading" }
  | { status: "ready"; bullets: string[]; source: Source; familyLabel: string };

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

function readCache(role: string): string[] | null {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, string[]>;
    const hit = cache[normalize(role)];
    return Array.isArray(hit) && hit.length > 0 ? hit : null;
  } catch {
    return null;
  }
}

function writeCache(role: string, bullets: string[]) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, string[]>;
    delete cache[normalize(role)];
    cache[normalize(role)] = bullets;
    const keys = Object.keys(cache);
    for (const stale of keys.slice(0, Math.max(0, keys.length - CACHE_LIMIT))) delete cache[stale];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked: suggestions still work, just not remembered.
  }
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5c.4 3.9 1.9 6.6 6.1 7.3.5.1.5.8 0 .9-4.2.7-5.7 3.4-6.1 7.3-.1.5-.8.5-.9 0-.4-3.9-1.9-6.6-6.1-7.3-.5-.1-.5-.8 0-.9 4.2-.7 5.7-3.4 6.1-7.3.1-.5.8-.5.9 0Z" />
      <path d="M19 15.5c.2 1.6.8 2.6 2.4 2.9.3.1.3.4 0 .5-1.6.3-2.2 1.3-2.4 2.9 0 .3-.4.3-.5 0-.2-1.6-.8-2.6-2.4-2.9-.3-.1-.3-.4 0-.5 1.6-.3 2.2-1.3 2.4-2.9.1-.3.5-.3.5 0Z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12.5 10 17l9-10" />
    </svg>
  );
}

/** Up to 20 ready-to-use bullets for a role. AI writes them for the exact
 * title; if it can't, the job family's built-in set is shown instead. Each
 * point can be added once, and any number of points can be added. */
export function BulletSuggestionsModal({
  role,
  company,
  bullets,
  aiAvailable,
  onAdd,
  onAiLimited,
  onClose,
}: {
  role: string;
  company: string;
  /** The entry's current bullets, so points already on the resume show as added. */
  bullets: string[];
  aiAvailable: boolean;
  onAdd: (bullet: string) => void;
  onAiLimited: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({ status: "loading" });
  const [addedCount, setAddedCount] = useState(0);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const requestRef = useRef(0);

  const present = new Set(bullets.map(normalize));

  const load = useCallback(
    async (fresh: boolean) => {
      const request = ++requestRef.current;
      const library = fallbackBulletSuggestions(role);
      const cached = fresh ? null : readCache(role);
      if (cached) {
        setState({ status: "ready", bullets: cached, source: "ai", familyLabel: library.family.label });
        return;
      }
      if (!aiAvailable) {
        setState({ status: "ready", bullets: library.bullets, source: "library", familyLabel: library.family.label });
        return;
      }
      setState({ status: "loading" });
      try {
        const suggested = await suggestExperienceBullets({ role, company });
        if (request !== requestRef.current) return;
        writeCache(role, suggested);
        setState({ status: "ready", bullets: suggested, source: "ai", familyLabel: library.family.label });
      } catch (err) {
        if (request !== requestRef.current) return;
        if (err instanceof AiLimitError) onAiLimited();
        setState({ status: "ready", bullets: library.bullets, source: "library", familyLabel: library.family.label });
      }
    },
    [aiAvailable, company, onAiLimited, role],
  );

  useEffect(() => {
    // Suggestions come from localStorage or the network, so they can only be
    // read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(false);
    const requests = requestRef;
    return () => {
      requests.current++;
    };
    // Only the role the modal was opened for; a refresh is explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function handleAdd(bullet: string) {
    if (present.has(normalize(bullet))) return;
    onAdd(bullet);
    setAddedCount((count) => count + 1);
    setJustAdded(bullet);
  }

  function handleAddAll() {
    if (state.status !== "ready") return;
    const remaining = state.bullets.filter((b) => !present.has(normalize(b)));
    remaining.forEach(onAdd);
    setAddedCount((count) => count + remaining.length);
    setJustAdded(null);
  }

  const remaining = state.status === "ready" ? state.bullets.filter((b) => !present.has(normalize(b))).length : 0;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="suggest-overlay fixed inset-0 z-[70] flex items-end justify-center bg-black/40 backdrop-blur-[2px] md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="suggest-panel flex max-h-[88dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card outline-none md:max-h-[80vh] md:max-w-xl md:rounded-2xl"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--color-border)] md:hidden" aria-hidden="true" />

        <div className="flex items-start gap-3 border-b border-[var(--color-border)] px-5 pb-4 pt-3 md:pt-5">
          <span className="suggest-sparkle mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-tint)] text-[var(--color-accent)]">
            <SparkleIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="suggest-shimmer-text text-[11px] font-semibold uppercase tracking-[0.08em]">
              {state.status === "ready" && state.source === "library" ? "Suggested points" : "AI suggestions"}
            </p>
            <h2 id={titleId} className="mt-0.5 truncate font-display text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">
              {role}
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-ink-soft)]">
              Tap a point to add it. Replace any [X] or [N] with your real numbers.
            </p>
          </div>
        </div>

        <div className="soft-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-3" aria-busy={state.status === "loading"}>
          {state.status === "loading" ? (
            <div>
              <p className="mb-3 flex items-center gap-2 text-[12.5px] text-[var(--color-ink-soft)]" role="status">
                <SparkleIcon className="suggest-spin h-3.5 w-3.5 text-[var(--color-accent)]" />
                Writing points for {role}…
              </p>
              <ul className="flex flex-col gap-2" aria-hidden="true">
                {Array.from({ length: 6 }, (_, i) => (
                  <li
                    key={i}
                    className="suggest-skeleton h-14 rounded-xl border border-[var(--color-border)]"
                    style={{ animationDelay: `${i * 90}ms` }}
                  />
                ))}
              </ul>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {state.bullets.map((bullet, index) => {
                const added = present.has(normalize(bullet));
                return (
                  <li key={bullet} className="suggest-card-in" style={{ animationDelay: `${Math.min(index, 14) * 35}ms` }}>
                    <button
                      type="button"
                      onClick={() => handleAdd(bullet)}
                      disabled={added}
                      aria-pressed={added}
                      className={`group flex w-full min-w-0 items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                        added
                          ? `cursor-default border-[var(--color-accent)]/40 bg-[var(--color-accent-tint)] ${justAdded === bullet ? "suggest-added" : ""}`
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:-translate-y-px hover:border-[var(--color-accent)]/40 hover:shadow-card active:translate-y-0 active:scale-[0.99]"
                      }`}
                    >
                      <span className="min-w-0 flex-1 text-[13px] leading-relaxed text-[var(--color-ink)]">{bullet}</span>
                      <span
                        className={`mt-0.5 inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-medium transition-colors ${
                          added
                            ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
                            : "bg-[var(--color-accent-tint)] text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-accent-ink)]"
                        }`}
                      >
                        {added ? (
                          <>
                            <CheckIcon className="template-check-pop h-3.5 w-3.5" />
                            Added
                          </>
                        ) : (
                          <>
                            <PlusIcon className="h-3.5 w-3.5" />
                            Add
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
          <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
            <p className="text-[12px] text-[var(--color-ink-soft)]" aria-live="polite">
              {addedCount > 0 ? (
                <>
                  <span key={addedCount} className="animate-step-count-pop font-semibold text-[var(--color-accent)]">
                    {addedCount}
                  </span>{" "}
                  {addedCount === 1 ? "point" : "points"} added
                </>
              ) : state.status === "ready" ? (
                `${state.bullets.length} points ready`
              ) : null}
            </p>
            {state.status === "ready" && state.source === "ai" && aiAvailable ? (
              <button
                type="button"
                onClick={() => void load(true)}
                className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md px-1.5 text-[12px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-tint)] md:min-h-0"
              >
                <SparkleIcon className="h-3 w-3" />
                Get new points
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              variant="secondary"
              size="sm"
              className="min-h-11 sm:min-h-0"
              disabled={remaining === 0}
              onClick={handleAddAll}
            >
              Add all ({remaining})
            </Button>
            <Button variant="primary" size="sm" className="min-h-11 sm:min-h-0" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
