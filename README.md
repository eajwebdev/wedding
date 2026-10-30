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

Edit **`lib/wedding.ts`** for the wedding date and time, venue (`venueName`, `venueAddress`; when `ceremonyVenue` and `receptionVenue` are the same the invitation shows one Venue line), dress code, hashtag, RSVP deadline text, `openRsvpMaxGuests`, and the guest notes (`faq`). The countdown runs to `dateISO`; on the day it says "The day is here", and from the next day it thanks guests and the RSVP form closes.

**Music:** put an MP3 in `public/audio/` and set `musicSrc` (e.g. `"/audio/our-song.mp3"`). It starts when a guest taps Open invitation, and a sound button appears.

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

## RSVPs and personal invites

RSVPs are saved in **MySQL** tables, `invites` and `rsvps`, created automatically on first use (`lib/db.ts`). MySQL is used because every Hostinger plan includes it. **Back it up** now and then (hPanel → Databases → phpMyAdmin → Export): it is your guest list.

**See the guest list:** open **`/admin`** (e.g. http://localhost:3000/admin) and sign in. You'll see totals, every reply (name, attending or declined, number of guests, mobile number, message, time received), a delete button per reply, and a **CSV** download for the caterer and seating plan.

**Personal invite links (recommended):** in `/admin` → Personal invites, enter a guest or family name and their seats, then **Copy link** and send it. The link (`/?invite=CODE`) greets them by name on the opening screen, fills in their name, caps their guest count at their seats, and lets them change their answer later: a new answer replaces the old one, so there are no duplicates. `/admin` shows who has replied and who is still waiting. The plain site address still works for anyone without a link (up to `openRsvpMaxGuests` guests).

**Coming back:** guests who already opened the invitation in the same browser session, or who follow a link to a section (e.g. `/#rsvp`, `/#details`, `/#program`), skip the opening screen.

The settings live in **`.env`** (git-ignored; see `.env.example`):

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`: the sign-in. Change the password to a strong one before sharing the site publicly.
- `SESSION_SECRET`: a random 32+ character string that signs the login cookie. Changing it signs everyone out.
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: the MySQL database.
- `SITE_URL`: the site's public address (e.g. `https://edwinandjochel.com`). Messenger and Facebook need it to show the preview picture (`app/opengraph-image.jpg`) when you share the link.

Restart the server after editing `.env`. Sessions last 7 days; five wrong passwords lock that address out for 15 minutes.

**Local MySQL:** with XAMPP, start MySQL, create a database (e.g. `wedding`) in phpMyAdmin, and use `DB_HOST=localhost`, `DB_USER=root`, an empty `DB_PASSWORD`. Or point to the Hostinger database: hPanel → Databases → Remote MySQL, allow your IP, and use the hostname shown there.

## Deploy to Hostinger

Needs a Hostinger plan with **Node.js Web Apps**: **Business** or **Cloud** web hosting (or a VPS). The Single/Premium plans only run PHP and cannot run this site.

1. **Create the database:** hPanel → Websites → your site → Databases → Management. Create a database and user, and note the full names (Hostinger prefixes them, e.g. `u123456789_wedding`) and the password.
2. **Add the app:** hPanel → Websites → Add website → **Node.js Apps**. Import from GitHub (this repo) or upload a ZIP of the project **without** `node_modules`, `.next`, `data` and `.env`. Hostinger detects Next.js; use Node **20 or 22**, build command `npm run build`, start command `npm start`.
3. **Environment variables** (in the app's settings, before the first build): `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, plus `DB_HOST=localhost`, `DB_PORT=3306`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` from step 1, and `SITE_URL` = your domain with `https://`.
4. **Deploy**, connect your domain, and turn on SSL (hPanel → Security → SSL) so the admin login cookie is sent securely.
5. Send a test RSVP, check it appears at `/admin`, then delete it there.
6. Paste your link into the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and press **Scrape Again** so Messenger shows the new preview picture.

If RSVPs fail with a database error, check the app's runtime logs in hPanel; the usual causes are a wrong DB name/user (missing the `u123..._` prefix) or a wrong password. If `localhost` cannot connect, use the MySQL hostname shown in hPanel → Databases.

Guests without a personal link can choose up to `openRsvpMaxGuests` attendees (`lib/wedding.ts`); invite links allow 1 to 10 seats.

## Files

- `/app/page.tsx` — scenes, wedding details, gallery, countdown, RSVP
- `/app/globals.css` — editorial coastal styling and mobile layout
- `/components/CinematicCanvas.tsx` — actual Three.js renderer + shader
- `/app/api/rsvp/route.ts` — RSVP API (validates and saves to MySQL)
- `/app/api/invite/route.ts` — looks up a personal invite link
- `/app/admin/` — password-protected guest list, invite links, CSV export
- `/components/GuestNotes.tsx` — venue map and guest FAQ
- `/app/opengraph-image.jpg` — link preview picture for Messenger/Facebook
- `/lib/db.ts`, `/lib/auth.ts` — MySQL storage and admin login
- `/lib/wedding.ts` — editable wedding information and photo order
- `/public/images/` — supplied original photo assets and logo

## Creative notes

Intended style: black and champagne-gold E&J opening, cinematic ocean-blues, cream-paper invitation, restrained typography, parallax through still photography. Photographs provided in-chat; all image rights remain with their respective owners.
