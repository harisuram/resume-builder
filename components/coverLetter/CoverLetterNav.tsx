"use client";

import { Fragment, type ReactNode } from "react";
import { Switch } from "@/components/ui/Switch";
import { ReorderHandle, RowDivider, StatusMark } from "@/components/builder/SectionNav";
import { useRowReorder } from "@/components/builder/useRowReorder";
import {
  isClosingComplete,
  isGreetingComplete,
  isRecipientComplete,
  paragraphLabel,
} from "@/lib/coverLetter";
import { useCoverLetterStore } from "@/lib/coverLetterStore";
import { isBasicInfoComplete, useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import type { LetterParagraph, SectionStatus } from "@/lib/types";
import type { LetterStepKey } from "./steps";

type ParagraphId = LetterParagraph["id"];

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
        {children}
      </svg>
    </span>
  );
}

const ICONS: Record<"details" | "recipient" | "greeting" | "paragraph" | "closing", ReactNode> = {
  details: (
    <Icon>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5a7 7 0 0 1 14 0" />
    </Icon>
  ),
  recipient: (
    <Icon>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  ),
  greeting: (
    <Icon>
      <path d="M5 18.5V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9Z" />
    </Icon>
  ),
  paragraph: (
    <Icon>
      <path d="M5 7h14M5 11h14M5 15h9" />
    </Icon>
  ),
  closing: (
    <Icon>
      <path d="M4 17c2.5-4 4-4 5-1s2.5 2 4-1 3-3 4 0 1.5 1 3-1" />
    </Icon>
  ),
};

function status(done: boolean, skipped = false): SectionStatus {
  return skipped ? "skipped" : done ? "complete" : "not_started";
}

/** The letter's sidebar: the resume SectionNav's rows, switches, status
 * marks and drag handles, over the letter's steps. `drawer` renders it for
 * the mobile side menu. */
export function CoverLetterNav({
  active,
  onSelect,
  onAddParagraph,
  drawer = false,
}: {
  active: LetterStepKey;
  onSelect: (key: LetterStepKey) => void;
  onAddParagraph: () => void;
  drawer?: boolean;
}) {
  const basicInfo = useBuilderStore((s) => s.basicInfo);
  const letter = useCoverLetterStore((s) => s.letter);
  const toggleSkip = useCoverLetterStore((s) => s.toggleSkipParagraph);
  const moveParagraph = useCoverLetterStore((s) => s.moveParagraph);
  const keys = letter.paragraphs.map((p) => p.id);

  function reorderWithToast(id: ParagraphId, apply: () => void) {
    const before = useCoverLetterStore.getState().letter.paragraphs;
    apply();
    const after = useCoverLetterStore.getState().letter.paragraphs;
    if (after === before) return;
    const index = after.findIndex((p) => p.id === id);
    const label = paragraphLabel(after[index]);
    showToast(index > 0 ? `${label} moved below ${paragraphLabel(after[index - 1])}` : `${label} moved to the top`, "success");
  }

  const { draggingKey, droppedKey, startDrag, rowRef } = useRowReorder<ParagraphId>({
    keys,
    isLocked: (id) => Boolean(letter.paragraphs.find((p) => p.id === id)?.skipped),
    onReorder: (id, toIndex) =>
      reorderWithToast(id, () => useCoverLetterStore.getState().reorderParagraph(id, toIndex)),
  });

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Cover letter sections">
      <Row
        icon={ICONS.details}
        label="Your details"
        active={active === "details"}
        drawer={drawer}
        onClick={() => onSelect("details")}
        trailing={
          <span className="text-[10.5px] font-medium tracking-wide text-[var(--color-ink-faint)]">
            {isBasicInfoComplete(basicInfo) ? "Complete" : "Required"}
          </span>
        }
      />
      <RowDivider group drawer />
      <Row
        icon={ICONS.recipient}
        label="Recipient"
        active={active === "recipient"}
        drawer={drawer}
        onClick={() => onSelect("recipient")}
        trailing={<StatusMark status={status(isRecipientComplete(letter))} drawer={drawer} />}
      />
      <Row
        icon={ICONS.greeting}
        label="Greeting"
        active={active === "greeting"}
        drawer={drawer}
        onClick={() => onSelect("greeting")}
        trailing={<StatusMark status={status(isGreetingComplete(letter))} drawer={drawer} />}
      />

      <RowDivider group drawer />
      <span className="px-3 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        Body
      </span>
      {letter.paragraphs.map((paragraph) => {
        const label = paragraphLabel(paragraph);
        const skipped = Boolean(paragraph.skipped);
        return (
          <Fragment key={paragraph.id}>
            <Row
              icon={ICONS.paragraph}
              label={label}
              active={active === paragraph.id}
              drawer={drawer}
              skipped={skipped}
              dragging={draggingKey === paragraph.id}
              dropped={droppedKey === paragraph.id}
              rowRef={rowRef(paragraph.id)}
              onClick={() => onSelect(paragraph.id)}
              trailing={
                <div className="flex shrink-0 items-center gap-1.5">
                  <ReorderHandle
                    label={label}
                    skipped={skipped}
                    dragging={draggingKey === paragraph.id}
                    tourAnchor={false}
                    drawer
                    onPointerDown={(event) => startDrag(paragraph.id, event)}
                    onMoveUp={() => reorderWithToast(paragraph.id, () => moveParagraph(paragraph.id, "up"))}
                    onMoveDown={() => reorderWithToast(paragraph.id, () => moveParagraph(paragraph.id, "down"))}
                  />
                  <StatusMark status={status(Boolean(paragraph.text.trim()), skipped)} drawer={drawer} />
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={!skipped}
                      onChange={() => toggleSkip(paragraph.id)}
                      label={skipped ? `Include ${label}` : `Skip ${label}`}
                    />
                  </div>
                </div>
              }
            />
          </Fragment>
        );
      })}
      <button
        type="button"
        onClick={onAddParagraph}
        className="mx-1 mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] py-2 text-[12.5px] font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] active:scale-[0.98]"
      >
        <span aria-hidden="true">+</span> Add paragraph
      </button>

      <RowDivider group drawer />
      <Row
        icon={ICONS.closing}
        label="Closing"
        active={active === "closing"}
        drawer={drawer}
        onClick={() => onSelect("closing")}
        trailing={<StatusMark status={status(isClosingComplete(letter))} drawer={drawer} />}
      />

      <RowDivider group drawer />
      <div className={drawer ? "pt-1" : "sticky bottom-0 z-[9] -mx-3 -mb-3 mt-1 bg-[var(--color-surface)] px-3 pb-3 pt-2"}>
        <Row label="Download" active={active === "export"} drawer={drawer} cta onClick={() => onSelect("export")} />
      </div>
    </nav>
  );
}

