import type { MetadataRoute } from "next";

/**
 * THE GAME ON A HOME SCREEN.
 *
 * Earn Your Skyline is phone-first (beta, Nov 2026: iPhone first, Android
 * later). This manifest is what lets "Add to Home Screen" install it as an
 * app: its own icon, its own name under the icon, and no browser chrome when
 * it opens. iOS reads the touch icon and `appleWebApp` from the layout; this
 * file is what Android and desktop Chrome read.
 *
 * Portrait only, because every screen is designed for a phone held upright.
 * The colours are the game's own navy, so the splash and the status bar never
 * flash white before the first frame.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Earn Your Skyline",
    short_name: "Skyline",
    description:
      "A career sim in seven professions, played one week at a time. Beta.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08111F",
    theme_color: "#08111F",
    categories: ["games", "simulation"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
