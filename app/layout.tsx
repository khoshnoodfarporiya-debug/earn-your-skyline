import type { Metadata } from "next";
import { Barlow, IBM_Plex_Mono, Saira_Condensed } from "next/font/google";
import "./globals.css";

/**
 * Console signage, a technical body face, and a clinical readout — the voice
 * of a management HUD rather than a document.
 */
const display = Saira_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const body = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Earn Your Skyline",
  description:
    "Start as a physician with $165,000 of debt and one exam room. Cases arrive whether or not you can treat them.",
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
