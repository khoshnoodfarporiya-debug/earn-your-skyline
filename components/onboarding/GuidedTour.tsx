"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Mentor } from "@/lib/ui/mentors";

/**
 * THE FIRST-RUN TOUR
 *
 * The mentor shows a new player around their first week by pointing, not by
 * explaining (owner's brief, Nov 2026: "indicate where should the player go
 * ... instead of having everything written down"). The screen dims except
 * for the one thing being talked about, and a short line from the mentor
 * sits beside it.
 *
 * The page underneath stays live: the dimming does not take clicks, so the
 * player can tap the highlighted plan or the commit button itself, and the
 * commit step waits for exactly that. Skip ends it at any point, and it is
 * filed in the taught list like the lessons, so it runs once per career.
 */

export interface TourStep {
  /** A `data-tour` value to spotlight; none dims the whole screen. */
  target?: string;
  text: string;
  /** Waits for the player to do the thing, instead of offering Next. */
  waitFor?: string;
}

export function GuidedTour({
  mentor,
  steps,
  step,
  onNext,
  onSkip,
}: {
  mentor: Mentor;
  steps: TourStep[];
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const s = steps[step];
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [view, setView] = useState({ w: 0, h: 0 });
  const nextRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleH, setBubbleH] = useState(180);

  /* Find the visible element for this step (the phone and desktop layouts
     each carry their own commit button), bring it into view once, then
     follow it as the page scrolls or reflows. */
  useEffect(() => {
    if (!s?.target) {
      setRect(null);
      setView({ w: window.innerWidth, h: window.innerHeight });
      /* The tour opens at the top of the Week screen, where it starts. */
      if (step === 0) window.scrollTo({ top: 0 });
      return;
    }
    const find = () =>
      [...document.querySelectorAll<HTMLElement>(`[data-tour="${s.target}"]`)].find(
        (el) => el.getClientRects().length > 0,
      );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = find();
    if (el) {
      /* Pinned things (the money strip, the commit bar, the tab bar) are
         already on screen; a sticky one is best seen from the top of the
         page. Everything else is scrolled to the middle if it is not. */
      const pos = getComputedStyle(el).position;
      let pinned: string | null = pos === "sticky" || pos === "fixed" ? pos : null;
      for (let p = el.parentElement; p && !pinned; p = p.parentElement) {
        const q = getComputedStyle(p).position;
        if (q === "fixed") pinned = "fixed";
      }
      if (pinned === "sticky") {
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      } else if (!pinned) {
        const r = el.getBoundingClientRect();
        const offscreen = r.top < 80 || r.bottom > window.innerHeight - 150;
        if (offscreen) el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      }
    }
    /* Measured now, then whenever the page scrolls, resizes or reflows. Not
       a per-frame loop: that stops in a background tab and leaves the
       spotlight on the previous target. */
    let last = "";
    const measure = () => {
      const now = find();
      const r = now ? now.getBoundingClientRect() : null;
      const sig = r
        ? `${r.top}|${r.left}|${r.width}|${r.height}|${window.innerWidth}|${window.innerHeight}`
        : `none|${window.innerWidth}|${window.innerHeight}`;
      if (sig !== last) {
        last = sig;
        setRect(r);
        setView({ w: window.innerWidth, h: window.innerHeight });
      }
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    /* A smooth scroll fires scroll events; this catches anything else that
       moves the target (an image loading above it). */
    const timer = window.setInterval(measure, 300);
    return () => {
      window.removeEventListener("scroll", measure, { capture: true });
      window.removeEventListener("resize", measure);
      ro.disconnect();
      window.clearInterval(timer);
    };
  }, [s?.target, step]);

  /* Measured per step: the bubble is placed by its own height. */
  useLayoutEffect(() => {
    if (bubbleRef.current) setBubbleH(bubbleRef.current.offsetHeight);
  }, [step, view.w]);

  /* Focus follows the conversation, without scrolling the page under it. */
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip]);

  if (!s) return null;

  const pad = 6;
  const w = Math.min(360, (view.w || 375) - 24);
  /* Below the target when it sits in the top half of the screen, above it
     otherwise, and centred on it horizontally where there is room. */
  let top: number;
  let left: number;
  if (rect) {
    const below = rect.top + rect.height / 2 < (view.h || 812) / 2;
    top = below ? rect.bottom + pad + 12 : rect.top - pad - 12 - bubbleH;
    top = Math.max(12, Math.min(top, (view.h || 812) - bubbleH - 12));
    left = rect.left + rect.width / 2 - w / 2;
    left = Math.max(12, Math.min(left, (view.w || 375) - w - 12));
  } else {
    top = Math.max(12, ((view.h || 812) - bubbleH) / 2);
    left = ((view.w || 375) - w) / 2;
  }

  return (
    <>
      {/* The dimming, with a lit window over the target. It takes no clicks. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
        {rect ? (
          <div
            className="tour-spot absolute rounded-[16px]"
            style={{
              top: rect.top - pad,
              left: rect.left - pad,
              width: rect.width + pad * 2,
              height: rect.height + pad * 2,
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[#04080F]/70" />
        )}
      </div>

      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-text"
        className="tour-bubble form fixed z-[71] border border-clinical/40 p-4 shadow-lift"
        style={{ top, left, width: w }}
      >
        <div key={step} className="swap-in flex items-start gap-3">
          <Image
            src={mentor.portrait}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full border border-rule object-cover"
          />
          <div className="min-w-0">
            <p className="sign text-[11px] text-clinical">{mentor.name}</p>
            <p id="tour-text" aria-live="polite" className="mt-0.5 text-[15px] leading-snug text-ink">
              {s.text}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <p className="num text-[12px] text-ink-faint">
            {step + 1} of {steps.length}
          </p>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onSkip} className="btn btn-sm btn-quiet">
              Skip tour
            </button>
            {s.waitFor ? (
              <span className="flex items-center px-1 text-[13px] font-semibold text-clinical">
                {s.waitFor}
              </span>
            ) : (
              <button
                ref={nextRef}
                type="button"
                onClick={onNext}
                className="btn btn-sm btn-secondary"
              >
                {step === steps.length - 1 ? "Done" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
