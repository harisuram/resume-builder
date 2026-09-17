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
  it("hides download until at least one field is filled", () => {
    renderExport();
    expect(screen.queryByRole("button", { name: "Download PDF" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("File name")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Save this resume on this device so you can pick it up again later?"),
    ).not.toBeInTheDocument();
  });

  it("enables download once a basic-info field is filled", () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
    });
    renderExport();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
    expect(screen.getByLabelText("File name")).toBeInTheDocument();
  });

  it("enables download once any content-section field is filled", () => {
    act(() => {
      useBuilderStore.getState().setSkills(["TypeScript"]);
    });
    renderExport();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
  });

  it("hides download again if every field is cleared", () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
      useBuilderStore.getState().setSkills(["TypeScript"]);
    });
    renderExport();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();

    act(() => {
      useBuilderStore.getState().clearBasicInfo();
      useBuilderStore.getState().setSkills([]);
    });

    expect(screen.queryByRole("button", { name: "Download PDF" })).not.toBeInTheDocument();
  });

  it("does not ask to save on the export step", () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
      useBuilderStore.getState().setSkills(["TypeScript"]);
    });
    renderExport();
    expect(
      screen.queryByText("Save this resume on this device so you can pick it up again later?"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yes, save it" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "No, don’t save" })).not.toBeInTheDocument();
  });

  it("prints without writing localStorage when there is no saved copy", async () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
    });
    renderExport();
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    expect(localStorage.getItem("resumeData")).toBeNull();
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("keeps the existing saved copy up to date when downloading", async () => {
    localStorage.setItem("resumeData", JSON.stringify({ basicInfo: { name: "Stale" } }));
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
      useBuilderStore.getState().setSkills(["TypeScript"]);
      useBuilderStore.getState().setHasSavedCopy(true);
    });
    renderExport();
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    expect(JSON.parse(localStorage.getItem("resumeData")!).basicInfo.name).toBe("Jamie Rivera");
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("renders the live preview alongside the export controls", () => {
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
    });
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
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
    });
    renderExport();
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/print dialog/);
  });

  it("toasts when saving the resume to this device fails", async () => {
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
      useBuilderStore.getState().setHasSavedCopy(true);
    });
    renderExport();
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Storage may be full/);
    spy.mockRestore();
  });

  describe("editable file name", () => {
    beforeEach(() => {
      act(() => {
        useBuilderStore.getState().updateBasicInfo({ name: "Jamie Rivera" });
      });
    });

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
