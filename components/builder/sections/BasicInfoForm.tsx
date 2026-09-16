"use client";

import { FieldGroup, PhoneField, TextInput } from "@/components/ui/Field";
import { COUNTRY_CODES, DEFAULT_DIAL_CODE } from "@/lib/countryCodes";
import { useTouchedFields } from "@/lib/useTouchedFields";
import { useBuilderStore } from "@/lib/store";
import { getBasicInfoErrors, MAX_FIELD_LENGTH, sanitizePhoneDigits } from "@/lib/validation";

function iso2ForDialCode(dialCode: string): string {
  return COUNTRY_CODES.find((country) => country.dialCode === dialCode)?.iso2 ?? "US";
}

export function BasicInfoForm() {
  const basicInfo = useBuilderStore((s) => s.basicInfo);
  const updateBasicInfo = useBuilderStore((s) => s.updateBasicInfo);
  const updateLinks = useBuilderStore((s) => s.updateLinks);
  const { touch, errorFor } = useTouchedFields();

  const errors = getBasicInfoErrors(basicInfo);
  const nameError = errorFor("name", errors.name);
  const emailError = errorFor("email", errors.email);
  const phoneError = errorFor("phone", errors.phone);
  const locationError = errorFor("location", errors.location);
  const linkedinError = errorFor("linkedin", errors.links.linkedin);
  const githubError = errorFor("github", errors.links.github);
  const portfolioError = errorFor("portfolio", errors.links.portfolio);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[20px] font-semibold text-[var(--color-ink)]">Basic info</h2>
        <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
          The only required step — everything after this is optional.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Full name" htmlFor="name" required error={nameError}>
          <TextInput
            id="name"
            value={basicInfo.name}
            onChange={(e) => updateBasicInfo({ name: e.target.value })}
            onBlur={touch("name")}
            placeholder="Jordan Lee"
            autoComplete="name"
            maxLength={MAX_FIELD_LENGTH}
            invalid={Boolean(nameError)}
          />
        </FieldGroup>
        <FieldGroup label="Email" htmlFor="email" required error={emailError}>
          <TextInput
            id="email"
            type="email"
            value={basicInfo.email}
            onChange={(e) => updateBasicInfo({ email: e.target.value })}
            onBlur={touch("email")}
            placeholder="jordan@email.com"
            autoComplete="email"
            maxLength={MAX_FIELD_LENGTH}
            invalid={Boolean(emailError)}
          />
        </FieldGroup>
        <FieldGroup label="Phone" htmlFor="phone" error={phoneError}>
          <PhoneField
            id="phone"
            invalid={Boolean(phoneError)}
            countryIso2={iso2ForDialCode(basicInfo.phoneCountryCode ?? DEFAULT_DIAL_CODE)}
            countries={COUNTRY_CODES}
            onCountryIso2Change={(iso2) => {
              const country = COUNTRY_CODES.find((item) => item.iso2 === iso2);
              if (country) updateBasicInfo({ phoneCountryCode: country.dialCode });
            }}
            phone={basicInfo.phone}
            onPhoneChange={(value) => updateBasicInfo({ phone: sanitizePhoneDigits(value) })}
            onBlur={touch("phone")}
          />
        </FieldGroup>
        <FieldGroup label="Location" htmlFor="location" required error={locationError}>
          <TextInput
            id="location"
            value={basicInfo.location}
            onChange={(e) => updateBasicInfo({ location: e.target.value })}
            onBlur={touch("location")}
            placeholder="Austin, TX"
            autoComplete="address-level2"
            maxLength={MAX_FIELD_LENGTH}
            invalid={Boolean(locationError)}
          />
        </FieldGroup>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium tracking-wide text-[var(--color-ink-soft)]">Links (optional)</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldGroup label="LinkedIn" error={linkedinError}>
            <TextInput
              value={basicInfo.links.linkedin ?? ""}
              onChange={(e) => updateLinks({ linkedin: e.target.value })}
              onBlur={touch("linkedin")}
              placeholder="linkedin.com/in/jordan"
              maxLength={MAX_FIELD_LENGTH}
              invalid={Boolean(linkedinError)}
            />
          </FieldGroup>
          <FieldGroup label="GitHub" error={githubError}>
            <TextInput
              value={basicInfo.links.github ?? ""}
              onChange={(e) => updateLinks({ github: e.target.value })}
              onBlur={touch("github")}
              placeholder="github.com/jordan"
              maxLength={MAX_FIELD_LENGTH}
              invalid={Boolean(githubError)}
            />
          </FieldGroup>
          <FieldGroup label="Portfolio" error={portfolioError}>
            <TextInput
              value={basicInfo.links.portfolio ?? ""}
              onChange={(e) => updateLinks({ portfolio: e.target.value })}
              onBlur={touch("portfolio")}
              placeholder="jordanlee.dev"
              maxLength={MAX_FIELD_LENGTH}
              invalid={Boolean(portfolioError)}
            />
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}
