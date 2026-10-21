import { Cake, Camera, Church, DoorOpen, Moon, Music, Sparkles, UtensilsCrossed, Wine, type LucideIcon } from "lucide-react";
import { program } from "@/lib/wedding";

const icons: Record<(typeof program)[number]["icon"], LucideIcon> = {
  door: DoorOpen, church: Church, camera: Camera, wine: Wine, sparkles: Sparkles,
  utensils: UtensilsCrossed, music: Music, cake: Cake, moon: Moon,
};

/** Vertical program; page.tsx draws the gold line down it as the guest scrolls. */
export default function ProgramTimeline() {
  return (
    <div className="timeline">
      <span className="timeline-track" aria-hidden="true"><span className="timeline-progress" /></span>
      <ol>
        {program.map((item) => {
          const Icon = icons[item.icon];
          return (
            <li key={item.time + item.title} className="timeline-item reveal">
              <time className="timeline-time">{item.time}</time>
              <span className="timeline-node" aria-hidden="true"><Icon size={17} strokeWidth={1.4} /></span>
              <div className="timeline-body glass">
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
