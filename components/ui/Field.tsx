import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const CONTROL_CLASSES =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13.5px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] transition duration-150 ease-out outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15";

function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-[12px] font-medium tracking-wide text-[var(--color-ink-soft)] ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL_CLASSES} ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${CONTROL_CLASSES} resize-y ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${CONTROL_CLASSES} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function FieldGroup({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  /** Shown instead of the hint, styled as a validation error. Meant to be
   * paired with an onBlur-driven "touched" flag so it only appears once the
   * user has actually left the field. */
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-[11.5px] text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-[11.5px] text-[var(--color-ink-faint)]">{hint}</p>
      )}
    </div>
  );
}
