import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disable PWA in dev mode
  register: true,
});

const nextConfig: NextConfig = {
  turbopack: {}, // Suppress webpack/turbopack conflict from PWA plugin
};

export default withPWA(nextConfig);
