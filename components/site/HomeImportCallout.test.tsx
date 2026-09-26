import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { takePendingImport } from "@/lib/resumeImport/pendingImport";
import { HomeImportCallout } from "./HomeImportCallout";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const input = () => screen.getByTestId("home-import-input") as HTMLInputElement;

beforeEach(() => {
  push.mockClear();
  takePendingImport();
});

describe("HomeImportCallout", () => {
  it("opens the file picker from anywhere on the card", async () => {
    render(<HomeImportCallout />);
    const click = jest.spyOn(input(), "click");
    await userEvent.click(screen.getByText("Already have a resume?"));
    expect(click).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText("Upload your PDF or Word file."));
    expect(click).toHaveBeenCalledTimes(2);
    expect(input().accept).toMatch(/\.pdf.*\.docx/);
  });

  it("hands the chosen file to the builder and moves there", async () => {
    render(<HomeImportCallout />);
    const file = new File(["%PDF-1.4"], "resume.pdf", { type: "application/pdf" });
    await userEvent.upload(input(), file);
    expect(push).toHaveBeenCalledWith("/builder?import=1");
    expect(takePendingImport()).toBe(file);
    // Handed over once only.
    expect(takePendingImport()).toBeNull();
    expect(screen.getByRole("button", { name: /Import my resume/ })).toBeDisabled();
  });

  it("takes a file dropped on the card", () => {
    render(<HomeImportCallout />);
    const card = screen.getByRole("button", { name: /Import my resume/ });
    const file = new File(["hello"], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    fireEvent.dragOver(card, { dataTransfer: { files: [file] } });
    expect(screen.getByText("Drop it here to start.")).toBeInTheDocument();
    fireEvent.drop(card, { dataTransfer: { files: [file] } });
    expect(push).toHaveBeenCalledWith("/builder?import=1");
    expect(takePendingImport()).toBe(file);
  });

  it("explains a file it can't use and stays on the page", async () => {
    render(<HomeImportCallout />);
    await userEvent.upload(input(), new File(["x"], "photo.png", { type: "image/png" }), { applyAccept: false });
    expect(screen.getByRole("alert")).toHaveTextContent("Use a PDF, Word (.docx), or text file.");
    expect(push).not.toHaveBeenCalled();
    expect(takePendingImport()).toBeNull();
  });
});
