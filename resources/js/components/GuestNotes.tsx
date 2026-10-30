import { MapPin, Plus } from "lucide-react";
import { faq, wedding } from "@/lib/wedding";

const place = `${wedding.venueName}, ${wedding.venueAddress}`;

/** Map to the venue plus tap-to-open answers to the questions guests usually message about. */
export default function GuestNotes() {
  return (
    <div className="notes">
      <figure className="notes-map glass reveal">
        <iframe title={`Map to ${wedding.venueName}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=14&output=embed`}
          loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        <figcaption>
          <span><strong>{wedding.venueName}</strong>{wedding.venueAddress}</span>
          <a className="outline-button light" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`}>
            <MapPin size={16} /> Directions</a>
        </figcaption>
      </figure>
      <div className="faq stagger">
        {faq.map((item) => (
          <details key={item.q} className="faq-item glass">
            <summary>{item.q}<Plus size={18} strokeWidth={1.5} aria-hidden="true" /></summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
