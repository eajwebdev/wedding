"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import PhotoViewer, { type Photo } from "@/components/PhotoViewer";

/** Swipeable 3D coverflow (native scroll-snap underneath). Used when the 360° WebGL gallery can't run. */
export default function Gallery({ photos }: { photos: readonly Photo[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;
      el.querySelectorAll<HTMLElement>(".cf-item").forEach((item, i) => {
        const d = (item.offsetLeft + item.offsetWidth / 2 - center) / item.offsetWidth;
        const ad = Math.min(Math.abs(d), 1.6);
        if (Math.abs(d) < bestDistance) { bestDistance = Math.abs(d); best = i; }
        const card = item.firstElementChild as HTMLElement;
        const c = Math.max(-1.6, Math.min(1.6, d));
        card.style.transform = `perspective(1100px) translateZ(${-ad * 130}px) rotateY(${c * -30}deg)`;
        card.style.opacity = String(1 - ad * 0.3);
      });
      setActive(best);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { el.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    const item = el?.querySelectorAll<HTMLElement>(".cf-item")[i];
    if (!el || !item) return;
    el.scrollTo({ left: item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2, behavior: "smooth" });
  }, []);

  return (
    <div className="coverflow">
      <div className="cf-track" ref={track} role="list" aria-label="Photo gallery — swipe to browse">
        {photos.map((photo, i) => (
          <div className="cf-item" role="listitem" key={photo.src}>
            <button type="button" className="cf-card" aria-label={`View photo: ${photo.alt}`}
              onClick={() => (i === active ? setViewer(i) : goTo(i))}>
              <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" draggable={false} />
              <span className="cf-caption"><em>{String(i + 1).padStart(2, "0")}</em>{photo.label}</span>
              <span className="cf-expand" aria-hidden="true"><Expand size={16} strokeWidth={1.6} /></span>
            </button>
          </div>
        ))}
      </div>
      <div className="cf-controls">
        <button type="button" className="round-button" onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0} aria-label="Previous photo"><ChevronLeft size={20} /></button>
        <div className="cf-dots" aria-hidden="true">
          {photos.map((p, i) => <span key={p.src} className={i === active ? "on" : ""} />)}
        </div>
        <button type="button" className="round-button" onClick={() => goTo(Math.min(photos.length - 1, active + 1))} disabled={active === photos.length - 1} aria-label="Next photo"><ChevronRight size={20} /></button>
      </div>
      <PhotoViewer photos={photos} index={viewer} onChange={setViewer} />
    </div>
  );
}
