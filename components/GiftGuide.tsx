import { Heart, House, Mail, Plane, type LucideIcon } from "lucide-react";
import { gifts } from "@/lib/wedding";

const icons: Record<(typeof gifts.items)[number]["icon"], LucideIcon> = { envelope: Mail, plane: Plane, home: House, heart: Heart };

export default function GiftGuide() {
  return (
    <div className="gifts">
      <p className="motif-intro reveal">{gifts.intro}</p>
      <ul className="gift-grid stagger">
        {gifts.items.map((g, i) => {
          const Icon = icons[g.icon];
          return (
            <li key={g.title} className="gift-card glass">
              <span className="gift-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <span className="gift-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.4} /></span>
              <h3>{g.title}</h3>
              <p>{g.detail}</p>
            </li>
          );
        })}
      </ul>
      {gifts.accounts.length > 0 && (
        <dl className="gift-accounts glass reveal">
          {gifts.accounts.map((a) => (
            <div key={a.label + a.number}><dt>{a.label}</dt><dd>{a.name}<small>{a.number}</small></dd></div>
          ))}
        </dl>
      )}
      <p className="gift-note reveal">{gifts.note}</p>
    </div>
  );
}
