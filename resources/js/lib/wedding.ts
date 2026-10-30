/** Edit this file to personalize the invitation. Venues stay "to be announced" until you fill them in. */
export const wedding = {
  names: { first: "Edwin", second: "Jochel" },
  monogram: "E & J",
  dateISO: "2026-12-26T15:00:00+08:00", // Drives the countdown and "Add to calendar" (+08:00 = Philippine time); empty = To be announced
  dateDisplay: "Saturday, December 26, 2026",
  timeDisplay: "Three o'clock in the afternoon",
  ceremonyVenue: "AC Villa Private Resort",
  receptionVenue: "AC Villa Private Resort", // Same as ceremonyVenue = one "Venue" line on the invitation
  venueName: "AC Villa Private Resort",
  venueAddress: "North Poblacion, Mabinay, Negros Oriental", // Shown on the invitation; enables the Directions link and map
  dressCode: "Formal to semi-formal · Any shade of blue",
  hashtag: "#EdwinAndJochel",
  rsvpDeadline: "Kindly reply by December 1, 2026",
  openRsvpMaxGuests: 5, // Seats a guest can pick without a personal invite link (links set their own seats in /admin)
  musicSrc: "", // Optional: e.g. "/audio/our-song.mp3" — adds a sound toggle and plays after "Open invitation"
  panoramaSrc: "", // Optional: a 360° equirectangular photo (2:1, e.g. from a drone or 360 camera) shown around the 3D gallery
  note: "With grateful hearts and the people we love, we begin our forever.",
} as const;

/** Replies close the day after the wedding; the countdown also switches to a thank-you then. */
export const weddingEndsAt = new Date(wedding.dateISO).getTime() + 86400000;

/** `focus` is where the couple are, as [x, y] from the photo's top-left (0–1). Screens that crop the photo
 *  (phones for wide shots, desktops for tall ones) keep that point in view instead of the photo's centre. */
export const scenicImages = [
  { src: "/images/walking-sunset.jpg", width: 2048, height: 1365, focus: [0.46, 0.5] },
  { src: "/images/forehead-kiss.jpg", width: 1365, height: 2048, focus: [0.45, 0.25] },
  { src: "/images/embrace-sea.jpg", width: 1365, height: 2048, focus: [0.55, 0.33] },
  { src: "/images/close-together.jpg", width: 2048, height: 1365, focus: [0.6, 0.4] },
  { src: "/images/shoulder-embrace.jpg", width: 1365, height: 2048, focus: [0.5, 0.42] },
  { src: "/images/reaching-hands.jpg", width: 1365, height: 2048, focus: [0.5, 0.5] },
  { src: "/images/tender-gaze.jpg", width: 1365, height: 2048, focus: [0.45, 0.28] },
  { src: "/images/carrying-love.jpg", width: 1365, height: 2048, focus: [0.55, 0.38] },
  { src: "/images/shoreline.jpg", width: 1365, height: 2048, focus: [0.5, 0.45] },
] as { src: string; width: number; height: number; focus: [number, number] }[]; // prenup-title.jpg is left out: its printed lettering would clash with the page text

export const galleryPhotos = [
  { src: "/images/embrace-sea.jpg", alt: "Edwin holding Jochel at the beach", label: "Us" },
  { src: "/images/forehead-kiss.jpg", alt: "Edwin kissing Jochel's forehead by the water", label: "Cherished" },
  { src: "/images/close-together.jpg", alt: "Edwin and Jochel sharing a quiet sunset moment", label: "Together" },
  { src: "/images/shoulder-embrace.jpg", alt: "Jochel resting her head on Edwin's shoulder by the sea", label: "Safe here" },
  { src: "/images/walking-sunset.jpg", alt: "Edwin and Jochel walking hand in hand through the shallow sea", label: "Hand in hand" },
  { src: "/images/tender-gaze.jpg", alt: "Jochel smiling at Edwin with her hand on his neck", label: "Only you" },
  { src: "/images/carrying-love.jpg", alt: "Edwin carrying Jochel at sunset", label: "Forever" },
  { src: "/images/reaching-hands.jpg", alt: "Edwin and Jochel reaching for each other's hands above the sea", label: "Reaching" },
  { src: "/images/shoreline.jpg", alt: "Edwin and Jochel walking barefoot along the shore", label: "Every step" },
];

