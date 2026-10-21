/** Edit this file to personalize the invitation. Venues stay "to be announced" until you fill them in. */
export const wedding = {
  names: { first: "Edwin", second: "Jochel" },
  monogram: "E & J",
  dateISO: "2026-12-26T15:00:00+08:00", // Drives the countdown and "Add to calendar" (+08:00 = Philippine time); empty = To be announced
  dateDisplay: "Saturday, December 26, 2026",
  timeDisplay: "Three o'clock in the afternoon",
  ceremonyVenue: "Ceremony venue to be announced",
  receptionVenue: "Reception venue to be announced",
  venueAddress: "", // Optional: enables Get directions link
  dressCode: "Formal · Gold & Royal Blue",
  hashtag: "#EdwinAndJochel",
  rsvpDeadline: "RSVP details to follow",
  musicSrc: "", // Optional: e.g. "/audio/our-song.mp3" — adds a sound toggle and plays after "Open invitation"
  panoramaSrc: "", // Optional: a 360° equirectangular photo (2:1, e.g. from a drone or 360 camera) shown around the 3D gallery
  note: "With grateful hearts and the people we love, we begin our forever.",
} as const;

export const scenicImages = [
  { src: "/images/walking-sunset.jpg", width: 2048, height: 1365 },
  { src: "/images/forehead-kiss.jpg", width: 1365, height: 2048 },
  { src: "/images/embrace-sea.jpg", width: 1365, height: 2048 },
  { src: "/images/close-together.jpg", width: 2048, height: 1365 },
  { src: "/images/shoulder-embrace.jpg", width: 1365, height: 2048 },
  { src: "/images/reaching-hands.jpg", width: 1365, height: 2048 },
  { src: "/images/tender-gaze.jpg", width: 1365, height: 2048 },
  { src: "/images/carrying-love.jpg", width: 1365, height: 2048 },
  { src: "/images/shoreline.jpg", width: 1365, height: 2048 },
]; // prenup-title.jpg is left out: its printed lettering would clash with the page text

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
  intro: "Our colors are Gold and Royal Blue — the warmth of gold for a love that shines, the depth of royal blue for a promise that lasts.",
  palette: [
    { name: "Royal Blue", hex: "#1F3FA0", note: "Our main color" },
    { name: "Midnight Royal", hex: "#14245E", note: "The deepest shade of blue" },
    { name: "Bright Royal", hex: "#4169E1", note: "A lighter, brighter blue" },
    { name: "Gold", hex: "#C9A24D", note: "Our main accent" },
    { name: "Champagne Gold", hex: "#E3C88A", note: "A soft, light gold" },
    { name: "Antique Gold", hex: "#9C7A3C", note: "A rich, deep gold" },
  ],
  attire: [
    { role: "Principal sponsors", detail: "Gentlemen in Barong Tagalog with black slacks. Ladies in a Filipiniana or long gown in Gold or Champagne Gold." },
    { role: "Entourage", detail: "Bridesmaids in Royal Blue long gowns. Groomsmen in Royal Blue or Midnight Royal suits with a Gold tie." },
    { role: "Guests", detail: "Formal attire in Royal Blue, Gold, or any shade of either. Gentlemen in long sleeves or barong; ladies in a dress or gown." },
  ],
  avoid: "Kindly avoid white, ivory and cream — we'd love to save those for the bride.",
};

/** Program of the day. Times assume the 3:00 PM ceremony; adjust to your final schedule. `icon` matches lucide icons in app/page.tsx. */
export const program = [
  { time: "2:30 PM", title: "Guest arrival", detail: "Find your seat and settle in as the sun begins to dip.", icon: "door" },
  { time: "3:00 PM", title: "Wedding ceremony", detail: "Edwin and Jochel exchange their vows.", icon: "church" },
  { time: "4:00 PM", title: "Family & entourage photos", detail: "Stay close — we'd love a picture with you.", icon: "camera" },
  { time: "5:00 PM", title: "Cocktail hour", detail: "Light bites and drinks at golden hour.", icon: "wine" },
  { time: "6:00 PM", title: "Reception & grand entrance", detail: "The newlyweds are introduced for the first time.", icon: "sparkles" },
  { time: "6:30 PM", title: "Dinner", detail: "A shared table with the people we love.", icon: "utensils" },
  { time: "7:30 PM", title: "First dance & toasts", detail: "Messages from our family and friends.", icon: "music" },
  { time: "8:00 PM", title: "Cake cutting & money dance", detail: "A sweet slice and a Filipino tradition of blessings.", icon: "cake" },
  { time: "9:00 PM", title: "Party & send-off", detail: "One last dance under the stars.", icon: "moon" },
] as const;

/** Gift guide. Add account details (e.g. GCash / bank) to `accounts` to show them; empty = hidden. */
export const gifts = {
  intro: "Your presence on our wedding day is the greatest gift of all. Should you wish to bless us further, here are a few ideas.",
  items: [
    { title: "Monetary gift", detail: "A blessing toward building our first home together — the most helpful gift for us.", icon: "envelope" },
    { title: "Honeymoon fund", detail: "Help us make memories on our first trip as husband and wife.", icon: "plane" },
    { title: "Home essentials", detail: "Kitchen and home pieces for the life we're starting.", icon: "home" },
    { title: "Prayers & wishes", detail: "Words of love and advice we can keep and read for years to come.", icon: "heart" },
  ],
  accounts: [] as { label: string; name: string; number: string }[], // e.g. { label: "GCash", name: "Edwin …", number: "09xx …" }
  note: "A gift table will be at the reception for envelopes and cards.",
};
