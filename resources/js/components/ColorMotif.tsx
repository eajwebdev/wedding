"use client";

import { Ban } from "lucide-react";
import { colorMotif } from "@/lib/wedding";

/** Palette swatches, attire per role, and what to avoid. */
export default function ColorMotif() {
  const ribbon = colorMotif.palette.map((c) => c.hex).join(",");

  return (
    <div className="motif">
      <p className="motif-intro reveal">{colorMotif.intro}</p>
      <div className="motif-ribbon reveal" style={{ background: `linear-gradient(90deg,${ribbon})` }} aria-hidden="true" />
      <ul className="swatches stagger">
        {colorMotif.palette.map((c) => (
          <li key={c.hex} className="swatch">
            <span className="swatch-chip" style={{ background: c.hex }} aria-hidden="true" />
            <strong>{c.name}</strong>
            <small>{c.note}</small>
          </li>
        ))}
      </ul>
      <div className="attire-grid stagger">
        {colorMotif.attire.map((a) => (
          <article key={a.role} className="attire-card glass">
            <p className="eyebrow">{a.role}</p>
            <p>{a.detail}</p>
          </article>
        ))}
      </div>
      <p className="motif-avoid reveal">
        <span className="avoid-chip" aria-hidden="true"><Ban size={15} strokeWidth={1.6} /></span>
        {colorMotif.avoid}
      </p>
    </div>
  );
}
