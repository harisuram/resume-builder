"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import { Switch } from "@/components/ui/Switch";
import { FilledDownloadIcon } from "@/components/builder/AnimatedIcons";
import { ReorderHandle, RowDivider, StatusMark } from "@/components/builder/SectionNav";
import { useRowReorder } from "@/components/builder/useRowReorder";
import {
  isClosingComplete,
  isGreetingComplete,
  isGuidedParagraph,
  isRecipientComplete,
  paragraphLabel,
} from "@/lib/coverLetter";
import { useCoverLetterStore } from "@/lib/coverLetterStore";
import { isBasicInfoComplete, useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import type { LetterParagraph, LetterParagraphKind, SectionStatus } from "@/lib/types";
import type { LetterStepKey } from "./steps";

type ParagraphId = LetterParagraph["id"];

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="block h-full w-full">
      {children}
    </svg>
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
      <path d="m14.5 5.5 4 4L9 19H5v-4Z" />
      <path d="m12.5 7.5 4 4" />
    </Icon>
  ),
  closing: (
    <Icon>
      <path d="M4 17c2.5-4 4-4 5-1s2.5 2 4-1 3-3 4 0 1.5 1 3-1" />
    </Icon>
  ),
};

/** One icon per guided paragraph; custom paragraphs use the pen. */
const PARAGRAPH_ICONS: Record<LetterParagraphKind, ReactNode> = {
  opening: (
    <Icon>
      <path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M11 11V5a1.5 1.5 0 0 1 3 0v6" />
      <path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4 15.5a1.5 1.5 0 0 1 2.3-1.9L8 15.5" />
    </Icon>
  ),
  interest: (
    <Icon>
      <path d="M12 19.5s-7.5-4.4-7.5-9.7A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8c0 5.3-7.5 9.7-7.5 9.7Z" />
    </Icon>
  ),
  skills: (
    <Icon>
      <rect x="3.5" y="7.5" width="17" height="11.5" rx="2" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5" />
      <path d="M3.5 12.5h17" />
    </Icon>
  ),
  achievements: (
    <Icon>
      <path d="M8 4.5h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 6.5H5.5a2.5 2.5 0 0 0 2.6 3M16 6.5h2.5a2.5 2.5 0 0 1-2.6 3" />
      <path d="M12 13.5v3M9 19.5h6M10 16.5h4" />
    </Icon>
  ),
  fit: (
    <Icon>
      <path d="M5 8h3.2a2 2 0 1 1 3.6 0H15v3.2a2 2 0 1 1 0 3.6V19H5v-4.2a2 2 0 1 0 0-3.6Z" />
    </Icon>
  ),
};

function paragraphIcon(id: ParagraphId): ReactNode {
  return isGuidedParagraph(id) ? PARAGRAPH_ICONS[id] : ICONS.paragraph;
}

/** `data-nav-icon` value for the shared nav icon motions in globals.css. */
function paragraphIconKey(id: ParagraphId): string {
  return isGuidedParagraph(id) ? `letter-${id}` : "letter-custom";
}

/** Same stagger step as the resume sidebar's icons. */
const ICON_DELAY_STEP_MS = 35;

function status(done: boolean, skipped = false): SectionStatus {
  return skipped ? "skipped" : done ? "complete" : "not_started";
}

/** The letter's sidebar: the resume SectionNav's rows, switches, status
 * marks and drag handles, over the letter's steps. `drawer` renders it for
 * the mobile side menu; `collapsed` is the desktop icon-only rail. */
