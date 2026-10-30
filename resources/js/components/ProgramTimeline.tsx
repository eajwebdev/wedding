import { Cake, Camera, Car, Gem, HeartHandshake, MessageCircleHeart, Mic, Music, Puzzle, Trophy, UtensilsCrossed, Wine, type LucideIcon } from "lucide-react";
import { program } from "@/lib/wedding";

const icons: Record<(typeof program)[number]["icon"], LucideIcon> = {
  rings: Gem, car: Car, mic: Mic, heart: HeartHandshake, utensils: UtensilsCrossed, cake: Cake,
  music: Music, puzzle: Puzzle, message: MessageCircleHeart, trophy: Trophy, camera: Camera, wine: Wine,
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
              {item.time && <time className="timeline-time">{item.time}</time>}
              <span className="timeline-node" aria-hidden="true"><Icon size={17} strokeWidth={1.4} /></span>
              <div className="timeline-body glass">
                <h3>{item.title}</h3>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
