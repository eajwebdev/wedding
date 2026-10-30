"use client";

import { useEffect, useState } from "react";
import { wedding, weddingEndsAt } from "@/lib/wedding";

export default function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  const target = new Date(wedding.dateISO).getTime();
  useEffect(() => {
    if (Number.isNaN(target)) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (now === null) return (
    <div className="countdown-pending glass">
      <span className="eyebrow">Save the date</span>
      <strong>Coming soon</strong>
      <p>Our date will be announced here.</p>
    </div>
  );

  if (now >= weddingEndsAt) return (
    <div className="countdown-pending glass">
      <span className="eyebrow">{wedding.dateDisplay}</span>
      <strong>Thank you</strong>
      <p>For celebrating with us and making our day complete.</p>
    </div>
  );

  if (now >= target) return (
    <div className="countdown-pending glass">
      <span className="eyebrow">{wedding.dateDisplay}</span>
      <strong>The day is here</strong>
      <p>See you at {wedding.venueName}.</p>
    </div>
  );

  const remaining = target - now;
  const units: [number, string][] = [
    [Math.floor(remaining / 86400000), "Days"],
    [Math.floor((remaining / 3600000) % 24), "Hours"],
    [Math.floor((remaining / 60000) % 60), "Minutes"],
    [Math.floor((remaining / 1000) % 60), "Seconds"],
  ];
  return (
    <div className="countdown" role="timer" aria-label="Countdown to our wedding">
      {units.map(([value, label]) => (
        <div key={label} className="time-unit glass">
          <strong key={value} className="tick">{String(value).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
