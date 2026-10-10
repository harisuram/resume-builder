"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { MobilePreviewSheet } from "@/components/builder/MobilePreviewSheet";
import { MobileMenuButton, MobileSectionMenu } from "@/components/builder/MobileSectionDrawer";
import { setMobileMenuOpen } from "@/components/builder/mobileMenuStore";
import { SectionFooterNav } from "@/components/builder/SectionFooterNav";
import { TemplateRail } from "@/components/builder/TemplateRail";
import { ToastHost } from "@/components/ui/Toast";
import { ADSENSE_SLOTS } from "@/lib/ads";
import { hasSavedCoverLetter, loadCoverLetter } from "@/lib/coverLetter";
import { persistCurrentLetter, useCoverLetterStore } from "@/lib/coverLetterStore";
import { persistCurrentResume } from "@/lib/persistResume";
import { hasBasicInfoContent, useBuilderStore } from "@/lib/store";
import { hasSavedResumeData, loadResumeData } from "@/lib/storage";
import { showToast } from "@/lib/toast";
import { CoverLetterExport } from "./CoverLetterExport";
import { CoverLetterNav } from "./CoverLetterNav";
import { CoverLetterNavbar } from "./CoverLetterNavbar";
import { CoverLetterPreviewPane } from "./CoverLetterPreviewPane";
import { ClosingForm, GreetingForm, LetterDetailsForm, ParagraphForm, RecipientForm } from "./LetterForms";
import {
  adjacentLetterStep,
  findParagraph,
  getLetterWizardOrder,
  isLetterStepSkippable,
  isLetterStepValid,
  letterNextBlockedReason,
  letterStepLabel,
  type LetterStepKey,
} from "./steps";
import { setLetterTemplate, useLetterTemplate } from "./useLetterPdf";

/** Matches the `lg:` breakpoint where the live preview sits beside the form. */
const SIDE_PREVIEW_MEDIA = "(min-width: 1024px)";

/** Enter animation for Next (from the right) and Back (from the left) — the
 * resume builder's step transition. */
