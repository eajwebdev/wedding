# Edwin & Jochel — Cinematic Wedding Invitation

A real **Next.js + Three.js** scroll-parallax wedding invitation using the provided E&J monogram and original prenup photographs. The original photographers' watermarks are preserved.

## Start locally

Requirements: Node.js 20.9+ and an internet connection the first time you install dependencies.

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. Production build: `npm run build && npm run start`.

## Customize

Edit **`lib/wedding.ts`** to provide the wedding date, time, ceremony/reception venues, dress code and hashtag. All those facts currently have honest **To be announced** placeholders. The countdown activates as soon as you provide a valid `dateISO`, e.g. `2027-06-12T15:00:00+08:00`.

## Program, color motif and gifts

`lib/wedding.ts` also holds `program` (the order of the day), `colorMotif` (palette swatches with hex codes, attire per role, colors to avoid) and `gifts` (gift ideas, optional GCash/bank `accounts`, and a note). These are starter suggestions built around the 3:00 PM ceremony and the Gold & Royal Blue motif — edit them to your final plans.

## 3D / animation implementation

- **Opening gate** — "Open invitation" screen (also asks iOS for motion-sensor permission and starts optional music).
- **`components/CinematicCanvas.tsx`** — fixed WebGL stage:
  - The E&J monogram as a free-standing **cast-gold 3D emblem** (transparent cut-out, stacked layers for real thickness, PBR metal + studio environment reflections). It glides from the gate into the hero and spins as the invitation opens.
  - Original photos as a backdrop with depth parallax, Ken Burns push, a noise-based "silk" dissolve between photos, film grade, light leak and grain.
  - Gold dust / bokeh particles.
  - Mouse parallax on desktop, **gyroscope tilt on phones**.
- **`components/Gallery360.tsx`** — **360° photo ring** filmed as one scroll-driven shot: **Drone fly** (aerial approach) → **Orbit 360°** (a full circle around the ring) → dive over the rim → **Focus pull** (focus racks from the fireflies at the lens onto the first photo; depth of field is done with mip-level blur, no post-processing). A badge names each move as it plays. Guests then drag, tilt or use the arrows to look around 360°, and tap a photo to open it full screen. Falls back to a swipeable coverflow (`Gallery.tsx`) without WebGL.
- GSAP ScrollTrigger split-word title reveals, 3D tilt + glare on the invitation card. No menus: the invitation is one continuous scroll.
- Honest note: the source photos are ordinary stills, so the 360° and drone effects are a 3D presentation of those stills, not real aerial or panoramic footage. To use a **real 360° photo** (e.g. a drone or 360-camera panorama, 2:1 equirectangular), put it in `public/images/` and set `panoramaSrc` in `lib/wedding.ts`; it becomes the environment around the 3D gallery.
- `prefers-reduced-motion` is respected; a static photo + flat logo show if WebGL is unavailable.

## Logo and photos

- The logo is the gold E&J emblem from `uploads/11.png`, cleaned of stray transparent pixels and saved as `public/images/ej-logo.png` (1024px) and `ej-logo-512.png` (new filenames so browsers cannot show a cached older logo). `app/icon.png` / `app/apple-icon.png` are the browser and home-screen icons. (`ej-monogram.jpg` is the older flat artwork, kept for reference only and not used anywhere.)
- Photos from `uploads/` are copied into `public/images/` (Next.js only serves files from `public/`). The new ones are `forehead-kiss.jpg`, `shoulder-embrace.jpg` and `tender-gaze.jpg`. To add more, copy them to `public/images/` and list them in `scenicImages` (scrolling background) and/or `galleryPhotos` (360° gallery) in `lib/wedding.ts`. The 360° ring resizes itself for any number of photos.

## RSVP data storage

By default, without Supabase credentials, RSVPs are **demo-only** and saved on the submitting device (browser localStorage). The UI explicitly says responses are not sent anywhere. Do not use the prototype publicly for collecting responses until the backend is configured.

To accept real RSVPs:

1. Create a Supabase project, run **`supabase-schema.sql`** in its SQL editor.
2. Copy `.env.example` to `.env.local` and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` **server-side only** (never prefix secrets with `NEXT_PUBLIC_`).
3. Restart the server. `app/api/rsvp/route.ts` will submit validated responses to Supabase via server-side API. Inspect the `wedding_rsvps` table to see responses.

Before launch, consider adding bot/rate limits, specific guest allowance checks, privacy notice and notification workflow. Current form lets guests choose up to five attendees; adjust this per your invitations.

## Files

- `/app/page.tsx` — scenes, wedding details, gallery, countdown, RSVP
- `/app/globals.css` — editorial coastal styling and mobile layout
- `/components/CinematicCanvas.tsx` — actual Three.js renderer + shader
- `/app/api/rsvp/route.ts` — optional protected RSVP API
- `/lib/wedding.ts` — editable wedding information and photo order
- `/public/images/` — supplied original photo assets and logo

## Creative notes

Intended style: black and champagne-gold E&J opening, cinematic ocean-blues, cream-paper invitation, restrained typography, parallax through still photography. Photographs provided in-chat; all image rights remain with their respective owners.
