"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { requestedTemplateId } from "@/components/templates/shared/theme";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { persistCurrentResume } from "@/lib/persistResume";
import { hasSavedResumeData, loadResumeData } from "@/lib/storage";
import {
  BUILDER_TOUR_MEDIA,
  dismissBuilderTour,
  dismissMobileBuilderTour,
  isBuilderTourViewport,
  shouldOfferBuilderTour,
  shouldOfferMobileBuilderTour,
} from "@/lib/builderTour";
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
import { wantsImportPrompt } from "@/lib/resumeImport/extractText";
import { takePendingImport } from "@/lib/resumeImport/pendingImport";
import { ResumeImportProvider } from "./ResumeImport";
import { adjacentUnskippedStep, getWizardOrder, type NavKey } from "./nav";
import { MobilePreviewSheet } from "./MobilePreviewSheet";
import { MobileMenuButton, MobileSectionMenu } from "./MobileSectionDrawer";
import { setMobileMenuOpen } from "./mobileMenuStore";
import { PreviewPane } from "./PreviewPane";
import { TemplateRail } from "./TemplateRail";
import { SectionFooterNav } from "./SectionFooterNav";
import { SectionNav } from "./SectionNav";

// Tours only open after mount (first visit or "Replay tour"), so their code
// stays out of the bundle that has to load before the builder is usable.
const BuilderTour = dynamic(() => import("./BuilderTour").then((m) => m.BuilderTour), { ssr: false });
const MobileBuilderTour = dynamic(() => import("./MobileBuilderTour").then((m) => m.MobileBuilderTour), {
  ssr: false,
});

const FIX_FIELDS_REASON = "Fix the highlighted fields before continuing.";

function stepLabel(key: NavKey): string {
  if (key === "basicInfo") return "Basic info";
  if (key === "photo") return "Photo";
  if (key === "export") return "Preview & download";
  return getSectionMeta(key).label;
}

/** Whether the current step has to be resolved (filled in, or explicitly
 * skipped) before "Next" will advance past it. Basic info has no skip
 * option, so it's gated on its required fields directly; every other step
 * except export must be either complete or skipped — otherwise "Skip"
 * would do nothing "Next" doesn't already do. */
function isContentSection(key: NavKey): key is SectionKey {
  return key !== "basicInfo" && key !== "photo" && key !== "export";
}

function isSkippableStep(key: NavKey): key is SectionKey | "photo" {
  return key !== "basicInfo" && key !== "export";
}

function isStepValid(
  key: NavKey,
  basicInfo: BasicInfo,
  sectionStatus: Record<string, SectionStatus>,
  photo: string | null,
): boolean {
  if (key === "basicInfo") return isBasicInfoComplete(basicInfo);
  if (key === "export") return true;
  if (key === "photo") return sectionStatus.photo === "skipped" || Boolean(photo);
  const status = sectionStatus[key] ?? "not_started";
  return status === "complete" || status === "skipped";
}

/** Enter animation for Next (from the right) and Back (from the left).
 * Kept off the sticky footer — a transform on that ancestor would un-fix
 * it on phones. */
