"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChipInput } from "@/components/ui/ChipInput";
import { TextInput } from "@/components/ui/Field";
import { SKILL_CATALOG } from "@/lib/catalogs";
import { MAX_SKILL_GROUP_TITLE_LENGTH, MAX_SKILL_GROUPS } from "@/lib/skillGroups";
import { useBuilderStore } from "@/lib/store";
import type { SkillGroup, SkillsLayout } from "@/lib/types";
import { MAX_CHIP_LENGTH } from "@/lib/validation";
import { ItemCard, useFocusNewIndex } from "./ItemCard";
import { SectionFormHeader } from "./SectionFormHeader";
import { SkippedNotice } from "./SkippedNotice";

const LIST_PLACEHOLDER = "Add a skill, press Enter";
const GROUP_PLACEHOLDER = "Add a skill to this group, press Enter";
/** Shown in place of an empty group list (after Clear), so grouped mode
 * always has a group to type into. Never written until the user edits it. */
const NO_GROUPS: SkillGroup[] = [{ title: "", skills: [] }];
const GROUP_MOVE_MS = 280;

let nextGroupSerial = 0;
function nextGroupId() {
  nextGroupSerial += 1;
  return `skill-group-${nextGroupSerial}`;
}

const LAYOUTS: { value: SkillsLayout; label: string }[] = [
  { value: "list", label: "Simple list" },
  { value: "grouped", label: "Grouped" },
];

export function SkillsForm() {
  const status = useBuilderStore((s) => s.sectionStatus.skills) ?? "not_started";
  const layout = useBuilderStore((s) => s.skillsLayout);
  const setSkillsLayout = useBuilderStore((s) => s.setSkillsLayout);
  const skipped = status === "skipped";

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader
        title="Skills"
        help="Tools, methods, and systems — software, data, IT, trades, clinical, and more."
      />
      {skipped ? (
        <SkippedNotice label="Skills" sectionKey="skills" />
      ) : (
        <>
          <LayoutToggle value={layout} onChange={setSkillsLayout} />
          {layout === "grouped" ? <SkillGroupsEditor /> : <SkillsList />}
        </>
      )}
    </div>
  );
}

/** Two-way switch. Full width on phones so each half is an easy tap target;
 * sized to its labels from sm up. */
