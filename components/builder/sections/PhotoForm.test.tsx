import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastHost } from "@/components/ui/Toast";
import { useBuilderStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import { PhotoForm } from "./PhotoForm";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
    useToastStore.getState().clear();
  });
});

function makeImageFile(name = "photo.png", type = "image/png") {
  return new File(["fake-image-bytes"], name, { type });
}

function renderPhoto() {
  return render(
    <>
      <PhotoForm />
      <ToastHost />
    </>,
  );
}

function fileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("PhotoForm", () => {
  it("shows 'No photo' and an upload button when nothing is set", () => {
    renderPhoto();
    expect(screen.getByText("No photo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload photo" })).toBeInTheDocument();
  });

  it("opens the crop modal after choosing an image file", async () => {
    renderPhoto();
    await userEvent.upload(fileInput(), makeImageFile());
    expect(await screen.findByRole("dialog", { name: "Crop photo" })).toBeInTheDocument();
  });

  it("rejects a non-image file with an error, without opening the crop modal", async () => {
    renderPhoto();
    // fireEvent bypasses userEvent's own `accept`-attribute filtering, so this
    // exercises the app's own defensive MIME check (a real browser only
    // filters the file *picker* by `accept` — drag-and-drop can still hand it
    // a non-matching file).
    fireEvent.change(fileInput(), { target: { files: [new File(["notes"], "notes.txt", { type: "text/plain" })] } });
    expect(await screen.findByRole("alert")).toHaveTextContent(/doesn't look like an image/);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows Edit and Remove once a photo is set, and Remove clears it", async () => {
    act(() => useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc123"));
    renderPhoto();
    expect(screen.queryByRole("button", { name: "Replace photo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload photo" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(useBuilderStore.getState().photo).toBeNull();
    expect(screen.getByText("No photo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload photo" })).toBeInTheDocument();
  });

  it("shows a skipped notice when skipped, and the form again once un-skipped", () => {
    act(() => {
      useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc123");
      useBuilderStore.getState().toggleSkipSection("photo");
    });
    const { rerender } = renderPhoto();
    expect(screen.getByText(/Photo is skipped/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();

    act(() => useBuilderStore.getState().toggleSkipSection("photo"));
    rerender(
      <>
        <PhotoForm />
        <ToastHost />
      </>,
    );
    expect(screen.queryByText(/Photo is skipped/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("opens the crop modal pre-loaded with the existing photo via Edit", async () => {
    act(() => useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc123"));
    renderPhoto();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(await screen.findByRole("dialog", { name: "Crop photo" })).toBeInTheDocument();
  });
});
