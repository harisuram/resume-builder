"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/lib/toast";

/** Crop frame size on screen (px) and the fixed square resolution every
 * saved photo is exported at, regardless of the source image's size. */
const FRAME_MAX = 260;
const OUTPUT = 480;
const MAX_ZOOM = 4;

type Natural = { w: number; h: number };
type Offset = { x: number; y: number };

/** The scale at which the image, centered, fully covers the frame with no
 * gaps — the "zoom = 1" baseline that further zoom multiplies. */
function coverScale(natural: Natural, frame: number) {
  return Math.max(frame / natural.w, frame / natural.h);
}

/** Keeps the image's edges outside the frame's edges at the given scale, so
 * dragging or zooming can never reveal blank space around it. */
function clampOffset(offset: Offset, scale: number, natural: Natural, frame: number): Offset {
  const minX = frame - natural.w * scale;
  const minY = frame - natural.h * scale;
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
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; offset: Offset } | null>(null);
  const [frame, setFrame] = useState(FRAME_MAX);
  const [natural, setNatural] = useState<Natural | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  const scale = natural ? coverScale(natural, frame) * zoom : 1;

  useLayoutEffect(() => {
    function update() {
      const node = frameRef.current;
      if (!node) return;
      if (node.clientWidth > 0) setFrame(node.clientWidth);
    }
    update();
    const frameEl = frameRef.current;
    if (!frameEl || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(frameEl);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!natural) return;
    const nextScale = coverScale(natural, frame) * zoom;
    if (zoom === 1) {
      setOffset({
        x: (frame - natural.w * nextScale) / 2,
        y: (frame - natural.h * nextScale) / 2,
      });
    } else {
      setOffset((prev) => clampOffset(prev, nextScale, natural, frame));
    }
  }, [frame, natural, zoom]);

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setZoom(1);
  }

  function handleZoomChange(nextZoom: number) {
    if (!natural) return;
    setZoom(nextZoom);
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
        frame,
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
      const sourceSize = frame / scale;
      ctx.drawImage(img, -offset.x / scale, -offset.y / scale, sourceSize, sourceSize, 0, 0, OUTPUT, OUTPUT);
      onSave(canvas.toDataURL("image/jpeg", 0.87));
    } catch {
      showToast("Couldn't crop that photo. Try another image.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Crop photo"
    >
      <div className="my-auto flex w-full min-w-0 max-w-sm flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
        <div>
          <h2 className="font-display text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">Crop photo</h2>
          <p className="mt-1 text-[12.5px] text-[var(--color-ink-soft)]">Drag to reposition, use the slider to zoom.</p>
        </div>

        <div
          ref={frameRef}
          className="relative mx-auto aspect-square w-full max-w-[260px] touch-none overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-border)]/20"
          style={{ cursor: natural ? "grab" : "default" }}
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
            className="min-w-0 flex-1 accent-[var(--color-accent)]"
            aria-label="Zoom"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" className="min-h-11 w-full sm:min-h-0 sm:w-auto" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" className="min-h-11 w-full sm:min-h-0 sm:w-auto" onClick={handleSave} disabled={!natural}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
