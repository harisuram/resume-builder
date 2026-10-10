"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DeleteIconButton } from "@/components/ui/DeleteIconButton";
import { FieldGroup, TextArea, TextInput } from "@/components/ui/Field";
import { SectionFormHeader } from "@/components/builder/sections/SectionFormHeader";
import { BasicInfoForm } from "@/components/builder/sections/BasicInfoForm";
import { AI_BACKOFF_MS, AI_LIMITED_UNTIL_KEY, AI_MESSAGES, AiLimitError, enhanceCoverLetterParagraph } from "@/lib/ai";
import {
  DEFAULT_GREETING,
  greetingFor,
  isGuidedParagraph,
  LETTER_PARAGRAPH_META,
  MAX_LETTER_FIELDS,
  MAX_LETTER_PARAGRAPH_LENGTH,
  paragraphLabel,
  SIGN_OFFS,
  todayLabel,
} from "@/lib/coverLetter";
import { useCoverLetterStore } from "@/lib/coverLetterStore";
import { useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import type { LetterParagraph } from "@/lib/types";

const CHIP =
  "rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-left text-[12px] text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)]/50 hover:text-[var(--color-ink)] active:scale-[0.98] aria-pressed:border-[var(--color-accent)] aria-pressed:bg-[var(--color-accent-tint)] aria-pressed:text-[var(--color-accent)]";

function Chips({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: string[];
  value?: string;
  onPick: (option: string) => void;
}) {
  // The same line can come from several places (a bullet repeated across
  // roles); offer it once.
  const unique = Array.from(new Set(options));
  if (unique.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-medium text-[var(--color-ink-faint)]">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {unique.map((option) => (
          <button
            key={option}
            type="button"
            className={`${CHIP} max-w-full`}
            aria-pressed={value === undefined ? undefined : value === option}
            onClick={() => onPick(option)}
          >
            <span className="line-clamp-2 break-words">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- details */

/** Your details are the resume's Basic info, edited in place: the letter's
 * header always matches the resume's. */
export function LetterDetailsForm() {
  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-tint)] px-3.5 py-2.5 text-[12.5px] leading-snug text-[var(--color-ink-soft)]">
        These come from your resume, so both documents match. Changes here update your resume too.
      </p>
      <BasicInfoForm />
    </div>
  );
}

/* -------------------------------------------------------------- recipient */

