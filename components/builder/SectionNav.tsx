"use client";

import { Fragment } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { getSectionMeta, resolveSectionOrder, SUMMARY_COPY } from "@/lib/persona";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { isBasicInfoComplete, useBuilderStore } from "@/lib/store";
import type { SectionKey, SectionStatus } from "@/lib/types";
import { Switch } from "@/components/ui/Switch";
import type { NavKey } from "./nav";

const DOT_COLOR: Record<SectionStatus, string> = {
  complete: "var(--color-focus)",
  skipped: "var(--color-ink-faint)",
  not_started: "transparent",
};

/** Separator between two rows. The mobile strip lays the rows out left to
 * right in the same order the wizard walks them, so every gap gets a short
 * connector line and the whole thing reads as one step-to-step run. Stacked
 * from md up that would just be clutter, so only the two group boundaries
 * survive there, as the full-width rules they've always been. */
function RowDivider({ group = false }: { group?: boolean }) {
  return (
    <div
      className={`my-auto h-px w-2.5 shrink-0 bg-[var(--color-border)] ${group ? "md:my-1 md:w-full" : "md:hidden"}`}
      aria-hidden="true"
    />
  );
}

export function SectionNav({ active, onSelect }: { active: NavKey; onSelect: (key: NavKey) => void }) {
  const basicInfo = useBuilderStore((s) => s.basicInfo);
  const photo = useBuilderStore((s) => s.photo);
  const sectionStatus = useBuilderStore((s) => s.sectionStatus);
  const toggleSkipSection = useBuilderStore((s) => s.toggleSkipSection);
  const sectionOrder = useBuilderStore((s) => s.sectionOrder);
  const moveSection = useBuilderStore((s) => s.moveSection);

  // Summary is fixed first — it renders first in every template regardless
  // of section order, so moving it wouldn't do anything (see
  // getNavSectionOrder). Everything else defaults to SECTION_ORDER until
  // the user moves something, via resolveSectionOrder.
  const contentKeys = resolveSectionOrder(sectionOrder);
  const basicInfoDone = isBasicInfoComplete(basicInfo);
  const summaryLabel = SUMMARY_COPY.label;
  const summaryStatus = sectionStatus.summary ?? "not_started";

  return (
    <>
      <nav
        className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-x-visible"
        aria-label="Resume sections"
      >
        <NavRow
          label="Basic info"
          active={active === "basicInfo"}
          onClick={() => onSelect("basicInfo")}
          trailing={
            <span className="hidden text-[10.5px] font-medium tracking-wide text-[var(--color-ink-faint)] md:inline">
              {basicInfoDone ? "Complete" : "Required"}
            </span>
          }
        />

        <RowDivider />

        <NavRow
          label="Photo"
          active={active === "photo"}
          // No photo — including straight after Skip, which clears it — means
          // nothing shows on the resume, so mobile marks the row inactive
          // rather than repeating a status the strip has no room for.
          skipped={!photo}
          onClick={() => onSelect("photo")}
          trailing={
            <span className="hidden text-[10.5px] font-medium tracking-wide text-[var(--color-ink-faint)] md:inline">
              {photo ? "Added" : "Optional"}
            </span>
          }
        />

        <RowDivider group />

        <NavRow
          label={summaryLabel}
          active={active === "summary"}
          skipped={summaryStatus === "skipped"}
          onClick={() => onSelect("summary")}
          trailing={
            <div className="hidden shrink-0 items-center gap-2 md:flex" data-tour="skip-switch">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-150"
                style={{ background: DOT_COLOR[summaryStatus] }}
                aria-hidden="true"
              />
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={summaryStatus !== "skipped"}
                  onChange={() => toggleSkipSection("summary")}
                  label={summaryStatus === "skipped" ? `Include ${summaryLabel}` : `Skip ${summaryLabel}`}
                />
              </div>
            </div>
          }
        />

        {contentKeys.map((key: SectionKey, index) => {
          const label = getSectionMeta(key).label;
          const status = sectionStatus[key] ?? "not_started";
          return (
            <Fragment key={key}>
              <RowDivider />
              <NavRow
                label={label}
                active={active === key}
                skipped={status === "skipped"}
                onClick={() => onSelect(key)}
                trailing={
                  <div className="hidden shrink-0 items-center gap-1.5 md:flex">
                    <MoveButtons
                      label={label}
                      onMoveUp={() => moveSection(key, "up")}
                      onMoveDown={() => moveSection(key, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < contentKeys.length - 1}
                      tourAnchor={index === 1}
                    />
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-150"
                      style={{ background: DOT_COLOR[status] }}
                      aria-hidden="true"
                    />
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={status !== "skipped"}
                        onChange={() => toggleSkipSection(key)}
                        label={status === "skipped" ? `Include ${label}` : `Skip ${label}`}
                      />
                    </div>
                  </div>
                }
              />
            </Fragment>
          );
        })}

        <RowDivider group />

        <NavRow label="Template & export" active={active === "export"} onClick={() => onSelect("export")} />
      </nav>

      <AdSlot
        slot={ADSENSE_SLOTS.builderNav}
        name="Builder nav"
        className="mt-1 flex flex-col items-center gap-1 px-3 pb-3"
      />
    </>
  );
}

/** Reorder a content section relative to its neighbors — desktop only
 * (`hidden md:flex`): on the mobile horizontal-scroll strip, "up/down"
 * doesn't map to anything and there's no room for it anyway. */
function MoveButtons({
  label,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  tourAnchor = false,
}: {
  label: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  tourAnchor?: boolean;
}) {
  return (
    <div
      data-tour={tourAnchor ? "section-sort" : undefined}
      className="hidden shrink-0 flex-col md:flex"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        aria-label={`Move ${label} up`}
        className="rounded-sm text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-25"
      >
        <ChevronUpIcon />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        aria-label={`Move ${label} down`}
        className="rounded-sm text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-25"
      >
        <ChevronDownIcon />
      </button>
    </div>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-2.5 w-2.5"
      aria-hidden="true"
    >
      <path d="m5 15 7-7 7 7" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-2.5 w-2.5"
      aria-hidden="true"
    >
      <path d="m19 9-7 7-7-7" />
    </svg>
  );
}

function NavRow({
  label,
  active,
  skipped = false,
  onClick,
  trailing,
}: {
  label: string;
  active: boolean;
  skipped?: boolean;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-between gap-2 rounded-lg pr-2 text-[13px] font-medium transition-colors duration-150 ease-out md:w-full ${
        active
          ? "bg-[var(--color-accent-tint)] text-[var(--color-accent)]"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-tint)]/60 hover:text-[var(--color-ink)]"
      }`}
    >
      {/* A plain div wraps this rather than the row itself being a <button>
          — the row's trailing content (the skip Switch) is its own
          interactive button, and a <button> can't contain another
          <button> without breaking HTML validity and event handling. */}
      <button type="button" onClick={onClick} className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left">
        {/* The mobile strip has no room for the status dot, skip Switch, or
            "Optional" badge, so the label's own color is all that's left to
            carry "this won't be on the resume" — it reverts to the row's
            color from md up, where those controls say it instead. */}
        <span
          className={`max-w-[8.5rem] overflow-hidden text-ellipsis whitespace-nowrap md:max-w-none md:overflow-visible md:whitespace-normal ${
            skipped ? "text-[var(--color-ink-faint)] md:text-inherit" : ""
          }`}
        >
          {label}
        </span>
      </button>
      {trailing}
    </div>
  );
}
