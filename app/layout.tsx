import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Manrope } from "next/font/google";
import "./globals.css";
import { wedding } from "@/lib/wedding";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const script = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });
const sans = Manrope({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: `${wedding.names.first} & ${wedding.names.second} | Our Wedding`,
  description: "You're invited. A cinematic, interactive wedding invitation — we can't wait to celebrate with you.",
  appleWebApp: { capable: true, title: "E & J", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
