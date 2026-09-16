"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { AiLimitError, optimizeExperienceBullets } from "@/lib/ai";
import { useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import type { Experience } from "@/lib/types";
import { ItemCard, useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

const EMPTY: Experience = { company: "", role: "", startDate: "", bullets: [""] };

/** Once the shared free quota is hit, stop offering the button for a while
 * instead of letting every click fail — persisted so it stays hidden across
 * this section and a reload, not just this component instance. */
const AI_LIMITED_UNTIL_KEY = "ai-optimize-limited-until";
const BACKOFF_MS = 4 * 60 * 60 * 1000;

export function ExperienceForm({
  sectionKey,
  title,
  help,
}: {
  sectionKey: "experience" | "internships" | "partTime";
  title: string;
  help: string;
}) {
  const items = useBuilderStore((s) => s.sections[sectionKey]) ?? [];
  const status = useBuilderStore((s) => s.sectionStatus[sectionKey]) ?? "not_started";
  const addListItem = useBuilderStore((s) => s.addListItem);
  const updateListItem = useBuilderStore((s) => s.updateListItem);
  const removeListItem = useBuilderStore((s) => s.removeListItem);
  const { focusIndex, focusNew } = useFocusNewIndex();
  const [aiAvailable, setAiAvailable] = useState(true);
  const [optimizingIndex, setOptimizingIndex] = useState<number | null>(null);

  const skipped = status === "skipped";

  useEffect(() => {
    const until = Number(localStorage.getItem(AI_LIMITED_UNTIL_KEY) ?? 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAiAvailable(Date.now() >= until);
  }, []);

  function setBullets(index: number, bullets: string[]) {
    updateListItem(sectionKey, index, { bullets });
  }

  async function handleOptimize(index: number, exp: Experience) {
    const bullets = exp.bullets.map((b) => b.trim()).filter(Boolean);
    if (bullets.length === 0) return;
    setOptimizingIndex(index);
    try {
      const optimized = await optimizeExperienceBullets({ role: exp.role, company: exp.company, bullets });
      setBullets(index, optimized);
    } catch (err) {
      if (err instanceof AiLimitError) {
        localStorage.setItem(AI_LIMITED_UNTIL_KEY, String(Date.now() + BACKOFF_MS));
        setAiAvailable(false);
      }
      showToast(err instanceof Error ? err.message : "AI optimization failed. Try again later.");
    } finally {
      setOptimizingIndex(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title={title} help={help} />
      {skipped ? (
        <SkippedNotice label={title} />
      ) : (
        <>
      <div className="flex flex-col gap-3">
        {items.map((exp, i) => (
          <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem(sectionKey, i)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldGroup label="Company / organization">
                <TextInput
                  value={exp.company}
                  onChange={(e) => updateListItem(sectionKey, i, { company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </FieldGroup>
              <FieldGroup label="Role / title">
                <TextInput
                  value={exp.role}
                  onChange={(e) => updateListItem(sectionKey, i, { role: e.target.value })}
                  placeholder="Software Engineer Intern"
                />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Start date">
                  <TextInput
                    type="month"
                    value={exp.startDate}
                    onChange={(e) => updateListItem(sectionKey, i, { startDate: e.target.value })}
                  />
                </FieldGroup>
                <FieldGroup label="End date">
                  <TextInput
                    type="month"
                    value={exp.endDate ?? ""}
                    onChange={(e) => updateListItem(sectionKey, i, { endDate: e.target.value || undefined })}
                  />
                </FieldGroup>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-3">
              <p className="mb-2 text-[12px] font-medium tracking-wide text-[var(--color-ink-soft)]">
                What did you do? (one line per bullet)
              </p>
              <div className="flex flex-col gap-2">
                {exp.bullets.map((bullet, bi) => (
                  <div key={bi} className="flex items-center gap-2">
                    <TextInput
                      value={bullet}
                      onChange={(e) => {
                        const next = [...exp.bullets];
                        next[bi] = e.target.value;
                        setBullets(i, next);
                      }}
                      placeholder="Shipped a feature that increased signups by 12%"
                    />
                    <button
                      type="button"
                      onClick={() => setBullets(i, exp.bullets.filter((_, idx) => idx !== bi))}
                      aria-label="Remove bullet"
                      className="shrink-0 text-[12px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-accent)]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBullets(i, [...exp.bullets, ""])}
                  className="text-[12px] font-medium text-[var(--color-accent)] transition-opacity hover:opacity-80"
                >
                  + Add bullet
                </button>
                {aiAvailable && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={optimizingIndex === i || exp.bullets.every((b) => !b.trim())}
                    onClick={() => handleOptimize(i, exp)}
                  >
                    {optimizingIndex === i ? "Optimizing…" : "✨ Make ATS-friendly"}
                  </Button>
                )}
              </div>
            </div>
          </ItemCard>
        ))}
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => {
          focusNew(items.length);
          addListItem(sectionKey, EMPTY);
        }}
      >
        + Add {sectionKey === "experience" ? "experience" : "role"}
      </Button>
        </>
      )}
    </div>
  );
}
