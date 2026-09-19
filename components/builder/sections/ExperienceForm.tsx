"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DeleteIconButton } from "@/components/ui/DeleteIconButton";
import { FieldGroup, TextInput } from "@/components/ui/Field";
import { SuggestInput } from "@/components/ui/SuggestInput";
import { AI_BACKOFF_MS, AI_LIMITED_UNTIL_KEY, AiLimitError, optimizeExperienceBullets } from "@/lib/ai";
import { ROLE_CATALOG } from "@/lib/catalogs";
import { isCurrentExperience, PRESENT_LABEL } from "@/lib/date";
import { useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import type { Experience } from "@/lib/types";
import { useTouchedFields } from "@/lib/useTouchedFields";
import { getExperienceErrors, MAX_BULLET_LENGTH, MAX_FIELD_LENGTH } from "@/lib/validation";
import { BulletTextArea } from "./BulletTextArea";
import { CopyBulletsButton } from "./CopyBulletsButton";
import { ItemCard, useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

const EMPTY: Experience = { company: "", role: "", startDate: "", current: false, bullets: [""] };

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
  /** Which bullet row to focus after "+ Add bullet" (entry index + bullet index). */
  const [focusBullet, setFocusBullet] = useState<{ entry: number; bullet: number } | null>(null);
  const { touch, errorFor } = useTouchedFields();

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
        localStorage.setItem(AI_LIMITED_UNTIL_KEY, String(Date.now() + AI_BACKOFF_MS));
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
        <SkippedNotice label={title} sectionKey={sectionKey} />
      ) : (
        <>
      <div className="flex flex-col gap-3">
        {items.map((exp, i) => {
          const errors = getExperienceErrors(exp);
          const companyError = errorFor(`${i}.company`, errors.company);
          const roleError = errorFor(`${i}.role`, errors.role);
          const endError = errorFor(`${i}.endDate`, errors.endDate);
          const hasStart = Boolean(exp.startDate);
          const present = hasStart && isCurrentExperience(exp);
          const showPresentCheckbox = !exp.endDate;
          return (
          <ItemCard key={i} autoFocus={i === focusIndex} onRemove={() => removeListItem(sectionKey, i)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldGroup label="Company / organization" htmlFor={`${sectionKey}-${i}-company`} required error={companyError}>
                <TextInput
                  id={`${sectionKey}-${i}-company`}
                  value={exp.company}
                  onChange={(e) => updateListItem(sectionKey, i, { company: e.target.value })}
                  onBlur={touch(`${i}.company`)}
                  placeholder="Acme Corp"
                  maxLength={MAX_FIELD_LENGTH}
                  invalid={Boolean(companyError)}
                />
              </FieldGroup>
              <FieldGroup label="Role / title" htmlFor={`${sectionKey}-${i}-role`} required error={roleError}>
                <SuggestInput
                  id={`${sectionKey}-${i}-role`}
                  value={exp.role}
                  onChange={(value) => updateListItem(sectionKey, i, { role: value })}
                  onBlur={touch(`${i}.role`)}
                  placeholder="Software Engineer, Pharmacist, Architect…"
                  maxLength={MAX_FIELD_LENGTH}
                  invalid={Boolean(roleError)}
                  suggestions={ROLE_CATALOG}
                  suggestionLabel="Suggested roles"
                />
              </FieldGroup>
              <div className="grid grid-cols-1 items-start gap-x-3 gap-y-2 sm:col-span-2 md:grid-cols-2">
                <FieldGroup label="Start date" htmlFor={`${sectionKey}-${i}-start`}>
                  <TextInput
                    id={`${sectionKey}-${i}-start`}
                    type="month"
                    value={exp.startDate}
                    className="w-full min-w-0 md:min-w-[14rem]"
                    onChange={(e) => {
                      const startDate = e.target.value;
                      updateListItem(
                        sectionKey,
                        i,
                        startDate ? { startDate } : { startDate: "", endDate: undefined, current: false },
                      );
                    }}
                    onBlur={touch(`${i}.startDate`)}
                  />
                </FieldGroup>
                <FieldGroup
                  label="End date"
                  htmlFor={`${sectionKey}-${i}-end`}
                  error={present ? undefined : endError}
                  labelRight={
                    showPresentCheckbox ? (
                      <label
                        htmlFor={`${sectionKey}-${i}-present`}
                        className={`flex items-center gap-2 text-[12.5px] font-medium whitespace-nowrap text-[var(--color-ink-soft)] ${
                          hasStart ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                        }`}
                      >
                        <input
                          id={`${sectionKey}-${i}-present`}
                          type="checkbox"
                          checked={present}
                          disabled={!hasStart}
                          onChange={(e) =>
                            updateListItem(
                              sectionKey,
                              i,
                              e.target.checked ? { current: true, endDate: undefined } : { current: false },
                            )
                          }
                          className="h-3.5 w-3.5 accent-[var(--color-accent)] disabled:cursor-not-allowed"
                        />
                        {PRESENT_LABEL}
                      </label>
                    ) : null
                  }
                >
                  {present ? (
                    <TextInput id={`${sectionKey}-${i}-end`} value={PRESENT_LABEL} readOnly className="w-full min-w-0 md:min-w-[14rem]" />
                  ) : (
                    <TextInput
                      id={`${sectionKey}-${i}-end`}
                      type="month"
                      value={exp.endDate ?? ""}
                      disabled={!hasStart}
                      className="w-full min-w-0 md:min-w-[14rem]"
                      onChange={(e) =>
                        updateListItem(sectionKey, i, { endDate: e.target.value || undefined, current: false })
                      }
                      onBlur={touch(`${i}.endDate`)}
                      invalid={Boolean(endError)}
                    />
                  )}
                </FieldGroup>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-3">
              <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <p className="text-[12px] font-medium tracking-wide text-[var(--color-ink-soft)]">
                  What did you do? (one bullet each)
                </p>
                <CopyBulletsButton bullets={exp.bullets} />
              </div>
              <div className="flex flex-col gap-2">
                {exp.bullets.map((bullet, bi) => {
                  const bulletError = errorFor(`${i}.bullet.${bi}`, errors.bullets[bi]);
                  return (
                  <div key={bi}>
                    <div className="flex items-start gap-2">
                      <BulletTextArea
                        value={bullet}
                        onChange={(nextValue) => {
                          const next = [...exp.bullets];
                          next[bi] = nextValue;
                          setBullets(i, next);
                        }}
                        onBlur={touch(`${i}.bullet.${bi}`)}
                        placeholder="Shipped a feature that increased signups by 12%"
                        maxLength={MAX_BULLET_LENGTH}
                        invalid={Boolean(bulletError)}
                        aria-label={`Bullet ${bi + 1}`}
                        autoFocus={focusBullet?.entry === i && focusBullet.bullet === bi}
                      />
                      <DeleteIconButton
                        onClick={() => setBullets(i, exp.bullets.filter((_, idx) => idx !== bi))}
                        aria-label="Remove bullet"
                        className="mt-0.5 h-9 w-9 shrink-0 md:h-8 md:w-8"
                      />
                    </div>
                    {bulletError ? (
                      <p role="alert" className="mt-1 text-[11.5px] text-red-600">
                        {bulletError}
                      </p>
                    ) : null}
                  </div>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setFocusBullet({ entry: i, bullet: exp.bullets.length });
                    setBullets(i, [...exp.bullets, ""]);
                  }}
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
          );
        })}
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
