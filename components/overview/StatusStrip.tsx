"use client";

import type { RunState } from "@/lib/game/types";
import { money } from "@/lib/game/format";
import { cashTone, weeklyBurnFor } from "@/lib/ui/constraint";

/**
 * The three numbers a player should never have to hunt for: what is in the
 * bank, what is still owed, and how far along the goal is.
 *
 * It used to carry Week and Time left as well. The week now lives in the game
 * header on every screen, and the time left is the row of dots on the commit
 * bar, right beside the button that spends it (iPhone Week prototype, Nov
 * 2026). Each number now appears once.
 *
 * Sticky under the header so it stays true while scrolling a long screen.
 */
export function StatusStrip({
  state,
  goal,
}: {
  state: RunState;
  /** The career's objective progress, 0–1. */
  goal: number;
}) {
  /* Career-dispatched: the Chef's rent and wages, the Solicitor's chambers
     and salaries, the Physician's costs — each from its own model. Null means
     the career states its constraint its own way. */
  const burn = weeklyBurnFor(state) ?? 0;
  const pct = Math.round(Math.max(0, Math.min(1, goal)) * 100);

  const toneClass = {
    plain: "text-ink",
    good: "text-good",
    caution: "text-caution",
    alarm: "text-alarm",
  };

  const cells = [
    {
      label: "Cash",
      value: money(state.r.cash),
      /* "No fixed costs" is only claimable when the career's own model says
         the burn is genuinely zero — a Physician before the first lease. */
      sub:
        burn > 0
          ? `${money(burn)}/wk out`
          : weeklyBurnFor(state) === 0
            ? "no fixed costs"
            : "",
      tone: cashTone(state),
    },
    {
      label: "Debt",
      value: money(state.r.debt),
      sub: state.r.debt > 0 ? "to clear" : "cleared",
      tone: state.r.debt > 0 ? ("plain" as const) : ("good" as const),
    },
  ] as const;

  return (
    <div className="form sticky top-[calc(env(safe-area-inset-top)+0.5rem)] z-30 overflow-hidden">
      {/* A definition list, because that is what these are: labelled values.
          It gives each number an accessible name of its own. */}
      <dl className="grid grid-cols-3 gap-px bg-rule-soft">
        {cells.map((c) => (
          <div key={c.label} className="min-w-0 bg-card px-3 py-2.5 sm:px-4">
            <dt className="sign text-[11.5px] text-ink-faint">{c.label}</dt>
            <dd
              aria-label={`${c.label}: ${c.value} ${c.sub}`}
              className={`num mt-0.5 truncate text-[18px] font-semibold leading-tight tracking-tight sm:text-[22px] ${toneClass[c.tone]}`}
            >
              {c.value}
            </dd>
            <dd aria-hidden className="mt-0.5 truncate text-[12px] leading-none text-ink-faint">
              {c.sub}
            </dd>
          </div>
        ))}
        <div className="min-w-0 bg-card px-3 py-2.5 sm:px-4">
          <dt className="sign text-[11.5px] text-ink-faint">Goal</dt>
          <dd
            aria-label={`Goal: ${pct}% of the way`}
            className="num mt-0.5 text-[18px] font-semibold leading-tight tracking-tight text-clinical sm:text-[22px]"
          >
            {pct}%
          </dd>
          <dd aria-hidden className="mt-1.5 h-1 overflow-hidden rounded-full bg-rule">
            <span
              className="block h-full rounded-full bg-clinical"
              style={{ width: `${Math.max(2, pct)}%` }}
            />
          </dd>
        </div>
      </dl>
    </div>
  );
}
