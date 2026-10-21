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
- Effects play for every viewer, including devices set to reduce motion (an owner decision). A static photo + flat logo show if WebGL is unavailable.

## Logo and photos

- The logo is the gold E&J emblem from `uploads/11.png`, cleaned of stray transparent pixels and saved as `public/images/ej-logo.png` (1024px) and `ej-logo-512.png` (new filenames so browsers cannot show a cached older logo). `app/icon.png` / `app/apple-icon.png` are the browser and home-screen icons. (`ej-monogram.jpg` is the older flat artwork, kept for reference only and not used anywhere.)
- Photos from `uploads/` are copied into `public/images/` (Next.js only serves files from `public/`). The new ones are `forehead-kiss.jpg`, `shoulder-embrace.jpg` and `tender-gaze.jpg`. To add more, copy them to `public/images/` and list them in `scenicImages` (scrolling background) and/or `galleryPhotos` (360° gallery) in `lib/wedding.ts`. The 360° ring resizes itself for any number of photos.

## RSVP data storage

RSVPs are saved in a **SQLite** file, `data/rsvps.db`, created automatically on the first reply (`lib/db.ts`). The folder is git-ignored. **Back this file up**: it is your guest list.

**See the guest list:** open **`/admin`** (e.g. http://localhost:3000/admin) and sign in. You'll see every reply (name, attending or declined, number of guests, message, time received) plus totals.

The admin login lives in **`.env.local`** (git-ignored; see `.env.example`):

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`: the sign-in. Change the password to a strong one before sharing the site publicly.
- `SESSION_SECRET`: a random 32+ character string that signs the login cookie. Changing it signs everyone out.

Restart the server after editing `.env.local`. Sessions last 7 days; five wrong passwords lock that address out for 15 minutes.

**Hosting:** SQLite needs a server with a persistent disk (a VPS, Railway or Render with a volume, or a home server). It will **not** keep data on Vercel or Netlify, whose filesystems are wiped between requests.

The form lets guests choose up to five attendees; adjust `MAX_GUESTS` in `components/RsvpForm.tsx` and the check in `app/api/rsvp/route.ts` together.

## Files

- `/app/page.tsx` — scenes, wedding details, gallery, countdown, RSVP
- `/app/globals.css` — editorial coastal styling and mobile layout
- `/components/CinematicCanvas.tsx` — actual Three.js renderer + shader
- `/app/api/rsvp/route.ts` — RSVP API (validates and saves to SQLite)
- `/app/admin/` — password-protected guest list
- `/lib/db.ts`, `/lib/auth.ts` — SQLite storage and admin login
- `/lib/wedding.ts` — editable wedding information and photo order
- `/public/images/` — supplied original photo assets and logo

## Creative notes

Intended style: black and champagne-gold E&J opening, cinematic ocean-blues, cream-paper invitation, restrained typography, parallax through still photography. Photographs provided in-chat; all image rights remain with their respective owners.
