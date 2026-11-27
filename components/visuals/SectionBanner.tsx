"use client";

import type { ReactNode } from "react";
import { sectionVisual } from "@/lib/ui/visuals";
import { ArtFrame } from "./ArtFrame";

/**
 * SECTION BANNER
 *
 * The entrance to a screen: one shallow image with the screen's real title
 * and status laid over it in HTML. Nothing is baked into the artwork, so the
 * numbers are live, the text is selectable, and a screen reader gets the
 * heading rather than a description of scenery.
 *
 * Shallow on purpose. A banner that pushes the week's controls below the fold
 * has cost more than it gave, so the ratio is wide and the mobile height is
 * capped — the picture sets the scene and then gets out of the way.
 *
 * A section with no registered artwork renders as a plain header rather than
 * disappearing, which keeps the heading structure intact either way.
 */
export function SectionBanner({
  section,
  status,
  priority = false,
  children,
}: {
  section: string;
  /** Kept for the callers' readability; the title is drawn by ScreenTitle. */
  title?: string;
  kicker?: string;
  /** One short live sentence or figure, shown under the title. */
  status?: ReactNode;
  /** Only the first screen painted; everything else lazy-loads. */
  priority?: boolean;
  /** Overlay content pinned to the lower-right, e.g. an alert chip. */
  children?: ReactNode;
}) {
  const visual = sectionVisual(section);

  /*
   * The picture under a screen's title, captioned with one live figure, the
   * way the other careers' screens show theirs (CareerSceneBanner). It used
   * to carry the title too; that moved into the shared ScreenTitle (Nov 2026)
   * so every career's screens open the same way.
   */
  return (
    <ArtFrame
      visual={visual}
      ratio="aspect-[21/7]"
      scrim={visual?.scrim ?? "bottom"}
      sizes="(min-width: 1152px) 1104px, 100vw"
      priority={priority}
      /* mb-4: the panels below it are not in a .stack, so the gap is
         the banner's own, matching the header's above. */
      className="mb-4 rounded-lg border border-rule"
    >
      <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
        {status && (
          <p
            className="sign min-w-0 text-[11px] text-ink drop-shadow-[0_1px_5px_rgba(0,0,0,0.95)]"
          >
            {status}
          </p>
        )}
        {children}
      </div>
    </ArtFrame>
  );
}
