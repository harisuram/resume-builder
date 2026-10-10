import { Text, View } from "@react-pdf/renderer";
import type { ComponentProps } from "react";
import { headerColor, type TemplateTheme } from "@/components/templates/shared/theme";
import type { LetterContent } from "@/lib/coverLetter";
import { pt, text, type Ink } from "./ResumePdfDocument";

/** Longest run the letter prints without a break opportunity. */
const MAX_UNBROKEN = 24;

/** Where react-pdf may break a word. fonts.ts turns hyphenation off for the
 * whole PDF so lines break as they do in the HTML, which leaves a run with no
 * spaces — a URL, an email, a long test string — nowhere to wrap: it ran off
 * the right edge of the page. Ordinary words stay whole; an overlong run is
 * split after URL punctuation where it has some, then into fixed chunks. */
export function letterWordBreaks(word: string): string[] {
  if (word.length <= MAX_UNBROKEN) return [word];
  return word
    .split(/(?<=[/.\-_?&=@])/)
    .flatMap((part) => part.match(new RegExp(`.{1,${MAX_UNBROKEN}}`, "gu")) ?? [part]);
}

/** Text that wraps overlong runs instead of letting them overflow. */
function LetterText(props: ComponentProps<typeof Text>) {
  return <Text hyphenationCallback={letterWordBreaks} {...props} />;
}

/** The letter itself — date, recipient, subject, greeting, body, sign-off —
 * set where a layout would put the resume's sections, so the letter reads
 * as the same template as the resume. */
export function CoverLetterBody({
  letter,
  name,
  theme,
  ink,
}: {
  letter: LetterContent;
  name: string;
  theme: TemplateTheme;
  ink: Ink;
}) {
  const body = { ...text(12.5, 1.625), color: ink.strong };
  return (
    <View>
      {letter.date ? <LetterText style={{ ...text(12), color: ink.soft }}>{letter.date}</LetterText> : null}

      {letter.recipient.length > 0 && (
        <View style={{ marginTop: pt(letter.date ? 18 : 0) }}>
          {letter.recipient.map((line, i) => (
            <LetterText key={i} style={{ ...text(12.5), color: i === 0 ? ink.strong : ink.soft, fontWeight: i === 0 ? 600 : 400 }}>
              {line}
            </LetterText>
          ))}
        </View>
      )}

      {(letter.subject || letter.fields.length > 0) && (
        <View style={{ marginTop: pt(20), gap: pt(2) }}>
          {letter.subject ? (
            <LetterText style={{ ...text(13), fontWeight: 600, color: ink.light ? ink.strong : theme.accent }}>{letter.subject}</LetterText>
          ) : null}
          {letter.fields.map((field, i) => (
            <LetterText key={i} style={{ ...text(12), color: ink.soft }}>
              {field.label ? `${field.label}: ` : ""}
              {field.value}
            </LetterText>
          ))}
        </View>
      )}

      {letter.greeting ? <LetterText style={{ ...body, marginTop: pt(22) }}>{letter.greeting}</LetterText> : null}

      {letter.paragraphs.length > 0 && (
        <View style={{ marginTop: pt(12), gap: pt(12) }}>
          {letter.paragraphs.map((paragraph, i) => (
            <LetterText key={i} style={body}>
              {paragraph}
            </LetterText>
          ))}
        </View>
      )}

      {letter.closing ? <LetterText style={{ ...body, marginTop: pt(12) }}>{letter.closing}</LetterText> : null}

      {/* The sign-off and name stay together: a "Sincerely," alone at the
          foot of a page with the name overleaf reads as a mistake. */}
      <View wrap={false} style={{ marginTop: pt(24) }}>
        {letter.signOff ? <LetterText style={body}>{letter.signOff}</LetterText> : null}
        <LetterText style={{ ...text(14, 1.4), marginTop: pt(14), fontWeight: 600, color: ink.light ? ink.strong : headerColor(theme) }}>
          {name}
        </LetterText>
      </View>
    </View>
  );
}
