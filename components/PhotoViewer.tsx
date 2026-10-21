"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type Photo = { src: string; alt: string; label: string };
type Props = { photos: readonly Photo[]; index: number | null; onChange: (i: number | null) => void };

/** Full-screen photo viewer: swipe or arrow keys to browse, Esc or tap outside to close. */
export default function PhotoViewer({ photos, index, onChange }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const touchX = useRef(0);
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    document.documentElement.classList.add("viewer-open");
    closeButton.current?.focus();
    return () => { document.documentElement.classList.remove("viewer-open"); restoreFocus.current?.focus(); };
  }, [open]);

  useEffect(() => {
    if (index === null) return;
    const n = photos.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") onChange((index + 1) % n);
      if (e.key === "ArrowLeft") onChange((index - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onChange]);

  if (index === null) return null;
  const n = photos.length;
  const step = (dir: number) => onChange((index + dir + n) % n);
  const photo = photos[index];

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={photo.alt} onClick={() => onChange(null)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchX.current; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); }}>
      <img src={photo.src} alt={photo.alt} onClick={(e) => e.stopPropagation()} />
      <p className="viewer-caption">{String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} · {photo.label}</p>
      <button ref={closeButton} type="button" className="round-button viewer-close" onClick={() => onChange(null)} aria-label="Close photo"><X size={20} /></button>
      <button type="button" className="round-button viewer-prev" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous photo"><ChevronLeft size={20} /></button>
      <button type="button" className="round-button viewer-next" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next photo"><ChevronRight size={20} /></button>
    </div>
  );
}