function Row({
  icon,
  label,
  active,
  drawer,
  cta = false,
  skipped = false,
  dragging = false,
  dropped = false,
  onClick,
  trailing,
  rowRef,
}: {
  icon?: ReactNode;
  label: string;
  active: boolean;
  drawer: boolean;
  cta?: boolean;
  skipped?: boolean;
  dragging?: boolean;
  dropped?: boolean;
  onClick: () => void;
  trailing?: ReactNode;
  rowRef?: (node: HTMLElement | null) => void;
}) {
  return (
    <div
      ref={rowRef}
      aria-grabbed={dragging || undefined}
      className={`flex w-full shrink-0 items-center justify-between gap-2 rounded-lg ${cta ? "" : "pr-2"} text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200 ease-out ${
        cta
          ? `bg-[linear-gradient(135deg,var(--color-accent),color-mix(in_srgb,var(--color-accent)_70%,var(--color-focus)))] font-semibold text-[var(--color-accent-ink)] shadow-[0_8px_20px_-10px_var(--accent-glow)] hover:brightness-110 ${
              active ? "ring-2 ring-[var(--color-focus)] ring-offset-2 ring-offset-[var(--color-surface)]" : ""
            }`
          : dragging
            ? "nav-row-lift"
            : dropped
              ? `nav-row-dropped ${active ? "bg-[var(--color-accent-tint)] text-[var(--color-accent)]" : "text-[var(--color-ink-soft)]"}`
              : active
                ? "bg-[var(--color-accent-tint)] text-[var(--color-accent)]"
                : "text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-tint)]/60 hover:text-[var(--color-ink)]"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "step" : undefined}
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left ${cta ? "justify-center" : ""}`}
      >
        {icon ? <span className={skipped ? "opacity-50" : undefined}>{icon}</span> : null}
        <span
          className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${skipped && !drawer ? "text-[var(--color-ink-faint)]" : ""}`}
        >
          {label}
        </span>
      </button>
      {trailing}
    </div>
  );
}
