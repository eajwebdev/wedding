import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Manrope } from "next/font/google";
import "./globals.css";
import { wedding } from "@/lib/wedding";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const script = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });
const sans = Manrope({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-sans", display: "swap" });

const title = `${wedding.names.first} & ${wedding.names.second} | Our Wedding`;
const description = `You're invited! ${wedding.dateDisplay} at ${wedding.venueName}, ${wedding.venueAddress}. Tap to open our invitation and RSVP.`;

// Link previews (Messenger, Facebook, Viber) need absolute image URLs, so SITE_URL must be the public address, e.g. https://edwinandjochel.com.
// app/opengraph-image.jpg is the preview picture.
export const metadata: Metadata = {
  metadataBase: process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined,
  title,
  description,
  openGraph: { title, description, type: "website", locale: "en_PH", siteName: `${wedding.names.first} & ${wedding.names.second}` },
  twitter: { card: "summary_large_image", title, description },
  appleWebApp: { capable: true, title: "E & J", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#070d12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${script.variable} ${sans.variable}`}>
      <body>
        <noscript><style>{`.intro-gate{display:none!important}.wedding-site.is-gated .site-content{opacity:1!important;visibility:visible!important}`}</style></noscript>
        {children}
      </body>
    </html>
  );
}
