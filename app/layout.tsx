import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

/*
 * TYPE (Nov 2026 redesign, docs/BRAND.md: earned, late-night, honest).
 *
 * The old faces — condensed signage, a technical body, a monospace readout
 * for every number — made a game read like a hospital dashboard. Now:
 *
 *   display  Fraunces: a warm editorial serif with optical sizes, for names,
 *            headings and the title. It is the voice of the brand.
 *   body     Inter: calm and very legible at phone sizes, with true
 *            tabular figures, so numbers line up without a monospace font.
 *   mono     IBM Plex Mono stays loaded for the rare place that genuinely
 *            wants a code-like face; nothing in the game's numbers uses it.
 */
const display = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

/**
 * WHERE THIS IS SERVED FROM
 *
 * `metadataBase` turns the relative asset paths Next generates — the tab icon,
 * the link-preview card — into the absolute URLs that Open Graph and Twitter
 * require. Without it Next guesses `http://localhost:3000` and says so at
 * build time, which would put a dead localhost URL in every shared link.
 *
 * Resolved from the environment rather than hardcoded, in falling order of
 * how much we trust it:
 *
 *   NEXT_PUBLIC_SITE_URL           set deliberately, so it wins outright
 *   VERCEL_PROJECT_PRODUCTION_URL  the stable production domain, if deployed there
 *   VERCEL_URL                     this specific deployment, for previews
 *   localhost:3500                 development, on the port `npm run dev` uses
 *
 * No production domain is invented here. Until one is set the value is
 * honestly local, which is correct for a game that has not been deployed.
 */
function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  /* Vercel supplies these without a protocol. */
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);

  return new URL("http://localhost:3500");
}

const TITLE = "Earn Your Skyline";
const DESCRIPTION =
  "Seven careers, one rule: the work arrives whether or not you can afford to do it. Build a practice, a kitchen, a chambers, a startup, a campaign, a studio or a workshop from debt to skyline.";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: TITLE,
  /* One page, so the canonical is the root. */
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    /*
     * No `images` here on purpose. `app/opengraph-image.png` is a Next file
     * convention: the framework finds it, reads its real dimensions and emits
     * the tags itself. Listing it again would produce a second, duplicate
     * og:image that could drift from the file.
     */
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  /*
   * Installed from Safari's "Add to Home Screen" it opens full screen with
   * its own name under the icon. `black-translucent` lets the navy run under
   * the status bar; the layout already pads for it with the safe-area insets
   * (see `viewport` below). The touch icon is `app/apple-icon.png`.
   */
  appleWebApp: {
    capable: true,
    title: "Skyline",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

/**
 * Phone-first viewport.
 *
 * `viewportFit: "cover"` lets the page run edge to edge on an iPhone with a
 * notch or Dynamic Island, which is what makes `env(safe-area-inset-*)`
 * report real values — the fixed CommitBar and nav already pad by them.
 * Zoom stays allowed: pinch-to-zoom is an accessibility feature, and
 * removing it would fail WCAG 1.4.4.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#08111F",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
