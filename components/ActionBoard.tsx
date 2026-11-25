"use client";

import { useEffect, useId, useState } from "react";
import type { CareerDef, RunState } from "@/lib/game/types";
import type { Allocation } from "@/lib/game/engine";
import { money } from "@/lib/game/format";
import { ActionIcon } from "./Icons";

/*
 * COMPACT BY DEFAULT.
 *
 * The planner is used every week of a 156-week run, and it used to be the
 * tallest thing on the screen it lives on: every action was a card carrying
 * its blurb and two or three effect chips, so a Chef's eight actions took
 * about 1,700px on a phone (layout review, Nov 2026). Each action is now one
 * row — name, cost, the first effect line, the stepper — and the blurb and
 * the full list of effects open per row, or for every row at once from the
 * header. A per-viewer convenience, so it lives in localStorage, not the save.
 */
const DETAILS_KEY = "career-tycoon:planner-details:v1";

function readDetailsPref(): boolean {
  try {
    return window.localStorage.getItem(DETAILS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDetailsPref(on: boolean) {
  try {
    window.localStorage.setItem(DETAILS_KEY, on ? "1" : "0");
  } catch {
    /* Private mode or blocked storage: the toggle still works for this visit. */
  }
}

export function ActionBoard({
  career,
  state,
  alloc,
  budget,
  spent,
  onChange,
  bare = false,
}: {
  career: CareerDef;
  state: RunState;
  alloc: Allocation;
  budget: number;
  spent: number;
  onChange: (updater: (prev: Allocation) => Allocation) => void;
  /** Drop the panel chrome when the caller already provides it. */
  bare?: boolean;
}) {
  const remaining = budget - spent;
  const baseId = useId();
  const [allDetails, setAllDetails] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  /* Read after mount, so the server render and the first client render agree. */
  useEffect(() => setAllDetails(readDetailsPref()), []);

  const toggleAll = () => {
    const next = !allDetails;
    setAllDetails(next);
    setOpen(new Set());
    writeDetailsPref(next);
  };
  const toggleRow = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /**
   * Functional update, not `{...alloc}`. React batches clicks, so several in
   * quick succession all read the same stale `alloc` prop — the second click
   * on a button would overwrite the first, and a click on a *different* action
   * would silently discard everything allocated before it.
   */
  const set = (id: string, delta: number) => {
    onChange((prev) => {
      const action = career.actions.find((a) => a.id === id);
      if (!action) return prev;
      const units = Math.max(0, (prev[id] ?? 0) + delta);
      if (action.maxPerWeek !== undefined && units > action.maxPerWeek) {
        return prev;
      }
      const next = { ...prev, [id]: units };
      // The disabled state is computed from a possibly-stale render, so the
      // budget is enforced here too rather than trusted to the button.
      const total = career.actions.reduce(
        (sum, a) => sum + (next[a.id] ?? 0) * a.timeCost,
        0,
      );
      return total > budget ? prev : next;
    });
  };

  return (
    <div className={bare ? "" : "form"}>
      <div className="form-head flex items-center justify-between px-5 py-2.5">
        <h3 className="t-card text-ink">Your week</h3>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleAll}
            aria-pressed={allDetails}
            className="rounded-form px-1.5 py-0.5 text-[12px] text-ink-faint transition hover:text-clinical"
          >
            {allDetails ? "Hide details" : "Show details"}
          </button>
          {/* Blocks read as a rota strip: filled sessions against the week. */}
          <div className="flex gap-0.5" aria-hidden>
            {Array.from({ length: budget }).map((_, i) => (
              <span
                key={i}
                className={`h-3.5 w-2.5 border transition ${
                  i < spent
                    ? "border-clinical bg-clinical"
                    : "border-rule bg-card"
                }`}
              />
            ))}
          </div>
          <span className="num text-[12px] text-ink-soft">
            {remaining} left
          </span>
        </div>
      </div>

      <div className="divide-y divide-rule-soft">
        {career.actions
          .filter((a) => !a.unlocked || a.unlocked(state))
          .map((action) => {
            const units = alloc[action.id] ?? 0;
            const atMax =
              action.maxPerWeek !== undefined && units >= action.maxPerWeek;
            const canAdd = remaining >= action.timeCost && !atMax;
            const lines = action.preview(state);
            const expanded = allDetails || open.has(action.id);
            const detailsId = `${baseId}-${action.id}`;
            return (
              <div
                key={action.id}
                className={`spine px-4 py-2 transition ${
                  units > 0 ? "bg-clinical-tint" : "bg-card"
                }`}
                style={{
                  ["--dept" as string]: units > 0 ? "#35E0C0" : "transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={units > 0 ? "text-clinical" : "text-ink-faint"}
                  >
                    <ActionIcon name={action.id} />
                  </span>

                  {/* The whole label area is the disclosure: a big target on a
                      phone, and the stepper beside it stays its own control. */}
                  <button
                    type="button"
                    onClick={() => toggleRow(action.id)}
                    aria-expanded={expanded}
                    aria-controls={detailsId}
                    className="min-w-0 flex-1 rounded-form py-0.5 text-left"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="text-[14px] font-semibold text-ink">
                        {action.label}
                      </span>
                      {action.cashCost > 0 && (
                        <span className="num shrink-0 text-[12px] text-ink-faint">
                          {money(action.cashCost)}/block
                        </span>
                      )}
                      <span
                        aria-hidden
                        className={`ml-auto shrink-0 text-[13px] leading-none text-ink-soft transition ${
                          expanded ? "rotate-180" : ""
                        }`}
                      >
                        ▾
                      </span>
                    </span>
                    {lines[0] && !expanded && (
                      <span className="num line-clamp-2 block text-[12.5px] leading-snug text-ink-soft">
                        {lines[0]}
                      </span>
                    )}
                  </button>

                  <div className="flex shrink-0 items-center">
                    <button
                      onClick={() => set(action.id, -1)}
                      disabled={units === 0}
                      aria-label={`Fewer blocks on ${action.label}`}
                      className="h-8 w-8 rounded-l-form border border-rule bg-card text-ink-soft transition hover:bg-clinical-tint disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="num flex h-8 w-9 items-center justify-center border-y border-rule bg-card text-sm font-medium">
                      {units}
                    </span>
                    <button
                      onClick={() => set(action.id, +1)}
                      disabled={!canAdd}
                      aria-label={`More blocks on ${action.label}`}
                      className="h-8 w-8 rounded-r-form border border-rule bg-card text-ink-soft transition hover:border-clinical hover:text-clinical disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div id={detailsId} className="pb-1.5 pl-8 pt-1">
                    <p className="text-[13px] leading-snug text-ink-soft">
                      {action.blurb}
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                      {lines.map((line) => (
                        <li
                          key={line}
                          className="num rounded-sm bg-paper px-1.5 py-0.5 text-[12.5px] text-ink-soft"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