export function CoverLetterNav({
  active,
  onSelect,
  onAddParagraph,
  drawer = false,
  collapsed = false,
}: {
  active: LetterStepKey;
  onSelect: (key: LetterStepKey) => void;
  onAddParagraph: () => void;
  drawer?: boolean;
  collapsed?: boolean;
}) {
  const rail = collapsed && !drawer;
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
    <nav className={`flex flex-col gap-1 p-3 ${rail ? "px-2" : ""}`} aria-label="Cover letter sections">
      <Row
        icon={ICONS.details}
        iconKey="letter-details"
        label="Your details"
        active={active === "details"}
        drawer={drawer}
        rail={rail}
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
        iconKey="letter-recipient"
        iconDelay={ICON_DELAY_STEP_MS}
        label="Recipient"
        active={active === "recipient"}
        drawer={drawer}
        rail={rail}
        onClick={() => onSelect("recipient")}
        trailing={<StatusMark status={status(isRecipientComplete(letter))} drawer={drawer} />}
      />
      <Row
        icon={ICONS.greeting}
        iconKey="letter-greeting"
        iconDelay={ICON_DELAY_STEP_MS * 2}
        label="Greeting"
        active={active === "greeting"}
        drawer={drawer}
        rail={rail}
        onClick={() => onSelect("greeting")}
        trailing={<StatusMark status={status(isGreetingComplete(letter))} drawer={drawer} />}
      />

      <RowDivider group drawer />
      {rail ? null : (
        <span className="px-3 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          Body
        </span>
      )}
      {letter.paragraphs.map((paragraph, index) => {
        const label = paragraphLabel(paragraph);
        const skipped = Boolean(paragraph.skipped);
        return (
          <Fragment key={paragraph.id}>
            <Row
              icon={paragraphIcon(paragraph.id)}
              iconKey={paragraphIconKey(paragraph.id)}
              iconDelay={ICON_DELAY_STEP_MS * (3 + index)}
              label={label}
              active={active === paragraph.id}
              drawer={drawer}
              rail={rail}
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
        aria-label={rail ? "Add paragraph" : undefined}
        title={rail ? "Add paragraph" : undefined}
        className="mx-1 mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] py-2 text-[12.5px] font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] active:scale-[0.98]"
      >
        <span aria-hidden="true">+</span>
        {rail ? null : " Add paragraph"}
      </button>

      <RowDivider group drawer />
      <Row
        icon={ICONS.closing}
        iconKey="letter-closing"
        iconDelay={ICON_DELAY_STEP_MS * (3 + letter.paragraphs.length)}
        label="Closing"
        active={active === "closing"}
        drawer={drawer}
        rail={rail}
        onClick={() => onSelect("closing")}
        trailing={<StatusMark status={status(isClosingComplete(letter))} drawer={drawer} />}
      />

      <RowDivider group drawer />
      <div
        className={
          drawer
            ? "pt-1"
            : `sticky bottom-0 z-[9] -mb-3 mt-1 bg-[var(--color-surface)] pb-3 pt-2 ${rail ? "-mx-2 px-2" : "-mx-3 px-3"}`
        }
      >
        <Row label="Download" active={active === "export"} drawer={drawer} rail={rail} cta onClick={() => onSelect("export")} />
      </div>
    </nav>
  );
}

function Row({
  icon,
  iconKey,
  iconDelay = 0,
  label,
  active,
  drawer,
  rail = false,
  cta = false,
  skipped = false,
  dragging = false,
  dropped = false,
  onClick,
  trailing,
  rowRef,
}: {
  icon?: ReactNode;
  /** Picks the icon's hover / active motion in globals.css. */
  iconKey?: string;
  /** Entry stagger, as in the resume sidebar. */
  iconDelay?: number;
  label: string;
  active: boolean;
  drawer: boolean;
  /** Collapsed desktop sidebar: icon only, label kept as the accessible name. */
  rail?: boolean;
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
      className={`group/navrow flex w-full shrink-0 items-center justify-between gap-2 rounded-lg ${cta || rail ? "" : "pr-2"} text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200 ease-out ${
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
        aria-label={rail ? label : undefined}
        title={rail ? label : undefined}
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left ${cta ? "justify-center" : ""} ${
          rail ? "justify-center gap-0 px-0" : ""
        }`}
      >
        {/* Download is text-only while open; the rail has no label, so it
            keeps the icon there. */}
        {cta && rail ? (
          <span
            data-nav-icon="export"
            data-active={active ? "true" : undefined}
            className="-my-1 flex shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <FilledDownloadIcon />
          </span>
        ) : icon ? (
          <span
            data-nav-icon={iconKey}
            data-active={active || dragging ? "true" : undefined}
            className={`nav-section-icon ${skipped ? "opacity-50" : ""}`}
            style={{ "--nav-icon-delay": `${iconDelay}ms` } as CSSProperties}
            aria-hidden="true"
          >
            <span className="nav-icon-motion">{icon}</span>
          </span>
        ) : null}
        <span
          className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap transition-[opacity,max-width] duration-300 ease-out ${
            rail ? "max-w-0 opacity-0" : ""
          } ${skipped && !drawer ? "text-[var(--color-ink-faint)]" : ""}`}
        >
          {label}
        </span>
      </button>
      {rail ? null : trailing}
    </div>
  );
}
