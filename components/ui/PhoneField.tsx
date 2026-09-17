"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

const VISIBLE_ROWS = 7;
const ROW_PX = 36;
const LIST_MAX_HEIGHT_PX = VISIBLE_ROWS * ROW_PX;

function ChevronDown() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Country-code + national number as one control. The code picker is a custom
 * listbox (native <select> menus can't be capped) that shows seven rows and
 * scrolls the rest. */
export function PhoneField({
  id,
  invalid,
  countryIso2,
  countries,
  onCountryIso2Change,
  phone,
  onPhoneChange,
  onBlur,
}: {
  id?: string;
  invalid?: boolean;
  countryIso2: string;
  countries: Array<{ iso2: string; dialCode: string; name: string }>;
  onCountryIso2Change: (iso2: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const selected = countries.find((country) => country.iso2 === countryIso2) ?? countries[0];
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const listboxId = useId();

  const selectedIndex = Math.max(
    0,
    countries.findIndex((country) => country.iso2 === selected.iso2),
  );

  const updateMenuPos = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 280), Math.max(160, window.innerWidth - 16));
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < LIST_MAX_HEIGHT_PX + 16;
    const top = openUp ? Math.max(8, rect.top - LIST_MAX_HEIGHT_PX - 4) : rect.bottom + 4;
    setMenuPos({
      top,
      left,
      width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    setHighlight(selectedIndex);
    updateMenuPos();
    window.addEventListener("resize", updateMenuPos);
    window.addEventListener("scroll", updateMenuPos, true);
    return () => {
      window.removeEventListener("resize", updateMenuPos);
      window.removeEventListener("scroll", updateMenuPos, true);
    };
  }, [open, selectedIndex, updateMenuPos]);

  useEffect(() => {
    if (!open) return;
    const option = listRef.current?.querySelector<HTMLElement>('[data-highlighted="true"]');
        option?.scrollIntoView?.({ block: "nearest" });
  }, [open, highlight]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    return () => clearTimeout(typeaheadTimer.current);
  }, []);

  function selectCountry(iso2: string) {
    onCountryIso2Change(iso2);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function moveHighlight(next: number) {
    const clamped = Math.max(0, Math.min(countries.length - 1, next));
    setHighlight(clamped);
  }

  function handleTypeahead(key: string) {
    typeaheadRef.current += key.toLowerCase();
    clearTimeout(typeaheadTimer.current);
    typeaheadTimer.current = setTimeout(() => {
      typeaheadRef.current = "";
    }, 400);
    const query = typeaheadRef.current;
    const match = countries.findIndex(
      (country) =>
        country.name.toLowerCase().startsWith(query) ||
        country.iso2.toLowerCase().startsWith(query) ||
        country.dialCode.replace("+", "").startsWith(query.replace("+", "")),
    );
    if (match >= 0) setHighlight(match);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(highlight + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(highlight - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      moveHighlight(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      moveHighlight(countries.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const country = countries[highlight];
      if (country) selectCountry(country.iso2);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      handleTypeahead(event.key);
    }
  }

  return (
    <div
      data-field-control=""
      className={`flex rounded-lg border bg-[var(--color-surface)] transition duration-150 ease-out focus-within:ring-2 ${
        invalid
          ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
          : "border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-[var(--color-accent)]/15"
      }`}
    >
      <div className="relative shrink-0 border-r border-[var(--color-border)]">
        <button
          ref={buttonRef}
          type="button"
          aria-label="Phone country code"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={onTriggerKeyDown}
          className="flex h-full w-[6.25rem] items-center justify-between gap-0.5 bg-transparent py-2 pl-2 pr-1.5 text-left text-[13px] text-[var(--color-ink)] outline-none"
        >
          <span className="min-w-0 truncate">
            {selected.iso2} {selected.dialCode}
          </span>
          <ChevronDown />
        </button>
        {open &&
          menuPos &&
          createPortal(
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label="Country codes"
              style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width, maxHeight: LIST_MAX_HEIGHT_PX }}
              className="fixed z-[80] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-card"
            >
              {countries.map((country, index) => {
                const isSelected = country.iso2 === selected.iso2;
                const isHighlighted = index === highlight;
                return (
                  <li
                    key={country.iso2}
                    role="option"
                    aria-selected={isSelected}
                    data-highlighted={isHighlighted || undefined}
                    style={{ height: ROW_PX }}
                    className={`flex cursor-pointer items-center gap-2 px-3 text-[13px] ${
                      isHighlighted ? "bg-[var(--color-accent-tint)] text-[var(--color-accent)]" : "text-[var(--color-ink)]"
                    }`}
                    onMouseEnter={() => setHighlight(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCountry(country.iso2)}
                  >
                    <span className="w-10 shrink-0 font-medium">{country.iso2}</span>
                    <span className="w-12 shrink-0 text-[var(--color-ink-soft)]">{country.dialCode}</span>
                    <span className="min-w-0 truncate">{country.name}</span>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )}
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        onBlur={onBlur}
        placeholder="5550100199"
        aria-invalid={invalid || undefined}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-[13.5px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
      />
    </div>
  );
}
