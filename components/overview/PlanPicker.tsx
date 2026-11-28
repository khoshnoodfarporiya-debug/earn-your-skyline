"use client";

import { useEffect, useState } from "react";
import type { CareerDef, RunState } from "@/lib/game/types";
import type { Allocation } from "@/lib/game/engine";
import {
  describePlan,
  planChoices,
  samePlan,
} from "@/lib/ui/recommend";
import { clampPlan } from "./QuickPlan";
import { ActionBoard } from "../ActionBoard";

/**
 * YOUR PLAN THIS WEEK
 *
 * The week is already planned when you arrive (see `planChoices`), so the
 * card leads with that plan and why, then the other plans as one-tap
 * choices. The block-by-block steppers are one tap further, behind "Change
 * it yourself": still there for a player who wants them, no longer the
 * first thing every player has to work through (owner's brief, Nov 2026).
 */

const OPEN_KEY = "career-tycoon:planner-open:v1";

function readOpen(): boolean {
  try {
    return window.localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}
function writeOpen(on: boolean) {
  try {
    window.localStorage.setItem(OPEN_KEY, on ? "1" : "0");
  } catch {
    /* Blocked storage: the toggle still works for this visit. */
  }
}

export function PlanPicker({
  career,
  state,
  alloc,
  budget,
  spent,
  lastWeek,
  onAllocate,
}: {
  career: CareerDef;
  state: RunState;
  alloc: Allocation;
  budget: number;
  spent: number;
  lastWeek: Allocation | null;
  onAllocate: (updater: (prev: Allocation) => Allocation) => void;
}) {
  const [open, setOpen] = useState(false);
  /* After mount, so the server render and the first client render agree. */
  useEffect(() => setOpen(readOpen()), []);
  const toggle = () => {
    setOpen(!open);
    writeOpen(!open);
  };

  const choices = planChoices(career, state, budget);
  const current = choices.find((c) => samePlan(c.alloc, alloc));
  const recommended = choices[0];
  const repeat = lastWeek ? clampPlan(career, lastWeek, budget, state) : {};
  const canRepeat = Object.values(repeat).some((n) => n > 0);
  /* Pressed only when no named plan already is, so one chip is lit at most. */
  const isRepeat = canRepeat && spent > 0 && !current && samePlan(repeat, alloc);

  /* A one-tap plan with no rest in it, while burnout is already high, says
     so: a warning, not a veto. The same threshold the alerts use. */
  const burnout = state.r.burnout ?? 0;
  const restless = (a: Allocation) => burnout >= 68 && (a.rest ?? 0) === 0;

  const title = current
    ? current.label
    : isRepeat
      ? "Last week again"
      : spent === 0
        ? "Nothing planned yet"
        : "Your own plan";
  const reason = current
    ? current.reason
    : isRepeat
      ? "The same week you committed last time."
      : spent === 0
        ? recommended
          ? `Recommended: ${recommended.label}. ${recommended.reason}`
          : "Pick a plan below, or change it yourself."
        : "Planned block by block.";

  return (
    <div>
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <p className="sign text-[11px] text-ink-faint">Your plan this week</p>
          {current && current === recommended && (
            <span className="sign rounded-full border border-clinical/50 px-2 py-0.5 text-[10.5px] text-clinical">
              Recommended
            </span>
          )}
        </div>
        <h3 className="display mt-1 text-[20px] leading-tight text-ink">
          {title}
        </h3>
        {spent > 0 && (
          <p className="num mt-1 text-[13.5px] font-semibold text-ink">
            {describePlan(career, alloc)}
          </p>
        )}
        <p className="mt-1 text-[13.5px] leading-snug text-ink-soft">{reason}</p>
        {/* Announced as the plan changes, the way the board used to. */}
        <p className="sr-only" aria-live="polite">
          {spent} of {budget} blocks assigned in week {state.week}
        </p>

        {/* The other weeks, one tap each. Pressed shows which one is on. */}
        <div data-tour="choices" className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Plans">
          {choices.map((c, i) => {
            const on = samePlan(c.alloc, alloc);
            const warn = restless(c.alloc);
            return (
              <button
                key={c.kind}
                type="button"
                aria-pressed={on}
                onClick={() => onAllocate(() => c.alloc)}
                title={describePlan(career, c.alloc)}
                className={`choice ${on ? "is-on" : ""} ${warn ? "border-caution/50" : ""}`}
              >
                {c.label}
                {i === 0 && <span className="sr-only"> (recommended)</span>}
                {warn && (
                  <>
                    <span aria-hidden className="ml-1.5 text-caution">⚠</span>
                    <span className="sr-only">
                      {" "}
                      — burnout is {Math.round(burnout)} and this week has no rest in it
                    </span>
                  </>
                )}
              </button>
            );
          })}
          {canRepeat && (
            <button
              type="button"
              aria-pressed={isRepeat}
              onClick={() => onAllocate(() => repeat)}
              title={describePlan(career, repeat)}
              className={`choice ${isRepeat ? "is-on" : ""}`}
            >
              Repeat last week
            </button>
          )}
        </div>
      </div>

      {/* Block by block, for a player who wants it. */}
      <div className="border-t border-rule-soft">
        <div className="flex items-center">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="flex min-h-[48px] flex-1 items-center gap-3 px-4 text-left transition hover:bg-card-high"
          >
            <span className="flex-1 text-[14px] font-semibold text-ink">
              Change it yourself
            </span>
            <span
              aria-hidden
              className={`text-[15px] text-ink-faint transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>
          {spent > 0 && open && (
            <button
              type="button"
              onClick={() => onAllocate(() => ({}))}
              className="btn btn-sm btn-quiet mr-3"
            >
              Clear
            </button>
          )}
        </div>
        {open && (
          <div className="fold-body">
            <ActionBoard
              career={career}
              state={state}
              alloc={alloc}
              budget={budget}
              spent={spent}
              onChange={onAllocate}
              bare
            />
          </div>
        )}
      </div>
    </div>
  );
}
