"use client";

import { useState } from "react";
import { Ban, Check, Copy } from "lucide-react";
import { colorMotif } from "@/lib/wedding";

/** Palette swatches (tap to copy the hex code for shopping), attire per role, and what to avoid. */
export default function ColorMotif() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (hex: string) => {
    navigator.clipboard?.writeText(hex).then(() => {
      setCopied(hex);
      window.setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1600);
    }).catch(() => {});
  };
  const ribbon = colorMotif.palette.map((c) => c.hex).join(",");

  return (
    <div className="motif">
      <p className="motif-intro reveal">{colorMotif.intro}</p>
      <div className="motif-ribbon reveal" style={{ background: `linear-gradient(90deg,${ribbon})` }} aria-hidden="true" />
      <ul className="swatches stagger">
        {colorMotif.palette.map((c) => (
          <li key={c.hex}>
            <button type="button" className="swatch" onClick={() => copy(c.hex)} aria-label={`${c.name}, ${c.hex}. Copy color code`}>
              <span className="swatch-chip" style={{ background: c.hex }}>
                {copied === c.hex ? <Check size={16} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.6} />}
              </span>
              <strong>{c.name}</strong>
              <em>{copied === c.hex ? "Copied" : c.hex}</em>
              <small>{c.note}</small>
            </button>
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
