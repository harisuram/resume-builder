"use client";

import { useState } from "react";
import { FieldGroup, Select, TextInput } from "@/components/ui/Field";
import { COUNTRY_CODES, DEFAULT_DIAL_CODE } from "@/lib/countryCodes";
import { useBuilderStore } from "@/lib/store";
import { getBasicInfoErrors, MAX_FIELD_LENGTH, sanitizePhoneDigits } from "@/lib/validation";

type TouchedField = "name" | "email" | "phone" | "location" | "linkedin" | "github" | "portfolio";

export function BasicInfoForm() {
  const basicInfo = useBuilderStore((s) => s.basicInfo);
  const updateBasicInfo = useBuilderStore((s) => s.updateBasicInfo);
  const updateLinks = useBuilderStore((s) => s.updateLinks);
  const [touched, setTouched] = useState<Partial<Record<TouchedField, boolean>>>({});

  const errors = getBasicInfoErrors(basicInfo);
  const touch = (field: TouchedField) => () => setTouched((t) => ({ ...t, [field]: true }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[20px] font-semibold text-[var(--color-ink)]">Basic info</h2>
        <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
          The only required step — everything after this is optional.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Full name" htmlFor="name" error={touched.name ? errors.name : undefined}>
          <TextInput
            id="name"
            value={basicInfo.name}
            onChange={(e) => updateBasicInfo({ name: e.target.value })}
            onBlur={touch("name")}
            placeholder="Jordan Lee"
            autoComplete="name"
            maxLength={MAX_FIELD_LENGTH}
          />
        </FieldGroup>
        <FieldGroup label="Email" htmlFor="email" error={touched.email ? errors.email : undefined}>
          <TextInput
            id="email"
            type="email"
            value={basicInfo.email}
            onChange={(e) => updateBasicInfo({ email: e.target.value })}
            onBlur={touch("email")}
            placeholder="jordan@email.com"
            autoComplete="email"
            maxLength={MAX_FIELD_LENGTH}
          />
        </FieldGroup>
        <FieldGroup label="Phone" htmlFor="phone" error={touched.phone ? errors.phone : undefined}>
          <div className="flex gap-2">
            <Select
              aria-label="Phone country code"
              value={basicInfo.phoneCountryCode ?? DEFAULT_DIAL_CODE}
              onChange={(e) => updateBasicInfo({ phoneCountryCode: e.target.value })}
              className="w-[6.5rem] shrink-0"
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.iso2} value={country.dialCode}>
                  {country.dialCode} {country.iso2}
                </option>
              ))}
            </Select>
            <TextInput
              id="phone"
              type="tel"
              inputMode="numeric"
              value={basicInfo.phone}
              onChange={(e) => updateBasicInfo({ phone: sanitizePhoneDigits(e.target.value) })}
              onBlur={touch("phone")}
              placeholder="5550100199"
              autoComplete="tel-national"
            />
          </div>
        </FieldGroup>
        <FieldGroup label="Location" htmlFor="location" error={touched.location ? errors.location : undefined}>
          <TextInput
            id="location"
            value={basicInfo.location}
            onChange={(e) => updateBasicInfo({ location: e.target.value })}
            onBlur={touch("location")}
            placeholder="Austin, TX"
            autoComplete="address-level2"
            maxLength={MAX_FIELD_LENGTH}
          />
        </FieldGroup>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium tracking-wide text-[var(--color-ink-soft)]">Links (optional)</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldGroup label="LinkedIn" error={touched.linkedin ? errors.links.linkedin : undefined}>
            <TextInput
              value={basicInfo.links.linkedin ?? ""}
              onChange={(e) => updateLinks({ linkedin: e.target.value })}
              onBlur={touch("linkedin")}
              placeholder="linkedin.com/in/jordan"
              maxLength={MAX_FIELD_LENGTH}
            />
          </FieldGroup>
          <FieldGroup label="GitHub" error={touched.github ? errors.links.github : undefined}>
            <TextInput
              value={basicInfo.links.github ?? ""}
              onChange={(e) => updateLinks({ github: e.target.value })}
              onBlur={touch("github")}
              placeholder="github.com/jordan"
              maxLength={MAX_FIELD_LENGTH}
            />
          </FieldGroup>
          <FieldGroup label="Portfolio" error={touched.portfolio ? errors.links.portfolio : undefined}>
            <TextInput
              value={basicInfo.links.portfolio ?? ""}
              onChange={(e) => updateLinks({ portfolio: e.target.value })}
              onBlur={touch("portfolio")}
              placeholder="jordanlee.dev"
              maxLength={MAX_FIELD_LENGTH}
            />
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}
