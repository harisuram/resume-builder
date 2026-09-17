import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const CONTROL_BASE =
  "w-full rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-[13.5px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] transition duration-150 ease-out outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

const VALID_BORDER =
  "border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/15";

const INVALID_BORDER = "border-red-500 focus:border-red-500 focus:ring-red-500/20";

function controlClassName(className: string, invalid?: boolean) {
  return `${CONTROL_BASE} ${invalid ? INVALID_BORDER : VALID_BORDER} ${className}`;
}

function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-[12px] font-medium tracking-wide text-[var(--color-ink-soft)] ${className}`}
      {...props}
    />
  );
}

type InvalidProp = { invalid?: boolean };

export function TextInput({
  className = "",
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & InvalidProp) {
  return <input className={controlClassName(className, invalid)} aria-invalid={invalid || undefined} {...props} />;
}

export function TextArea({
  className = "",
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & InvalidProp) {
  return (
    <textarea
      className={`${controlClassName(className, invalid)} resize-y`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({
  className = "",
  invalid,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & InvalidProp) {
  return (
    <select className={controlClassName(className, invalid)} aria-invalid={invalid || undefined} {...props}>
      {children}
    </select>
  );
}

export function FieldGroup({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
  labelRight,
}: {
  label: string;
  hint?: string;
  /** Shown instead of the hint, styled as a validation error. Meant to be
   * paired with an onBlur-driven "touched" flag so it only appears once the
   * user has actually left the field. */
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
  /** Sits on the right of the label row — used for compact controls like
   * the Present checkbox on a date field. */
  labelRight?: ReactNode;
}) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        {required ? (
          <span className="text-[12px] text-red-600" aria-hidden="true">
            *
          </span>
        ) : null}
        {labelRight ? <div className="ml-auto">{labelRight}</div> : null}
      </div>
      {children}
      {error ? (
        <p role="alert" id={errorId} className="mt-1 text-[11.5px] text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-[11.5px] text-[var(--color-ink-faint)]">{hint}</p>
      )}
    </div>
  );
}

export { PhoneField } from "./PhoneField";