export function RecipientForm() {
  const letter = useCoverLetterStore((s) => s.letter);
  const update = useCoverLetterStore((s) => s.update);
  const addField = useCoverLetterStore((s) => s.addField);
  const updateField = useCoverLetterStore((s) => s.updateField);
  const removeField = useCoverLetterStore((s) => s.removeField);

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Recipient" help="Who you're writing to and the role you're applying for." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup label="Company" htmlFor="letter-company" required>
          <TextInput
            id="letter-company"
            value={letter.company}
            onChange={(e) => update({ company: e.target.value })}
            placeholder="Northwind"
            autoComplete="organization"
          />
        </FieldGroup>
        <FieldGroup label="Position you're applying for" htmlFor="letter-position" required>
          <TextInput
            id="letter-position"
            value={letter.position}
            onChange={(e) => update({ position: e.target.value })}
            placeholder="Senior Product Designer"
          />
        </FieldGroup>
        <FieldGroup label="Hiring manager's name" htmlFor="letter-recipient" hint="Optional — leave blank if you don't know it.">
          <TextInput
            id="letter-recipient"
            value={letter.recipientName}
            onChange={(e) => update({ recipientName: e.target.value })}
            placeholder="Dana Rivera"
          />
        </FieldGroup>
        <FieldGroup label="Their title" htmlFor="letter-recipient-title" hint="Optional">
          <TextInput
            id="letter-recipient-title"
            value={letter.recipientTitle}
            onChange={(e) => update({ recipientTitle: e.target.value })}
            placeholder="Head of Design"
          />
        </FieldGroup>
        <FieldGroup label="Company address" htmlFor="letter-address" hint="Optional — one line per address line.">
          <TextArea
            id="letter-address"
            rows={2}
            value={letter.companyAddress}
            onChange={(e) => update({ companyAddress: e.target.value })}
            placeholder={"1 Market Street\nSan Francisco, CA"}
          />
        </FieldGroup>
        <FieldGroup
          label="Date"
          htmlFor="letter-date"
          labelRight={
            letter.date !== todayLabel() ? (
              <button
                type="button"
                className="text-[11.5px] font-medium text-[var(--color-accent)] hover:underline"
                onClick={() => update({ date: todayLabel() })}
              >
                Use today
              </button>
            ) : undefined
          }
        >
          <TextInput id="letter-date" value={letter.date} onChange={(e) => update({ date: e.target.value })} />
        </FieldGroup>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-4">
        <div>
          <h3 className="text-[13.5px] font-semibold text-[var(--color-ink)]">Extra details</h3>
          <p className="mt-0.5 text-[12px] text-[var(--color-ink-soft)]">
            Optional lines printed under the subject, such as a job reference number.
          </p>
        </div>
        {letter.fields.map((field, index) => (
          <div key={index} className="grid grid-cols-[1fr_auto] items-end gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]">
            <FieldGroup label="Label" htmlFor={`letter-field-label-${index}`}>
              <TextInput
                id={`letter-field-label-${index}`}
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Job reference"
                className="w-full min-w-0"
              />
            </FieldGroup>
            <div className="col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto">
              <FieldGroup label="Value" htmlFor={`letter-field-value-${index}`}>
                <TextInput
                  id={`letter-field-value-${index}`}
                  value={field.value}
                  onChange={(e) => updateField(index, { value: e.target.value })}
                  placeholder="ENG-2041"
                  className="w-full min-w-0"
                />
              </FieldGroup>
            </div>
            <DeleteIconButton
              aria-label={`Remove ${field.label.trim() || "detail"}`}
              className="mb-1 h-9 w-9 max-sm:row-span-2 max-sm:self-center"
              onClick={() => removeField(index)}
            />
          </div>
        ))}
        {letter.fields.length < MAX_LETTER_FIELDS && (
          <Button type="button" variant="secondary" size="sm" className="self-start" onClick={addField}>
            + Add detail
          </Button>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- greeting */

export function GreetingForm() {
  const letter = useCoverLetterStore((s) => s.letter);
  const update = useCoverLetterStore((s) => s.update);
  const suggestions = Array.from(
    new Set(
      [
        letter.recipientName.trim() ? greetingFor(letter.recipientName) : "",
        DEFAULT_GREETING,
        letter.company.trim() ? `Dear ${letter.company.trim()} team,` : "",
        "Dear Recruitment Team,",
      ].filter(Boolean),
    ),
  );
  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader
        title="Greeting"
        help="Use the hiring manager's name when you know it — it reads warmer than a generic opener."
      />
      <FieldGroup label="Greeting" htmlFor="letter-greeting">
        <TextInput
          id="letter-greeting"
          value={letter.greeting}
          onChange={(e) => update({ greeting: e.target.value })}
          placeholder={DEFAULT_GREETING}
        />
      </FieldGroup>
      <Chips label="Suggestions" options={suggestions} value={letter.greeting} onPick={(greeting) => update({ greeting })} />
    </div>
  );
}

/* -------------------------------------------------------------------- AI */

function useAiAvailable() {
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    const until = Number(localStorage.getItem(AI_LIMITED_UNTIL_KEY) ?? 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailable(Date.now() >= until);
  }, []);
  return [available, setAvailable] as const;
}

/** The resume builder's AI rewrite button, for one letter paragraph. */
function EnhanceButton({ section, text, onResult }: { section: string; text: string; onResult: (text: string) => void }) {
  const position = useCoverLetterStore((s) => s.letter.position);
  const company = useCoverLetterStore((s) => s.letter.company);
  const [available, setAvailable] = useAiAvailable();
  const [working, setWorking] = useState(false);
  if (!available) return null;

  async function enhance() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setWorking(true);
    try {
      onResult(
        await enhanceCoverLetterParagraph({
          section,
          text: trimmed,
          position: position.trim() || undefined,
          company: company.trim() || undefined,
        }),
      );
    } catch (err) {
      if (err instanceof AiLimitError) {
        localStorage.setItem(AI_LIMITED_UNTIL_KEY, String(Date.now() + AI_BACKOFF_MS));
        setAvailable(false);
      }
      showToast(err instanceof Error ? err.message : AI_MESSAGES.unavailable);
    } finally {
      setWorking(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="self-start"
      disabled={working || !text.trim()}
      onClick={enhance}
    >
      {working ? "Enhancing…" : "✨ Enhance with AI"}
    </Button>
  );
}

/* -------------------------------------------------------------- paragraph */

/** Lines from the resume worth weaving into a paragraph, by paragraph. */
function useResumeSuggestions(paragraph: LetterParagraph): { label: string; options: string[] } | null {
  const sections = useBuilderStore((s) => s.sections);
  if (paragraph.id === "skills") {
    const roles = (sections.experience ?? [])
      .filter((e) => e.role.trim() && e.company.trim())
      .map((e) => `As ${e.role.trim()} at ${e.company.trim()}, `);
    const skills = (sections.skills ?? []).filter(Boolean).slice(0, 8);
    const options = [...roles.slice(0, 3), ...(skills.length ? [`My core skills include ${skills.join(", ")}.`] : [])];
    return { label: "From your resume — tap to add", options };
  }
  if (paragraph.id === "achievements") {
    const options = [
      ...(sections.keyAchievements ?? []),
      ...(sections.experience ?? []).flatMap((e) => e.bullets),
    ]
      .map((line) => line.trim())
      .filter((line, i, all) => line && all.indexOf(line) === i)
      .slice(0, 6);
    return { label: "From your resume — tap to add", options };
  }
  return null;
}

function appendSentence(text: string, addition: string): string {
  const base = text.trimEnd();
  if (!base) return addition;
  return /\s$/.test(text) || addition.startsWith(",") ? `${text}${addition}` : `${base} ${addition}`;
}

export function ParagraphForm({ paragraph, onRemoved }: { paragraph: LetterParagraph; onRemoved: () => void }) {
  const updateParagraph = useCoverLetterStore((s) => s.updateParagraph);
  const renameParagraph = useCoverLetterStore((s) => s.renameParagraph);
  const removeParagraph = useCoverLetterStore((s) => s.removeParagraph);
  const toggleSkip = useCoverLetterStore((s) => s.toggleSkipParagraph);
  const suggestions = useResumeSuggestions(paragraph);
  const guided = isGuidedParagraph(paragraph.id);
  const meta = guided ? LETTER_PARAGRAPH_META[paragraph.id as keyof typeof LETTER_PARAGRAPH_META] : null;
  const label = paragraphLabel(paragraph);
  const fieldId = `letter-paragraph-${paragraph.id}`;

  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader
        title={label}
        help={meta?.help ?? "Anything else worth saying — a referral, relocation plans, or your availability."}
      />
      {paragraph.skipped ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-4">
          <p className="text-[13px] text-[var(--color-ink-soft)]">This paragraph is switched off and won&rsquo;t appear in your letter.</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => toggleSkip(paragraph.id)}>
            Include {label}
          </Button>
        </div>
      ) : (
        <>
          {!guided && (
            <FieldGroup label="Paragraph name" htmlFor={`${fieldId}-label`} hint="Only shown in the builder — it isn't printed.">
              <TextInput
                id={`${fieldId}-label`}
                value={paragraph.label ?? ""}
                onChange={(e) => renameParagraph(paragraph.id, e.target.value)}
                placeholder="Referral"
              />
            </FieldGroup>
          )}
          <FieldGroup
            label="Paragraph"
            htmlFor={fieldId}
            hint={`${paragraph.text.length} / ${MAX_LETTER_PARAGRAPH_LENGTH} characters`}
          >
            <TextArea
              id={fieldId}
              rows={7}
              value={paragraph.text}
              onChange={(e) => updateParagraph(paragraph.id, e.target.value)}
              placeholder={meta?.placeholder ?? "My colleague Sam Lee, who leads your platform team, suggested I apply."}
              maxLength={MAX_LETTER_PARAGRAPH_LENGTH}
            />
          </FieldGroup>
          <EnhanceButton section={label} text={paragraph.text} onResult={(text) => updateParagraph(paragraph.id, text)} />
          {suggestions && (
            <Chips
              label={suggestions.label}
              options={suggestions.options}
              onPick={(line) =>
                updateParagraph(paragraph.id, appendSentence(paragraph.text, line).slice(0, MAX_LETTER_PARAGRAPH_LENGTH))
              }
            />
          )}
          {!guided && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start text-red-600 hover:text-red-700"
              onClick={() => {
                removeParagraph(paragraph.id);
                onRemoved();
              }}
            >
              Remove this paragraph
            </Button>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- closing */

export function ClosingForm() {
  const letter = useCoverLetterStore((s) => s.letter);
  const update = useCoverLetterStore((s) => s.update);
  const name = useBuilderStore((s) => s.basicInfo.name);
  return (
    <div className="flex flex-col gap-5">
      <SectionFormHeader title="Closing" help="Thank them, invite a next step, and sign off." />
      <FieldGroup
        label="Closing statement"
        htmlFor="letter-closing"
        hint={`Optional · ${letter.closing.length} / ${MAX_LETTER_PARAGRAPH_LENGTH} characters`}
      >
        <TextArea
          id="letter-closing"
          rows={4}
          value={letter.closing}
          onChange={(e) => update({ closing: e.target.value })}
          placeholder="Thank you for your time. I'd welcome the chance to talk about how I could help your team."
          maxLength={MAX_LETTER_PARAGRAPH_LENGTH}
        />
      </FieldGroup>
      <EnhanceButton section="Closing statement" text={letter.closing} onResult={(closing) => update({ closing })} />
      <FieldGroup label="Sign-off" htmlFor="letter-signoff" required>
        <TextInput
          id="letter-signoff"
          value={letter.signOff}
          onChange={(e) => update({ signOff: e.target.value })}
          placeholder={SIGN_OFFS[0]}
        />
      </FieldGroup>
      <Chips label="Common sign-offs" options={[...SIGN_OFFS]} value={letter.signOff} onPick={(signOff) => update({ signOff })} />
      <p className="text-[12.5px] text-[var(--color-ink-soft)]">
        Signed as <span className="font-medium text-[var(--color-ink)]">{name.trim() || "your name from Your details"}</span>.
      </p>
    </div>
  );
}
