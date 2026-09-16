"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useBuilderStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import { PhotoCropModal } from "./PhotoCropModal";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export function PhotoForm() {
  const photo = useBuilderStore((s) => s.photo);
  const setPhoto = useBuilderStore((s) => s.setPhoto);
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
      setError("That image is too large — try one under 8MB.");
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
        <h2 className="font-display text-[20px] font-semibold text-[var(--color-ink)]">Photo</h2>
        <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
          Optional — shows up on templates with a photo slot. Common on resumes outside the US; skip it if your
          target companies don&rsquo;t expect one.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-border)]/20">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- cropped data URL held in client state, not an optimizable next/image asset
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-1 text-center text-[10.5px] text-[var(--color-ink-faint)]">No photo</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {!photo && (
              <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                Upload photo
              </Button>
            )}
            {photo && (
              <Button variant="secondary" size="sm" onClick={() => setPendingSource(photo)}>
                Edit crop
              </Button>
            )}
            {photo && (
              <Button variant="ghost" size="sm" onClick={() => setPhoto(null)}>
                Remove
              </Button>
            )}
          </div>
          {error ? (
            <p role="alert" className="text-[11.5px] text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      </div>

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