function StepEnter({
  direction,
  enabled,
  children,
}: {
  direction: 1 | -1;
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`print-unclip min-w-0 ${
        enabled ? `step-enter ${direction === 1 ? "animate-step-in-from-right" : "animate-step-in-from-left"}` : ""
      }`}
    >
      {children}
    </div>
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
  const clearPhoto = useBuilderStore((s) => s.clearPhoto);
  const clearSection = useBuilderStore((s) => s.clearSection);
  const clearBasicInfo = useBuilderStore((s) => s.clearBasicInfo);
  const sectionOrder = useBuilderStore((s) => s.sectionOrder);
  const templateId = useBuilderStore((s) => s.templateId);
  const setTemplateId = useBuilderStore((s) => s.setTemplateId);
  const [activeKey, setActiveKey] = useState<NavKey>("basicInfo");
  const [stepDir, setStepDir] = useState<1 | -1>(1);
  const [animateStep, setAnimateStep] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // On phones the side menu is built once, shortly after load, and kept
  // (hidden) so the ☰ tap only has to start the slide.
  const [menuWarm, setMenuWarm] = useState(false);
  const [mobileTourOpen, setMobileTourOpen] = useState(false);
  const [importPrompt, setImportPrompt] = useState(false);
  const importFirstRef = useRef<boolean | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const [initialFile, setInitialFile] = useState<File | null>(null);
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
    // From "Import my resume" on the home page: ask for the file first, and
    // leave the tour for another visit so the two don't stack. Drop the
    // flag from the address so a refresh doesn't ask again.
    // Read once and kept in a ref: this effect can run twice on mount (React
    // dev), and the second run would no longer see the flag we strip below.
    importFirstRef.current ??= wantsImportPrompt(window.location.search);
    const importFirst = importFirstRef.current;
    // A file picked on the home page comes along in memory: import it now
    // rather than asking for it again.
    pendingFileRef.current ??= takePendingImport();
    if (importFirst) {
      const url = new URL(window.location.href);
      url.searchParams.delete("import");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
    if (pendingFileRef.current) setInitialFile(pendingFileRef.current);
    else if (importFirst) setImportPrompt(true);
    else if (isBuilderTourViewport()) {
      if (shouldOfferBuilderTour()) setTourOpen(true);
    } else if (shouldOfferMobileBuilderTour()) setMobileTourOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || menuWarm || isBuilderTourViewport()) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 400));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => setMenuWarm(true));
    return () => cancel(handle);
  }, [hydrated, menuWarm]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(BUILDER_TOUR_MEDIA);
    const sync = () => {
      if (media.matches) {
        setPreviewOpen(false);
        setMobileMenuOpen(false);
        setMobileTourOpen(false);
        if (shouldOfferBuilderTour()) setTourOpen(true);
      } else {
        setTourOpen(false);
        if (shouldOfferMobileBuilderTour()) setMobileTourOpen(true);
      }
    };
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      setMobileMenuOpen(false);
    };
  }, []);

  useEffect(() => {
    // The form pane is overflow-y-auto, so swapping the panel leaves
    // scrollTop where the previous footer was — Next would open the next
    // section already scrolled to the bottom. Reset after every step change
    // (Next, Skip, Back, and the section nav all go through activeKey).
    const pane = formPaneRef.current;
    if (pane) pane.scrollTop = 0;
  }, [activeKey]);

  const wizardOrder = getWizardOrder(sectionOrder);
  const stepIndex = wizardOrder.indexOf(activeKey);

  function selectSection(key: NavKey, direction?: 1 | -1) {
    if (key === activeKey) return;
    const from = wizardOrder.indexOf(activeKey);
    const to = wizardOrder.indexOf(key);
    setStepDir(direction ?? (to < from ? -1 : 1));
    setAnimateStep(true);
    setActiveKey(key);
  }
  const canGoBack = stepIndex > 0;
  const hasNextStep = stepIndex >= 0 && stepIndex < wizardOrder.length - 1;
  const stepValid = isStepValid(activeKey, basicInfo, sectionStatus, photo);
  const canSkip = isSkippableStep(activeKey);
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
          ? FIX_FIELDS_REASON
          : "Fill in your name, email, and location to continue."
        : activeKey === "photo"
          ? "Upload a photo, or skip it, to continue."
          : isContentSection(activeKey)
            ? hasSectionContent(activeKey, sections)
              ? FIX_FIELDS_REASON
              : "Fill in this section, or skip it, to continue."
            : undefined
      : undefined;

  function goBack() {
    const prev = adjacentUnskippedStep(wizardOrder, stepIndex, -1, sectionStatus);
    if (prev) selectSection(prev, -1);
  }
  /** Unconditional advance — used once a step has already been resolved
   * (Next, after its own validity check) or explicitly bypassed (Skip).
   * Already-skipped neighbors are walked over so Next doesn't stop on a
   * switch that's already off. */
  function advance() {
    const next = adjacentUnskippedStep(wizardOrder, stepIndex, 1, sectionStatus);
    if (next) selectSection(next, 1);
  }
  function goNext() {
    if (!stepValid) return;
    persistCurrentResume();
    advance();
  }

  function goSkip() {
    // Advance first so Skip uses the same step fade as Next. Marking the
    // current step skipped before the key changes would paint SkippedNotice
    // in place and eat the transition. `sectionStatus` here is still the
    // pre-skip snapshot, which is what adjacentUnskippedStep expects.
    const current = activeKey;
    const shouldMarkSkipped = isSkippableStep(current) && sectionStatus[current] !== "skipped";
    advance();
    if (shouldMarkSkipped) toggleSkipSection(current);
    persistCurrentResume();
  }
  function goClear() {
    if (activeKey === "basicInfo") {
      clearBasicInfo();
    } else if (activeKey === "photo") {
      clearPhoto();
    } else if (isContentSection(activeKey)) {
      clearSection(activeKey);
    }
  }

  // The full builder (empty store, Basic info step) is in the static HTML so
  // phones paint the real layout before JS runs — no spinner-to-UI jump.
  // That also puts every builder ad unit in the pre-hydrate HTML for AdsBot,
  // which fetches `/builder` once and never clicks the wizard.
  return (
    <ResumeImportProvider
      onImported={() => {
        if (tourOpen) {
          dismissBuilderTour();
          setTourOpen(false);
        }
        if (mobileTourOpen) {
          dismissMobileBuilderTour();
          setMobileTourOpen(false);
        }
        selectSection("basicInfo");
      }}
      onReviewSection={(key) => selectSection(key)}
      prompt={importPrompt}
      onPromptClose={() => setImportPrompt(false)}
      initialFile={initialFile}
    >
    <div className="print-unclip flex h-[100dvh] flex-col overflow-hidden">
      <div
        className="print-unclip flex min-h-0 flex-1 flex-col overflow-hidden"
        data-builder-content=""
        inert={tourOpen || mobileTourOpen || previewOpen || undefined}
      >
        <Navbar />
        {/* Inert until hydrated: anything typed into the static form before
            React attaches would show in the field but never reach the store
            (Save & Next would stay disabled). */}
        <div
          className="print-unclip flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row"
          data-builder-pending={hydrated ? undefined : ""}
          inert={!hydrated || undefined}
        >
          <aside className="no-print sticky top-0 z-20 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] md:static md:h-full md:min-h-0 md:w-64 md:overflow-y-auto md:border-b-0 md:border-r">
            {/* Mobile: a bar that opens the side menu with the full section
                list. From md up the list is the sidebar itself. */}
            <div className="flex items-center gap-3 px-3 py-2 md:hidden">
              <MobileMenuButton className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)]/70 bg-[var(--color-surface)]/70 text-[var(--color-ink-soft)] shadow-[0_4px_14px_-6px_rgb(0_0_0_/_0.22),inset_0_1px_0_color-mix(in_srgb,var(--color-surface)_60%,transparent)] backdrop-blur-xl transition duration-150 hover:text-[var(--color-ink)] active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                tabIndex={-1}
                aria-hidden="true"
              >
                <span className="flex min-w-0 items-baseline justify-between gap-2">
                  <span key={activeKey} className="animate-step-label-in truncate text-[13.5px] font-semibold text-[var(--color-ink)]">
                    {stepLabel(activeKey)}
                  </span>
                </span>
                <span className="block h-1.5 w-full rounded-full bg-[color-mix(in_srgb,var(--color-border)_70%,transparent)]">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-focus))] shadow-[0_0_10px_var(--accent-glow)] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: `${((stepIndex + 1) / wizardOrder.length) * 100}%` }}
                  />
                </span>
              </button>
            </div>
            <div className="hidden md:block">
              <SectionNav active={activeKey} onSelect={selectSection} />
            </div>
          </aside>

          {activeKey === "export" ? (
            <div className="print-unclip flex min-h-0 flex-1 overflow-hidden">
            <main ref={formPaneRef} className="print-unclip min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain px-5 py-6 sm:px-8">
              <div className="mx-auto w-full max-w-[820px]">
                <StepEnter key={activeKey} direction={stepDir} enabled={animateStep}>
                  <ExportSection />
                </StepEnter>
                <AdSlot
                  slot={ADSENSE_SLOTS.builderPreview}
                  name="Builder preview"
                  className="mt-8 mb-4 flex min-h-[8.5rem] flex-col items-center gap-1 md:hidden"
                />
              </div>
            </main>
            {/* Desktop only: every template as a thumbnail, so picking a look
                doesn't need the dropdown (which stays on mobile). */}
            <aside className="no-print hidden min-h-0 border-l border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-ink)_3.5%,var(--color-paper))] px-3 pt-5 md:flex md:w-[260px] md:shrink-0 md:flex-col xl:w-[400px]">
              <TemplateRail value={templateId} onChange={setTemplateId} />
            </aside>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Extra bottom padding on mobile: the sticky step footer sits
                  over the viewport, so the last field has to scroll above it. */}
              <main ref={formPaneRef} className="block min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain px-5 py-6 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-8 md:pb-6">
                <div className="mx-auto w-full max-w-2xl">
                  {/* Above the step footer so absolute suggestion lists aren't
                      painted under Clear / Save & Next (later DOM sibling). */}
                  <div className="relative z-10 min-w-0 max-md:rounded-2xl max-md:border max-md:border-[var(--color-border)]/70 max-md:bg-[var(--color-surface)] max-md:p-4 max-md:shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_12px_32px_-18px_rgb(0_0_0_/_0.18)]">
                    <StepEnter key={activeKey} direction={stepDir} enabled={animateStep}>
                      <ActivePanel activeKey={activeKey} />
                    </StepEnter>
                  </div>
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
                    onPreview={previewOpen ? undefined : () => setPreviewOpen(true)}
                  />
                  <AdSlot
                    slot={ADSENSE_SLOTS.builderSectionFooter}
                    name={`Section footer — ${activeKey}`}
                    className="mt-6 flex flex-col items-center gap-1"
                  />
                  <AdSlot
                    slot={ADSENSE_SLOTS.builderPreview}
                    name="Builder preview"
                    className="mt-8 mb-4 flex min-h-[8.5rem] flex-col items-center gap-1 md:hidden"
                  />
                  <AdSlot
                    slot={ADSENSE_SLOTS.builderExport}
                    name="Export page"
                    className="mt-6 flex flex-col items-center gap-1"
                  />
                </div>
              </main>
              {/* Side-by-side preview is a desktop affordance only — on mobile
                  the eye button opens the same pane in a bottom sheet. Width
                  grows with the viewport (capped below the A4 design width)
                  so the CSS-scaled résumé stays readable without crowding the
                  form. */}
              <aside className="flex min-h-0 w-0 overflow-hidden border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-ink)_3.5%,var(--color-paper))] p-0 md:w-[min(650px,max(325px,42.75%))] md:shrink-0 md:flex-col md:overflow-hidden md:border-l md:px-3 md:py-5 lg:px-4 lg:py-6 xl:px-5">
                <AdSlot
                  slot={ADSENSE_SLOTS.builderPreviewTop}
                  name="Builder preview top"
                  className="mb-4 flex shrink-0 flex-col items-center gap-1"
                />
                {/* Mounted after hydration: the saved copy and `?template=`
                    are only applied then, so a pre-hydrate preview would show
                    the wrong résumé or template for a moment. */}
                <div className="min-h-0 min-w-0 flex-1">{hydrated && <PreviewPane />}</div>
              </aside>
            </div>
          )}
        </div>

        <ToastHost />
      </div>
      <MobileSectionMenu
        warm={menuWarm}
        active={activeKey}
        onSelect={selectSection}
        onReplayTour={() => setMobileTourOpen(true)}
      />
      {previewOpen && <MobilePreviewSheet onClose={() => setPreviewOpen(false)} />}
      {mobileTourOpen && (
        <MobileBuilderTour
          open
          onDismiss={() => {
            dismissMobileBuilderTour();
            setMobileTourOpen(false);
          }}
        />
      )}
      <BuilderTour
        open={tourOpen}
        onDismiss={() => {
          dismissBuilderTour();
          setTourOpen(false);
        }}
      />
    </div>
    </ResumeImportProvider>
  );
}
