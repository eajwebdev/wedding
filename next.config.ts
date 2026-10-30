import type { NextConfig } from "next";
// devIndicators: hides the round "N" badge Next.js shows in dev (never shown on the live site).
const nextConfig: NextConfig = { reactStrictMode: true, devIndicators: false };
export default nextConfig;