function StepEnter({ direction, enabled, children }: { direction: 1 | -1; enabled: boolean; children: ReactNode }) {
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

function ActivePanel({ activeKey, onParagraphRemoved }: { activeKey: LetterStepKey; onParagraphRemoved: () => void }) {
  const paragraph = useCoverLetterStore((s) => findParagraph(s.letter, activeKey));
  switch (activeKey) {
    case "details":
      return <LetterDetailsForm />;
    case "recipient":
      return <RecipientForm />;
    case "greeting":
      return <GreetingForm />;
    case "closing":
      return <ClosingForm />;
    default:
      return paragraph ? <ParagraphForm paragraph={paragraph} onRemoved={onParagraphRemoved} /> : null;
  }
}

/** The cover letter builder: the resume builder's shell — section sidebar,
 * step wizard with Back / Skip / Clear / Save & Next, live PDF preview, phone
 * menu and preview sheet, download step with the template rail — over the
 * letter's steps. */
export function CoverLetterShell() {
  const basicInfo = useBuilderStore((s) => s.basicInfo);
  const letter = useCoverLetterStore((s) => s.letter);
  const toggleSkipParagraph = useCoverLetterStore((s) => s.toggleSkipParagraph);
  const addParagraph = useCoverLetterStore((s) => s.addParagraph);
  const { templateId } = useLetterTemplate();
  const [activeKey, setActiveKey] = useState<LetterStepKey>("details");
  const [stepDir, setStepDir] = useState<1 | -1>(1);
  const [animateStep, setAnimateStep] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuWarm, setMenuWarm] = useState(false);
  const formPaneRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // One-time localStorage hydration, as in BuilderShell: the resume (for
    // the sender's details, photo and template) and the letter itself.
    if (hasSavedResumeData()) {
      useBuilderStore.getState().setHasSavedCopy(true);
      const saved = loadResumeData();
      if (saved) useBuilderStore.getState().loadFromData(saved);
      else showToast("Couldn't restore the saved resume — the copy on this device looks damaged.");
    }
    if (hasSavedCoverLetter()) {
      useCoverLetterStore.getState().setHasSavedCopy(true);
      const saved = loadCoverLetter();
      if (saved) useCoverLetterStore.getState().loadFromData(saved);
      else showToast("Couldn't restore the saved cover letter — the copy on this device looks damaged.");
    }
    // Details already filled in on the resume: start where the letter does.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hasBasicInfoContent(useBuilderStore.getState().basicInfo)) setActiveKey("recipient");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || menuWarm || window.matchMedia?.("(min-width: 768px)").matches) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 400));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => setMenuWarm(true));
    return () => cancel(handle);
  }, [hydrated, menuWarm]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(SIDE_PREVIEW_MEDIA);
    const sync = () => {
      if (media.matches) setPreviewOpen(false);
    };
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      setMobileMenuOpen(false);
    };
  }, []);

  useEffect(() => {
    const pane = formPaneRef.current;
    if (pane) pane.scrollTop = 0;
  }, [activeKey]);

  const wizardOrder = getLetterWizardOrder(letter);
  const stepIndex = wizardOrder.indexOf(activeKey);

  // A removed custom paragraph leaves nothing to show; fall back to Closing.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hydrated && stepIndex === -1) setActiveKey("closing");
  }, [hydrated, stepIndex]);

  function selectSection(key: LetterStepKey, direction?: 1 | -1) {
    if (key === activeKey) return;
    const from = wizardOrder.indexOf(activeKey);
    const to = wizardOrder.indexOf(key);
    setStepDir(direction ?? (to < from ? -1 : 1));
    setAnimateStep(true);
    setActiveKey(key);
  }

  function persistAll() {
    persistCurrentLetter();
    // The details step edits the resume's Basic info; save that too.
    if (activeKey === "details") persistCurrentResume();
  }

  const canGoBack = stepIndex > 0;
  const hasNextStep = stepIndex >= 0 && stepIndex < wizardOrder.length - 1;
  const stepValid = isLetterStepValid(activeKey, letter, basicInfo);
  const canSkip = isLetterStepSkippable(activeKey, letter);
  const paragraph = findParagraph(letter, activeKey);
  const canClear =
    activeKey === "details"
      ? hasBasicInfoContent(basicInfo)
      : activeKey === "recipient"
        ? Boolean(letter.company || letter.position || letter.recipientName || letter.recipientTitle || letter.companyAddress || letter.fields.length)
        : activeKey === "greeting"
          ? Boolean(letter.greeting)
          : activeKey === "closing"
            ? Boolean(letter.closing || letter.signOff)
            : Boolean(paragraph?.text);

  function goBack() {
    const prev = adjacentLetterStep(wizardOrder, stepIndex, -1, letter);
    if (prev) selectSection(prev, -1);
  }
  function advance() {
    const next = adjacentLetterStep(wizardOrder, stepIndex, 1, letter);
    if (next) selectSection(next, 1);
  }
  function goNext() {
    if (!stepValid) return;
    persistAll();
    advance();
  }
  function goSkip() {
    const current = findParagraph(letter, activeKey);
    advance();
    if (current && !current.skipped) toggleSkipParagraph(current.id);
    persistCurrentLetter();
  }
  function goClear() {
    const store = useCoverLetterStore.getState();
    if (activeKey === "details") useBuilderStore.getState().clearBasicInfo();
    else if (activeKey === "recipient") store.clearRecipient();
    else if (activeKey === "greeting") store.clearGreeting();
    else if (activeKey === "closing") store.clearClosing();
    else if (paragraph) store.clearParagraph(paragraph.id);
  }
  function addParagraphStep() {
    // The store updates synchronously, so the new step is in the order by
    // the time this render commits.
    const id = addParagraph();
    persistCurrentLetter();
    setStepDir(1);
    setAnimateStep(true);
    setActiveKey(id);
  }

  return (
    <div className="print-unclip flex h-[100dvh] flex-col overflow-hidden">
      <div
        className="print-unclip flex min-h-0 flex-1 flex-col overflow-hidden"
        data-builder-content=""
        inert={previewOpen || undefined}
      >
        <CoverLetterNavbar onReset={() => selectSection(hasBasicInfoContent(basicInfo) ? "recipient" : "details", -1)} />
        {/* Inert until hydrated: anything typed before the saved copies load
            would be overwritten by them. */}
        <div
          className="print-unclip flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row"
          inert={!hydrated || undefined}
        >
          <aside className="no-print sticky top-0 z-20 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] md:relative md:flex md:h-full md:min-h-0 md:w-64 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r">
            {/* Mobile: a bar that opens the side menu with the full step
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
                <span key={activeKey} className="animate-step-label-in truncate text-[13.5px] font-semibold text-[var(--color-ink)]">
                  {letterStepLabel(activeKey, letter)}
                </span>
                <span className="block h-1.5 w-full rounded-full bg-[color-mix(in_srgb,var(--color-border)_70%,transparent)]">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-focus))] shadow-[0_0_10px_var(--accent-glow)] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: `${((Math.max(stepIndex, 0) + 1) / wizardOrder.length) * 100}%` }}
                  />
                </span>
              </button>
            </div>
            <div className="hidden md:-mb-2 md:flex md:shrink-0 md:items-center md:pl-6 md:pr-3 md:pt-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                Cover letter
              </span>
            </div>
            <div className="hidden md:block">
              <CoverLetterNav active={activeKey} onSelect={selectSection} onAddParagraph={addParagraphStep} />
            </div>
          </aside>

          {activeKey === "export" ? (
            <div className="print-unclip flex min-h-0 flex-1 overflow-hidden">
              <main ref={formPaneRef} className="print-unclip min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain px-5 py-6 sm:px-8">
                <div className="mx-auto w-full max-w-[820px]">
                  <StepEnter key={activeKey} direction={stepDir} enabled={animateStep}>
                    <CoverLetterExport />
                  </StepEnter>
                </div>
              </main>
              {/* Desktop only: every template as a thumbnail; phones use the
                  dropdown above the preview. */}
              <aside className="no-print hidden min-h-0 border-l border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-ink)_3.5%,var(--color-paper))] px-3 pt-5 md:flex md:w-[260px] md:shrink-0 md:flex-col xl:w-[400px]">
                <TemplateRail
                  value={templateId}
                  onChange={setLetterTemplate}
                  hint="Tap any design to restyle your letter. Your resume keeps its own."
                />
              </aside>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Extra bottom padding on mobile: the fixed step footer sits
                  over the viewport, so the last field has to scroll above it. */}
              <main ref={formPaneRef} className="block min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain px-5 py-6 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-8 md:pb-6">
                <div className="mx-auto w-full max-w-2xl">
                  <div className="relative z-10 min-w-0 max-md:rounded-2xl max-md:border max-md:border-[var(--color-border)]/70 max-md:bg-[var(--color-surface)] max-md:p-4 max-md:shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_12px_32px_-18px_rgb(0_0_0_/_0.18)]">
                    <StepEnter key={activeKey} direction={stepDir} enabled={animateStep}>
                      {hydrated && <ActivePanel activeKey={activeKey} onParagraphRemoved={() => selectSection("closing")} />}
                    </StepEnter>
                  </div>
                  <SectionFooterNav
                    canGoBack={canGoBack}
                    canGoNext={hasNextStep}
                    nextEnabled={stepValid}
                    nextBlockedReason={letterNextBlockedReason(activeKey, letter, basicInfo)}
                    canSkip={canSkip}
                    canClear={canClear}
                    clearLabel={letterStepLabel(activeKey, letter)}
                    onBack={goBack}
                    onNext={goNext}
                    onSkip={goSkip}
                    onClear={goClear}
                    onPreview={previewOpen ? undefined : () => setPreviewOpen(true)}
                    onDownload={() => selectSection("export")}
                  />
                  {/* Mobile's one unit on form steps, below the footer and
                      clear of the fixed Save & Next. Desktop shows the
                      preview-column unit instead. */}
                  <AdSlot
                    slot={ADSENSE_SLOTS.coverBuilder}
                    name="Cover letter builder"
                    className="mt-12 mb-4 flex min-h-[8.5rem] flex-col items-center gap-1 md:hidden"
                  />
                </div>
              </main>
              {/* Side-by-side preview from lg up only; phones and tablets
                  open the same pane in the bottom sheet. */}
              <aside className="flex min-h-0 w-0 overflow-hidden border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-ink)_3.5%,var(--color-paper))] p-0 lg:w-[min(650px,max(325px,42.75%))] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-l lg:px-4 lg:py-6 xl:px-5">
                <AdSlot
                  slot={ADSENSE_SLOTS.coverBuilderTop}
                  name="Cover letter preview top"
                  className="mb-4 flex shrink-0 flex-col items-center gap-1"
                />
                <div className="min-h-0 min-w-0 flex-1">{hydrated && <CoverLetterPreviewPane />}</div>
              </aside>
            </div>
          )}
        </div>

        <ToastHost />
      </div>
      <MobileSectionMenu<LetterStepKey>
        warm={menuWarm}
        active={activeKey}
        onSelect={selectSection}
        renderNav={(select) => (
          <CoverLetterNav
            drawer
            active={activeKey}
            onSelect={select}
            onAddParagraph={() => {
              setMobileMenuOpen(false);
              addParagraphStep();
            }}
          />
        )}
      />
      {previewOpen && (
        <MobilePreviewSheet title="Cover letter preview" onClose={() => setPreviewOpen(false)}>
          <CoverLetterPreviewPane />
        </MobilePreviewSheet>
      )}
    </div>
  );
}
