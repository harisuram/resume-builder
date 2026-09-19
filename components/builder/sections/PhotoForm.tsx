"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DeleteIconButton } from "@/components/ui/DeleteIconButton";
import { useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import { PhotoCropModal } from "./PhotoCropModal";
import { SkippedNotice } from "./SkippedNotice";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoForm() {
  const photo = useBuilderStore((s) => s.photo);
  const setPhoto = useBuilderStore((s) => s.setPhoto);
  const skipped = useBuilderStore((s) => s.sectionStatus.photo) === "skipped";
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingSource, setPendingSource] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file doesn't look like an image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      const message = `That image is ${formatFileSize(file.size)} — use one under 2 MB.`;
      setError(message);
      showToast(message);
      return;
    }
    setError(undefined);
    const reader = new FileReader();
    reader.onerror = () => {
      setError("Couldn't read that image. Try another file.");
      showToast("Couldn't read that image. Try another file.");
    };
    reader.onload = () => setPendingSource(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">Photo</h2>
        <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
          Optional — shows up on templates with a photo slot. Common on resumes outside the US; skip it if your
          target companies don&rsquo;t expect one.
        </p>
      </div>

      {skipped ? (
        <SkippedNotice label="Photo" sectionKey="photo" />
      ) : (
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-border)]/20">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- cropped data URL held in client state, not an optimizable next/image asset
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="px-1 text-center text-[10.5px] text-[var(--color-ink-faint)]">No photo</span>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {!photo && (
                <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                  Upload photo
                </Button>
              )}
              {photo && (
                <Button variant="secondary" size="sm" onClick={() => setPendingSource(photo)}>
                  Edit
                </Button>
              )}
              {photo && (
                <DeleteIconButton
                  onClick={() => setPhoto(null)}
                  aria-label="Remove"
                  className="h-9 w-9 md:h-8 md:w-8"
                />
              )}
            </div>
            {error ? (
              <p role="alert" className="text-[11.5px] text-red-600">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {pendingSource && (
        <PhotoCropModal
          source={pendingSource}
          onCancel={() => setPendingSource(null)}
          onSave={(dataUrl) => {
            setPhoto(dataUrl);
            setPendingSource(null);
          }}
        />
      )}
    </div>
  );
}
