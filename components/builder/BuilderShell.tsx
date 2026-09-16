"use client";

import { useEffect, useRef, useState } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { requestedTemplateId } from "@/components/templates/shared/theme";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { hasSavedResumeData, loadResumeData } from "@/lib/storage";
import { dismissBuilderTour, shouldOfferBuilderTour } from "@/lib/builderTour";
import { isBasicInfoComplete, hasBasicInfoContent, hasSectionContent, useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import { getSectionMeta } from "@/lib/persona";
import type { BasicInfo, SectionKey, SectionStatus } from "@/lib/types";
import { ToastHost } from "@/components/ui/Toast";
import { BasicInfoForm } from "./sections/BasicInfoForm";
import { CertificationsForm } from "./sections/CertificationsForm";
import { EducationForm } from "./sections/EducationForm";
import { ExperienceForm } from "./sections/ExperienceForm";
import { ExportSection } from "./sections/ExportSection";
import { HobbiesForm } from "./sections/HobbiesForm";
import { KeyAchievementsForm } from "./sections/KeyAchievementsForm";
import { LanguagesForm } from "./sections/LanguagesForm";
import { PatentsForm } from "./sections/PatentsForm";
import { PhotoForm } from "./sections/PhotoForm";
import { ProjectsForm } from "./sections/ProjectsForm";
import { SkillsForm } from "./sections/SkillsForm";
import { SoftSkillsForm } from "./sections/SoftSkillsForm";
import { AdditionalForm } from "./sections/AdditionalForm";
import { SummaryForm } from "./sections/SummaryForm";
import { Navbar } from "./Navbar";
import { BuilderTour } from "./BuilderTour";
import { getWizardOrder, type NavKey } from "./nav";
import { PreviewPane } from "./PreviewPane";
import { SectionFooterNav } from "./SectionFooterNav";
import { SectionNav } from "./SectionNav";

function stepLabel(key: NavKey): string {
  if (key === "basicInfo") return "Basic info";
  if (key === "photo") return "Photo";
  if (key === "export") return "Export";
  return getSectionMeta(key).label;
}

/** Steps with a slot below their Back/Next/Skip row — a named set rather
 * than "every step," so ad density doesn't scale with how many sections the
 * wizard happens to have. Photo / summary / skills / key achievements /
 * certifications share this with the trailing optional sections. */
const FOOTER_AD_STEPS = new Set<NavKey>([
  "photo",
  "summary",
  "skills",
  "keyAchievements",
  "certifications",
  "patents",
  "languages",
  "hobbies",
  "softSkills",
  "additional",
]);

/** Whether the current step has to be resolved (filled in, or explicitly
 * skipped) before "Next" will advance past it. Basic info has no skip
 * option, so it's gated on its required fields directly; the photo is
 * always optional; every other step must be either complete or skipped —
 * otherwise "Skip" would do nothing "Next" doesn't already do. */
function isContentSection(key: NavKey): key is SectionKey {
  return key !== "basicInfo" && key !== "photo" && key !== "export";
}

function isStepValid(key: NavKey, basicInfo: BasicInfo, sectionStatus: Record<string, SectionStatus>): boolean {
  if (key === "basicInfo") return isBasicInfoComplete(basicInfo);
  if (key === "photo" || key === "export") return true;
  const status = sectionStatus[key] ?? "not_started";
  return status === "complete" || status === "skipped";
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Mobile-only shortcut to the export step, which is where the preview lives
 * on a phone — no separate mobile preview view of its own. Pinned to the
 * viewport rather than sitting in the panel's scroll flow, so it's reachable
 * mid-section, and dropped once you're already on that step. */
function MobilePreviewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Preview resume"
      title="Preview resume"
      className="no-print fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-cta transition duration-200 ease-out hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] md:hidden"
    >
      <EyeIcon />
    </button>
  );
}

