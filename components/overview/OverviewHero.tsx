"use client";

import type { CareerDef, RunState } from "@/lib/game/types";
import { med } from "@/lib/game/careers/doctor";
import {
  PRACTICE_STAGES,
  careerVisual,
  practiceStageIndex,
  sectionVisual,
} from "@/lib/ui/visuals";
import { ArtFrame } from "../visuals/ArtFrame";

/**
 * THE OVERVIEW HERO
 *
 * What you have built and one sentence on how it is going, over the art.
 *
 * It used to also list Week, Based in and Practice, and badge the most urgent
 * warning. Each of those was on screen twice: the week and city are in the
 * game header, the practice is this heading, and warnings are in "Needs you"
 * just below. Dropping them took the hero from about 330px to 150px on a
 * phone (iPhone Week prototype, Nov 2026), so the week's decision starts on
 * the first screen.
 *
 * Everything on it is live HTML over the artwork — nothing is baked into the
 * picture — so a screen reader gets a heading and a sentence rather than
 * "image". It is the only above-the-fold image in the app and therefore the
 * only one marked `priority`.
 */
export function OverviewHero({
  career,
  state,
}: {
  career: CareerDef;
  state: RunState;
}) {
  const m = state.careerId === "doctor" ? med(state) : null;
  const stage = m ? practiceStageIndex(m) : -1;
  /* The practice ladder is the Physician's. A career without one shows what
     it is worth instead of being told it has no premises — a Chef starts on a
     market stall, so "No premises yet" was simply untrue. */
  const stageLabel = m
    ? (PRACTICE_STAGES[stage]?.label ?? "No premises yet")
    : career.scoreboard(state).label;

  /*
   * One sentence about the state of the run. Chosen from real figures rather
   * than written per-week, and ordered so the worst news wins: a practice
   * bleeding money does not need to be told how many patients it has.
   */
  const line = (() => {
    if (state.r.cash < 0) return "You are overdrawn. Fix the cash before anything else.";
    if (m && m.outbreaks.length > 0) {
      return `${m.outbreaks.length} outbreak${m.outbreaks.length === 1 ? "" : "s"} running in your network.`;
    }
    if (state.r.burnout >= 70) return "You are running on empty. Rest is not optional now.";
    if (state.r.debt <= 0) return "Debt-free. Everything from here is yours.";
    /*
     * The patient list is a Physician fact. A Chef has no `panel` at all, so
     * this read `NaN patients on your list` on their first week. Every career
     * has a scoreboard, so fall through to the one it defines for itself.
     */
    if (!m) {
      /* One fact and what it is worth, not the whole scoreboard: the full
         sub-line ran to five figures on a phone ("−$37,000 · $14,000 cash ·
         0 live · $0 billed · $0 unbilled"), and the cash is in the strip
         right below. So: the headline figure, named, plus its first clause
         that is not the cash. */
      const sb = career.scoreboard(state);
      const isMoney = /^-?\$/.test(sb.value);
      const head = isMoney ? `Worth ${sb.value.replace(/^-/, "−")}` : sb.value;
      const clause = sb.sub.split(" · ").find((x) => !/\bcash$/i.test(x));
      return clause ? `${head} · ${clause}` : head;
    }
    return `${Math.round(state.r.panel).toLocaleString("en-US")} patients on your list.`;
  })();

  return (
    <section aria-labelledby="overview-hero-title" className="form overflow-hidden">
      <ArtFrame
        /*
         * Each career's own picture; the Physician keeps the practice
         * overview it was drawn for.
         */
        visual={
          career.id === "doctor"
            ? sectionVisual("overview")
            : (careerVisual(career.id) ?? sectionVisual("overview"))
        }
        /*
         * A fixed height rather than a ratio, so a wide screen crops the art
         * instead of growing a 370px hero. `object-cover` does the cropping.
         */
        ratio="h-[150px] w-full sm:h-[200px]"
        scrim="full"
        sizes="(min-width: 1152px) 1104px, 100vw"
        priority
      >
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
          <p className="sign text-[11.5px] text-clinical drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {career.label}
          </p>
          <h1
            id="overview-hero-title"
            className="display mt-0.5 text-[26px] leading-none text-ink drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] sm:text-4xl"
          >
            {stageLabel}
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-snug text-ink-soft drop-shadow-[0_1px_5px_rgba(0,0,0,0.95)]">
            {line}
          </p>
        </div>
      </ArtFrame>
    </section>
  );
}
