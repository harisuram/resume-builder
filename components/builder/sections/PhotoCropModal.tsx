"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/lib/toast";

/** Crop frame size on screen (px) and the fixed square resolution every
 * saved photo is exported at, regardless of the source image's size. */
const FRAME = 260;
const OUTPUT = 480;
const MAX_ZOOM = 4;

type Natural = { w: number; h: number };
type Offset = { x: number; y: number };

/** The scale at which the image, centered, fully covers the frame with no
 * gaps — the "zoom = 1" baseline that further zoom multiplies. */
function coverScale(natural: Natural) {
  return Math.max(FRAME / natural.w, FRAME / natural.h);
}

/** Keeps the image's edges outside the frame's edges at the given scale, so
 * dragging or zooming can never reveal blank space around it. */
function clampOffset(offset: Offset, scale: number, natural: Natural): Offset {
  const minX = FRAME - natural.w * scale;
  const minY = FRAME - natural.h * scale;
  return {
    x: Math.min(0, Math.max(minX, offset.x)),
    y: Math.min(0, Math.max(minY, offset.y)),
  };
}

export function PhotoCropModal({
  source,
  onCancel,
  onSave,
}: {
  source: string;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; offset: Offset } | null>(null);
  const [natural, setNatural] = useState<Natural | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  const scale = natural ? coverScale(natural) * zoom : 1;

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const next: Natural = { w: img.naturalWidth, h: img.naturalHeight };
    setNatural(next);
    setZoom(1);
    const base = coverScale(next);
    setOffset({ x: (FRAME - next.w * base) / 2, y: (FRAME - next.h * base) / 2 });
  }

  function handleZoomChange(nextZoom: number) {
    if (!natural) return;
    setZoom(nextZoom);
    setOffset((prev) => clampOffset(prev, coverScale(natural) * nextZoom, natural));
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!natural) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, offset };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !natural) return;
    const { startX, startY, offset: startOffset } = dragRef.current;
    setOffset(
      clampOffset(
        { x: startOffset.x + (e.clientX - startX), y: startOffset.y + (e.clientY - startY) },
        scale,
        natural,
      ),
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleSave() {
    const img = imgRef.current;
    if (!img || !natural) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      // Map the visible FRAME x FRAME window back to natural-image pixels.
      const sourceSize = FRAME / scale;
      ctx.drawImage(img, -offset.x / scale, -offset.y / scale, sourceSize, sourceSize, 0, 0, OUTPUT, OUTPUT);
      onSave(canvas.toDataURL("image/jpeg", 0.87));
    } catch {
      showToast("Couldn't crop that photo. Try another image.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Crop photo"
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
        <div>
          <h2 className="font-display text-[17px] font-semibold text-[var(--color-ink)]">Crop photo</h2>
          <p className="mt-1 text-[12.5px] text-[var(--color-ink-soft)]">Drag to reposition, use the slider to zoom.</p>
        </div>

        <div
          className="relative mx-auto touch-none overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-border)]/20"
          style={{ width: FRAME, height: FRAME, cursor: natural ? "grab" : "default" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided data URL, not an optimizable next/image asset */}
          <img
            ref={imgRef}
            src={source}
            alt=""
            draggable={false}
            onLoad={handleImageLoad}
            onError={() => showToast("Couldn't read that image. Try another file.")}
            className="absolute max-w-none select-none"
            style={
              natural
                ? { left: offset.x, top: offset.y, width: natural.w * scale, height: natural.h * scale }
                : { opacity: 0 }
            }
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11.5px] text-[var(--color-ink-faint)]">Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!natural}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="flex-1 accent-[var(--color-accent)]"
            aria-label="Zoom"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!natural}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