function ActivePanel({ activeKey }: { activeKey: NavKey }) {
  switch (activeKey) {
    case "basicInfo":
      return <BasicInfoForm />;
    case "photo":
      return <PhotoForm />;
    case "education":
      return <EducationForm />;
    case "experience":
      return (
        <ExperienceForm sectionKey="experience" title="Experience" help="Paid roles you've held, most recent first." />
      );
    case "internships":
      return <ExperienceForm sectionKey="internships" title="Internships" help="Internships or co-ops you've done, most recent first." />;
    case "partTime":
      return (
        <ExperienceForm
          sectionKey="partTime"
          title="Part-time work"
          help="Part-time jobs outside of an internship, most recent first."
        />
      );
    case "projects":
      return <ProjectsForm />;
    case "skills":
      return <SkillsForm />;
    case "certifications":
      return <CertificationsForm />;
    case "patents":
      return <PatentsForm />;
    case "languages":
      return <LanguagesForm />;
    case "hobbies":
      return <HobbiesForm />;
    case "softSkills":
      return <SoftSkillsForm />;
    case "additional":
      return <AdditionalForm />;
    case "summary":
      return <SummaryForm />;
    case "keyAchievements":
      return <KeyAchievementsForm />;
    default:
      return null;
  }
}

export function BuilderShell() {
  const loadFromData = useBuilderStore((s) => s.loadFromData);
  const setHasSavedCopy = useBuilderStore((s) => s.setHasSavedCopy);
  const basicInfo = useBuilderStore((s) => s.basicInfo);
  const photo = useBuilderStore((s) => s.photo);
  const sections = useBuilderStore((s) => s.sections);
  const sectionStatus = useBuilderStore((s) => s.sectionStatus);
  const toggleSkipSection = useBuilderStore((s) => s.toggleSkipSection);
  const setPhoto = useBuilderStore((s) => s.setPhoto);
  const clearSection = useBuilderStore((s) => s.clearSection);
  const clearBasicInfo = useBuilderStore((s) => s.clearBasicInfo);
  const sectionOrder = useBuilderStore((s) => s.sectionOrder);
  const [activeKey, setActiveKey] = useState<NavKey>("basicInfo");
  const [hydrated, setHydrated] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const formPaneRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // One-time localStorage hydration — the spec requires reading it inside
    // an effect (never during render, since it doesn't exist on the server)
    // and the resulting setState is what unblocks the real UI below.
    if (hasSavedResumeData()) {
      setHasSavedCopy(true);
      const saved = loadResumeData();
      if (saved) loadFromData(saved);
      else {
        showToast("Couldn't restore the saved resume — the copy on this device looks damaged.");
      }
    }
    const fromGallery = requestedTemplateId(window.location.search);
    if (fromGallery) useBuilderStore.getState().setTemplateId(fromGallery);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
    if (shouldOfferBuilderTour()) setTourOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // The form pane is overflow-y-auto, so swapping the panel leaves
    // scrollTop where the previous footer was — Next would open the next
    // section already scrolled to the bottom. Reset after every step change
    // (Next, Skip, Back, and the section nav all go through activeKey).
    const pane = formPaneRef.current;
    if (pane) pane.scrollTop = 0;
  }, [activeKey]);

  function selectSection(key: NavKey) {
    setActiveKey(key);
  }

  const wizardOrder = getWizardOrder(sectionOrder);
  const stepIndex = wizardOrder.indexOf(activeKey);
  const canGoBack = stepIndex > 0;
  const hasNextStep = stepIndex >= 0 && stepIndex < wizardOrder.length - 1;
  const stepValid = isStepValid(activeKey, basicInfo, sectionStatus);
  const canSkip = activeKey === "photo" || isContentSection(activeKey);
  const canClear =
    activeKey === "basicInfo"
      ? hasBasicInfoContent(basicInfo)
      : activeKey === "photo"
        ? Boolean(photo)
        : isContentSection(activeKey) && hasSectionContent(activeKey, sections);
  const nextBlockedReason =
    hasNextStep && !stepValid
      ? activeKey === "basicInfo"
        ? basicInfo.name.trim() && basicInfo.email.trim() && basicInfo.location.trim()
          ? "Fix the highlighted fields before continuing."
          : "Fill in your name, email, and location to continue."
        : isContentSection(activeKey)
          ? hasSectionContent(activeKey, sections)
            ? "Fix the highlighted fields before continuing."
            : "Fill in this section, or skip it, to continue."
          : undefined
      : undefined;

  function goBack() {
    if (stepIndex > 0) selectSection(wizardOrder[stepIndex - 1]);
  }
  /** Unconditional advance — used once a step has already been resolved
   * (Next, after its own validity check) or explicitly bypassed (Skip). */
  function advance() {
    if (hasNextStep) selectSection(wizardOrder[stepIndex + 1]);
  }
  function goNext() {
    if (stepValid) advance();
  }
  function goSkip() {
    // toggleSkipSection updates the store synchronously, but `sectionStatus`
    // here is a snapshot from this render — re-deriving validity from it
    // right after would still see the pre-skip status. Skip is the explicit
    // override anyway, so just advance unconditionally.
    if (activeKey === "photo") {
      setPhoto(null);
    } else if (isContentSection(activeKey) && sectionStatus[activeKey] !== "skipped") {
      toggleSkipSection(activeKey);
    }
    advance();
  }
  function goClear() {
    if (activeKey === "basicInfo") {
      clearBasicInfo();
    } else if (activeKey === "photo") {
      setPhoto(null);
    } else if (isContentSection(activeKey)) {
      clearSection(activeKey);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-paper)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
      </div>
    );
  }

  return (
    <div className="print-unclip flex h-[100dvh] flex-col overflow-hidden" inert={tourOpen || undefined}>
      <Navbar />
      <div className="print-unclip flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="no-print sticky top-0 z-20 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] md:static md:h-full md:min-h-0 md:w-64 md:overflow-y-auto md:border-b-0 md:border-r">
          <SectionNav active={activeKey} onSelect={selectSection} />
        </aside>

        {activeKey === "export" ? (
          <main ref={formPaneRef} className="print-unclip min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
            <div className="mx-auto max-w-3xl">
              <ExportSection />
              <AdSlot
                slot={ADSENSE_SLOTS.builderPreview}
                name="Builder preview"
                className="mt-8 mb-4 flex min-h-[8.5rem] flex-col items-center gap-1 md:hidden"
              />
            </div>
          </main>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* pb-24 on mobile only: leaves room under the scroll content so
                the pinned preview button never covers the last row. */}
            <main ref={formPaneRef} className="block min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 pb-24 sm:px-8 md:pb-6">
              <div className="mx-auto max-w-2xl">
                <ActivePanel activeKey={activeKey} />
                <SectionFooterNav
                  canGoBack={canGoBack}
                  canGoNext={hasNextStep}
                  nextEnabled={stepValid}
                  nextBlockedReason={nextBlockedReason}
                  canSkip={canSkip}
                  canClear={canClear}
                  clearLabel={stepLabel(activeKey)}
                  onBack={goBack}
                  onNext={goNext}
                  onSkip={goSkip}
                  onClear={goClear}
                />
                {FOOTER_AD_STEPS.has(activeKey) && (
                  <AdSlot
                    slot={ADSENSE_SLOTS.builderSectionFooter}
                    name={`Section footer — ${activeKey}`}
                    className="mt-6 hidden flex-col items-center gap-1 md:flex"
                  />
                )}
                <AdSlot
                  slot={ADSENSE_SLOTS.builderPreview}
                  name="Builder preview"
                  className="mt-8 mb-4 flex min-h-[8.5rem] flex-col items-center gap-1 md:hidden"
                />
              </div>
            </main>
            {/* Side-by-side preview is a desktop affordance only — on mobile
                the export step is where the preview is read. Height is
                capped to this column so a long resume scrolls here instead
                of stretching the whole builder. */}
            <aside className="hidden min-h-0 w-full border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-ink)_3.5%,var(--color-paper))] px-5 py-6 sm:px-8 md:flex md:w-[420px] md:shrink-0 md:flex-col md:overflow-hidden md:border-l">
              <AdSlot
                slot={ADSENSE_SLOTS.builderPreviewTop}
                name="Builder preview top"
                className="mb-4 flex shrink-0 flex-col items-center gap-1"
              />
              <div className="min-h-0 flex-1">
                <PreviewPane />
              </div>
            </aside>
          </div>
        )}
      </div>

      {activeKey !== "export" && <MobilePreviewButton onClick={() => selectSection("export")} />}
      <ToastHost />
      <BuilderTour
        open={tourOpen}
        onDismiss={() => {
          dismissBuilderTour();
          setTourOpen(false);
        }}
      />
    </div>
  );
}
