import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import { ToastHost } from "@/components/ui/Toast";
import { ExportSection } from "./ExportSection";

beforeEach(() => {
  localStorage.clear();
  (window.print as jest.Mock).mockClear();
  act(() => {
    useBuilderStore.getState().resetStore();
    useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
    useToastStore.getState().clear();
  });
});

function renderExport() {
  return render(
    <>
      <ExportSection />
      <ToastHost />
    </>,
  );
}

describe("ExportSection", () => {
  it("disables Download until a save choice is made", () => {
    renderExport();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeDisabled();
    expect(screen.getByText("Choose an option above first.")).toBeInTheDocument();
  });

  it("pre-selects 'No' state (no existing saved copy) so nothing saves by default", () => {
    renderExport();
    // Neither option is pressed as "primary" until a saved copy exists or one is chosen.
    expect(localStorage.getItem("resumeData")).toBeNull();
  });

  it("saves to localStorage and prints when consenting", async () => {
    renderExport();
    await userEvent.click(screen.getByRole("button", { name: "Yes, save it" }));
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();

    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    const saved = localStorage.getItem("resumeData");
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!).basicInfo.name).toBe("Jamie Rivera");
    expect(useBuilderStore.getState().hasSavedCopy).toBe(true);
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("does not save when declining", async () => {
    renderExport();
    await userEvent.click(screen.getByRole("button", { name: "No, don’t save" }));
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    expect(localStorage.getItem("resumeData")).toBeNull();
    expect(useBuilderStore.getState().hasSavedCopy).toBe(false);
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("skips the save question entirely when a saved copy already exists on mount", () => {
    localStorage.setItem(
      "resumeData",
      JSON.stringify({
        basicInfo: { name: "Existing", email: "", phone: "", location: "", links: {} },
        sections: {},
        sectionStatus: {},
        templateId: "jakes-resume",
      }),
    );
    renderExport();

    expect(screen.queryByRole("button", { name: "Yes, save it" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "No, don’t save" })).not.toBeInTheDocument();
    expect(screen.queryByText("Choose an option above first.")).not.toBeInTheDocument();
    // The existing copy counts as consent, so downloading is available directly.
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
  });

  it("keeps the existing saved copy up to date when downloading without re-asking", async () => {
    localStorage.setItem("resumeData", JSON.stringify({ basicInfo: { name: "Stale" } }));
    renderExport();
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    expect(JSON.parse(localStorage.getItem("resumeData")!).basicInfo.name).toBe("Jamie Rivera");
    expect(useBuilderStore.getState().hasSavedCopy).toBe(true);
  });

  it("renders the live preview alongside the export controls", () => {
    renderExport();
    expect(screen.getByText("Jamie Rivera")).toBeInTheDocument();
  });

  it("does not offer a Word download", () => {
    renderExport();
    expect(screen.queryByRole("button", { name: /Word/i })).not.toBeInTheDocument();
    expect(screen.queryByText(".docx")).not.toBeInTheDocument();
  });

  it("toasts when the print dialog fails to open", async () => {
    (window.print as jest.Mock).mockImplementationOnce(() => {
      throw new Error("blocked");
    });
    renderExport();
    await userEvent.click(screen.getByRole("button", { name: "Yes, save it" }));
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/print dialog/);
  });

  it("toasts when saving the resume to this device fails", async () => {
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    renderExport();
    await userEvent.click(screen.getByRole("button", { name: "Yes, save it" }));
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Storage may be full/);
    spy.mockRestore();
  });

  describe("editable file name", () => {
    it("defaults to a slug of the resume's name", () => {
      renderExport();
      expect(screen.getByLabelText("File name")).toHaveValue("jamie_rivera");
    });

    it("lets the user type freely (no slugifying mid-keystroke) and slugifies on blur", async () => {
      renderExport();
      const input = screen.getByLabelText("File name");
      await userEvent.clear(input);
      await userEvent.type(input, "Senior Engineer Resume 2026");
      expect(input).toHaveValue("Senior Engineer Resume 2026");

      await userEvent.tab();
      expect(input).toHaveValue("senior_engineer_resume_2026");
    });

    it("sets document.title to the edited name during print, then restores it", async () => {
      const originalTitle = document.title;
      document.title = "Build your resume";
      renderExport();

      const input = screen.getByLabelText("File name");
      await userEvent.clear(input);
      await userEvent.type(input, "my resume");

      (window.print as jest.Mock).mockImplementationOnce(() => {
        expect(document.title).toBe("my_resume");
      });

      await userEvent.click(screen.getByRole("button", { name: "Yes, save it" }));
      await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

      expect(window.print).toHaveBeenCalledTimes(1);
      expect(document.title).toBe("Build your resume");
      document.title = originalTitle;
    });

    it("keeps the edited name even if the resume's own name field changes afterward", async () => {
      renderExport();
      const input = screen.getByLabelText("File name");
      await userEvent.clear(input);
      await userEvent.type(input, "sticky name");
      await userEvent.tab();

      act(() => {
        useBuilderStore.getState().updateBasicInfo({ name: "A Totally Different Name" });
      });

      expect(screen.getByLabelText("File name")).toHaveValue("sticky_name");
    });

    it("falls back to 'resume' if cleared entirely", async () => {
      renderExport();
      const input = screen.getByLabelText("File name");
      await userEvent.clear(input);
      await userEvent.tab();
      expect(input).toHaveValue("resume");
    });
  });
});