function LayoutToggle({ value, onChange }: { value: SkillsLayout; onChange: (value: SkillsLayout) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="radiogroup"
        aria-label="Skills layout"
        className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 sm:inline-grid sm:self-start"
      >
        {LAYOUTS.map((option) => {
          const checked = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(option.value)}
              className={`min-h-11 rounded-md px-4 text-[13px] font-medium transition duration-150 ease-out md:min-h-9 ${
                checked
                  ? "bg-[var(--color-accent-tint)] text-[var(--color-accent)]"
                  : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-[12px] text-[var(--color-ink-faint)]">
        {value === "grouped"
          ? "Each group prints as one line, like “Frontend: React, TypeScript”."
          : "All skills print together. Switch to Grouped to sort them under titles."}
      </p>
    </div>
  );
}

function SkillsList() {
  const values = useBuilderStore((s) => s.sections.skills) ?? [];
  const setSkills = useBuilderStore((s) => s.setSkills);
  return (
    <ChipInput
      values={values}
      onChange={setSkills}
      placeholder={LIST_PLACEHOLDER}
      maxLength={MAX_CHIP_LENGTH}
      itemLabel="skill"
      suggestions={SKILL_CATALOG}
    />
  );
}

function SkillGroupsEditor() {
  const saved = useBuilderStore((s) => s.skillGroups);
  const setSkillGroups = useBuilderStore((s) => s.setSkillGroups);
  const groups = saved.length > 0 ? saved : NO_GROUPS;
  const { focusIndex, focusNew } = useFocusNewIndex();
  // Phones show one group open at a time; from md every group is open and
  // this is ignored (see SkillGroupCard).
  const [openIndex, setOpenIndex] = useState(0);
  const [ids, setIds] = useState<string[]>(() => groups.map(() => nextGroupId()));
  const listRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, number>());
  const orderSeen = useRef("");
  const atLimit = groups.length >= MAX_SKILL_GROUPS;

  // Clear, import, or a saved resume can change the group count without
  // going through add/remove. Keep one stable id per group so a move can
  // animate the same card into its new slot.
  if (ids.length !== groups.length) {
    setIds(ids.length < groups.length
      ? [...ids, ...Array.from({ length: groups.length - ids.length }, () => nextGroupId())]
      : ids.slice(0, groups.length));
  }

  function update(index: number, patch: Partial<SkillGroup>) {
    setSkillGroups(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  }

  function remove(index: number) {
    setIds((current) => current.filter((_, i) => i !== index));
    setSkillGroups(groups.filter((_, i) => i !== index));
    setOpenIndex((open) => (open > index ? open - 1 : open === index ? Math.max(0, index - 1) : open));
  }

  function move(index: number, to: number) {
    if (to < 0 || to >= groups.length) return;
    const next = [...groups];
    [next[index], next[to]] = [next[to], next[index]];
    setIds((current) => {
      const order = [...current];
      [order[index], order[to]] = [order[to], order[index]];
      return order;
    });
    setSkillGroups(next);
    if (openIndex === index) setOpenIndex(to);
    else if (openIndex === to) setOpenIndex(index);
  }

  function add() {
    if (atLimit) return;
    focusNew(groups.length);
    setOpenIndex(groups.length);
    setIds((current) => [...current, nextGroupId()]);
    setSkillGroups([...groups, { title: "", skills: [] }]);
  }

  const orderKey = ids.join("\0");
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduce =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const orderChanged = orderSeen.current !== "" && orderSeen.current !== orderKey;
    const nextPositions = new Map<string, number>();
    for (const node of list.children) {
      if (!(node instanceof HTMLElement)) continue;
      const id = node.dataset.groupId;
      if (!id) continue;
      const top = node.getBoundingClientRect().top;
      const prev = positions.current.get(id);
      if (orderChanged && !reduce && prev != null && Math.abs(prev - top) > 1 && typeof node.animate === "function") {
        node.animate([{ transform: `translateY(${prev - top}px)` }, { transform: "translateY(0)" }], {
          duration: GROUP_MOVE_MS,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        });
      }
      nextPositions.set(id, top);
    }
    positions.current = nextPositions;
    orderSeen.current = orderKey;
  }, [orderKey, openIndex]);

  return (
    <>
      <div ref={listRef} className="flex flex-col gap-3">
        {groups.map((group, i) => (
          <div key={ids[i] ?? i} data-group-id={ids[i]} className="min-w-0">
          <SkillGroupCard
            index={i}
            count={groups.length}
            group={group}
            taken={groups.flatMap((other, j) => (j === i ? [] : other.skills))}
            open={i === openIndex}
            autoFocus={i === focusIndex}
            onToggle={() => setOpenIndex(i === openIndex ? -1 : i)}
            onChange={(patch) => update(i, patch)}
            onRemove={() => remove(i)}
            onMove={(to) => move(i, to)}
          />
          </div>
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="min-h-11 w-full sm:w-auto sm:self-start md:min-h-0"
        onClick={add}
        disabled={atLimit}
      >
        + Add group
      </Button>
      {atLimit ? (
        <p className="text-[12px] text-[var(--color-ink-faint)]">You can have up to {MAX_SKILL_GROUPS} groups.</p>
      ) : null}
    </>
  );
}

function SkillGroupCard({
  index,
  count,
  group,
  taken,
  open,
  autoFocus,
  onToggle,
  onChange,
  onRemove,
  onMove,
}: {
  index: number;
  count: number;
  group: SkillGroup;
  taken: string[];
  open: boolean;
  autoFocus: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<SkillGroup>) => void;
  onRemove: () => void;
  onMove: (to: number) => void;
}) {
  const titleId = `skill-group-${index}-title`;
  const bodyId = `skill-group-${index}-body`;
  const name = group.title.trim() || `Group ${index + 1}`;
  const skillCount = `${group.skills.length} ${group.skills.length === 1 ? "skill" : "skills"}`;

  return (
    <ItemCard onRemove={onRemove} autoFocus={autoFocus} removeLabel={`Remove group ${name}`}>
      {/* Phone-only summary row. The body eases open and shut; from md every
          group stays open and the row is hidden. */}
      <div className="min-w-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left md:hidden"
      >
        <span className="min-w-0 truncate text-[14px] font-semibold text-[var(--color-ink)]">{name}</span>
        <span className="flex shrink-0 items-center gap-2 text-[12px] text-[var(--color-ink-faint)]">
          {skillCount}
          <svg
            viewBox="0 0 16 16"
            className={`h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div
        id={bodyId}
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "max-md:grid-rows-[0fr] md:grid-rows-[1fr]"
        }`}
      >
      <div className={`min-h-0 overflow-hidden ${open ? "" : "max-md:pointer-events-none"}`}>
      <div className="grid gap-3 max-md:pt-3">
        <div>
          <label htmlFor={titleId} className="mb-1.5 block text-[12px] font-medium tracking-wide text-[var(--color-ink-soft)]">
            Group title
          </label>
          <TextInput
            id={titleId}
            value={group.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. Frontend"
            maxLength={MAX_SKILL_GROUP_TITLE_LENGTH}
          />
        </div>
        <ChipInput
          values={group.skills}
          onChange={(skills) => onChange({ skills })}
          placeholder={GROUP_PLACEHOLDER}
          maxLength={MAX_CHIP_LENGTH}
          itemLabel="skill"
          suggestions={SKILL_CATALOG}
          taken={taken}
          takenMessage="That skill is already in another group."
        />
        {count > 1 ? (
          <div className="flex justify-end gap-2">
            <MoveButton label={`Move ${name} up`} disabled={index === 0} onClick={() => onMove(index - 1)} up />
            <MoveButton label={`Move ${name} down`} disabled={index === count - 1} onClick={() => onMove(index + 1)} />
          </div>
        ) : null}
      </div>
      </div>
      </div>
      </div>
    </ItemCard>
  );
}

function MoveButton({
  label,
  disabled,
  onClick,
  up = false,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  up?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
    >
      <svg viewBox="0 0 16 16" className={`h-4 w-4 ${up ? "rotate-180" : ""}`} aria-hidden="true">
        <path d="M8 3v10M4 9l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}