/** Color motif — Gold and Royal Blue, with lighter and deeper shades of each. Change names/hex codes to your final swatches. */
export const colorMotif = {
  intro: "Our colors are Gold and Royal Blue: the warmth of gold for a love that shines, the depth of royal blue for a promise that lasts.",
  palette: [
    { name: "Royal Blue", hex: "#1F3FA0", note: "Our main color" },
    { name: "Midnight Royal", hex: "#14245E", note: "The deepest shade of blue" },
    { name: "Bright Royal", hex: "#4169E1", note: "A lighter, brighter blue" },
    { name: "Gold", hex: "#C9A24D", note: "Our main accent" },
    { name: "Champagne Gold", hex: "#E3C88A", note: "A soft, light gold" },
    { name: "Antique Gold", hex: "#9C7A3C", note: "A rich, deep gold" },
  ],
  attire: [
    { role: "Principal sponsors / Guests", detail: "Formal to semi-formal attire in any shade of blue." },
  ],
  avoid: "Kindly avoid white. We'd love to save it for the bride.",
};

/** Program of the day, in order. Only the ceremony shows a time; an empty `time` hides it. `icon` matches the icons in components/ProgramTimeline.tsx. */
export const program = [
  { time: "3:00 PM", title: "Wedding ceremony", icon: "rings" },
  { time: "", title: "Banquet guest arrival", icon: "car" },
  { time: "", title: "Host introduction", icon: "mic" },
  { time: "", title: "Couple's entrance & acknowledgement of sponsors and parents", icon: "heart" },
  { time: "", title: "Prayer & wedding dinner", icon: "utensils" },
  { time: "", title: "Cake cutting & wine toast", icon: "cake" },
  { time: "", title: "First dance & bouquet toss", icon: "music" },
  { time: "", title: "Games", icon: "puzzle" },
  { time: "", title: "Speeches & tributes", icon: "message" },
  { time: "", title: "Winners & prizes", icon: "trophy" },
  { time: "", title: "Group photo", icon: "camera" },
  { time: "", title: "Closing remarks", icon: "wine" },
] as const;

/** Guest notes (FAQ). Add, remove or reword freely; each one is a tap-to-open question. */
export const faq = [
  { q: "How do we get there?", a: "AC Villa Private Resort is in North Poblacion, Mabinay, Negros Oriental, about 2 hours by car from Dumaguete City. Use the map above or tap Directions for turn-by-turn navigation." },
  { q: "What time should we arrive?", a: "The ceremony begins at 3:00 PM, so please arrive a little early to find your seat. The reception follows right after." },
  { q: "Can I bring a plus-one?", a: "Our celebration is intimate, so we have reserved seats for each invitation. Your personal invitation link shows how many seats are saved for you." },
  { q: "Are children welcome?", a: "We love your little ones! Please include them in your guest count when you RSVP." },
  { q: "What should I wear?", a: "Formal to semi-formal attire in any shade of blue. Kindly avoid white. See the color motif above for ideas." },
  { q: "What if I can no longer attend?", a: "Life happens. Just open your invitation link again and update your RSVP so we can plan our seating." },
];

/** Gift guide. Add account details (e.g. GCash / bank) to `accounts` to show them; empty = hidden. */
export const gifts = {
  intro: "Your presence on our wedding day is the greatest gift of all. Should you wish to bless us further, here are a few ideas.",
  items: [
    { title: "Monetary gift", detail: "A blessing toward building our first home together, the most helpful gift for us.", icon: "envelope" },
    { title: "Honeymoon fund", detail: "Help us make memories on our first trip as husband and wife.", icon: "plane" },
    { title: "Home essentials", detail: "Kitchen and home pieces for the life we're starting.", icon: "home" },
    { title: "Prayers & wishes", detail: "Words of love and advice we can keep and read for years to come.", icon: "heart" },
  ],
  accounts: [] as { label: string; name: string; number: string }[], // e.g. { label: "GCash", name: "Edwin …", number: "09xx …" }
  note: "A gift table will be at the reception for envelopes and cards.",
};
