"use client";

import type { RunState } from "@/lib/game/types";
import { money } from "@/lib/game/format";
import { campaign } from "@/lib/game/careers/politician";
import {
  BLOCS,
  ISSUES,
  allowanceOf,
  driftTable,
  nextOffice,
  officeOf,
  projectedShare,
  seatOf,
  selectionBlocker,
  thresholdFor,
  weeksToPoll,
  wouldHold,
} from "@/lib/game/careers/constituency";

/**
 * THE SEAT SCREEN
 *
 * Built around the one thing a player has to understand or the career is
 * unplayable: support is *moving*, always, toward wherever the positions have
 * left it, and only polling day counts.
 *
 * So the arithmetic is shown rather than implied. Every bloc's row says where
 * you are, where you are heading, and which way it is travelling — and the
 * top of the screen says how far away the only day that matters is.
 */
export function PoliticianScreens({
  state,
  onCommand,
}: {
  state: RunState;
  onCommand: (cmd: string, arg: string) => void;
}) {
  const c = campaign(state);
  const seat = seatOf(c);
  const office = officeOf(c);
  const share = projectedShare(c);
  const need = thresholdFor(c);
  const weeks = weeksToPoll(c, state.week);
  const holding = wouldHold(c);
  const rows = driftTable(c);
  const target = Math.max(
    0,
    Math.min(BLOCS.length - 1, Math.round(state.r._target ?? 0)),
  );

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------- the only day */}
      <section
        aria-labelledby="poll-h"
        className={`rounded-lg border p-4 ${
          holding ? "border-good/50 bg-good-tint" : "border-alarm/50 bg-alarm-tint"
        }`}
      >
        <h2 id="poll-h" className="text-sm font-semibold text-ink">
          {c.outOfOffice ? "Out of office" : `${office.label} for ${seat.name}`}
        </h2>

        {c.outOfOffice ? (
          <>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              The voters removed you. There is no allowance and no platform —
              but nothing here is over. Put your name forward again and the
              campaign starts from where your positions have left you.
            </p>
            <button
              type="button"
              onClick={() => onCommand("standAgain", "")}
              className="mt-3 rounded-form border border-rule px-3 py-1.5 text-xs text-ink transition hover:border-clinical hover:text-clinical"
            >
              Stand again
            </button>
          </>
        ) : (
          <>
            <p className="num mt-1 text-3xl leading-none">
              <span className={holding ? "text-good" : "text-alarm"}>
                {(share * 100).toFixed(1)}%
              </span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              If polling day were today you would take{" "}
              {(share * 100).toFixed(1)}% against a bar of{" "}
              {(need * 100).toFixed(1)}% — {holding ? "you hold" : "you lose"}.
              The count is in {weeks} week{weeks === 1 ? "" : "s"}, and it is
              the only moment any of this is banked.
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rule-soft pt-3 sm:grid-cols-4">
              <Stat label="Polling day" value={`Week ${c.electionWeek}`} />
              <Stat label="The bar" value={`${(need * 100).toFixed(1)}%`} />
              <Stat label="Allowance" value={`${money(allowanceOf(c))}/wk`} />
              <Stat label="Party standing" value={String(Math.round(c.party))} />
            </dl>
          </>
        )}
      </section>

      {/* ------------------------------------------------------ the drift */}
      <section
        aria-labelledby="blocs-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="blocs-h" className="text-sm font-semibold text-ink">
          The electorate, and which way it is moving
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          Every bloc drifts toward where your positions leave it, at{" "}
          {Math.round(seat.drift * 100)}% a week. Campaigning lifts you above
          that line; it never moves the line.
        </p>

        <ul className="mt-3 space-y-3">
          {rows.map(({ bloc, now, lean, gap }) => (
            <li key={bloc.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-xs font-medium text-ink">
                  {bloc.label}
                </span>
                <span className="num text-[11.5px] text-ink-faint">
                  {Math.round(bloc.share * 100)}% of the seat ·{" "}
                  {Math.round(bloc.turnout * 100)}% turn out
                </span>
              </div>
              <p className="text-[11.5px] leading-snug text-ink-faint">
                {bloc.blurb}
              </p>

              <div className="mt-1.5 flex items-center gap-2">
                <span
                  role="meter"
                  aria-valuenow={Math.round(now)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Support among ${bloc.label}`}
                  className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-rule-soft"
                >
                  <span
                    className="block h-full rounded-full bg-clinical transition-[width] duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, now))}%` }}
                  />
                  {/* Where it is heading, marked on the same track. */}
                  <span
                    aria-hidden
                    className="absolute top-0 h-full w-0.5 bg-gold"
                    style={{ left: `${Math.max(0, Math.min(99, lean))}%` }}
                  />
                </span>
                <span className="num w-24 shrink-0 text-right text-[11.5px]">
                  <span className="text-ink">{Math.round(now)}</span>
                  <span
                    className={
                      Math.abs(gap) < 1
                        ? "text-ink-faint"
                        : gap > 0
                          ? "text-alarm"
                          : "text-good"
                    }
                  >
                    {" "}
                    {Math.abs(gap) < 1
                      ? "steady"
                      : gap > 0
                        ? `↓ ${Math.round(lean)}`
                        : `↑ ${Math.round(lean)}`}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => onCommand("targetBloc", bloc.id)}
                aria-pressed={BLOCS[target].id === bloc.id}
                className={`mt-1.5 rounded-form border px-2.5 py-1 text-[11.5px] transition ${
                  BLOCS[target].id === bloc.id
                    ? "border-clinical bg-clinical-tint text-clinical"
                    : "border-rule text-ink-soft hover:border-clinical hover:text-clinical"
                }`}
              >
                {BLOCS[target].id === bloc.id
                  ? "Targeting this bloc"
                  : "Target this bloc"}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-rule-soft pt-3 text-[11.5px] text-ink-faint">
          The gold mark on each bar is where that bloc settles if you stop
          working. Everything to the right of it is a loan.
        </p>
      </section>

      {/* --------------------------------------------------- the positions */}
      <section
        aria-labelledby="pos-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="pos-h" className="text-sm font-semibold text-ink">
          Where you stand
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          Positions move the line rather than the bar. Nothing here pleases
          everybody, and changing your mind in public costs you across the whole
          seat.
          {c.reversals.length > 0 && (
            <span className="text-caution">
              {" "}
              You have reversed {c.reversals.length} position
              {c.reversals.length === 1 ? "" : "s"} — that is{" "}
              {c.reversals.length * 6} points off every bloc.
            </span>
          )}
        </p>

        <ul className="mt-3 space-y-3">
          {ISSUES.map((issue) => {
            const taken = c.positions[issue.id];
            return (
              <li key={issue.id} className="rounded border border-rule-soft p-3">
                <p className="text-xs font-medium text-ink">{issue.question}</p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {issue.stances.map((st) => {
                    const on = taken === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          onCommand("takePosition", `${issue.id}:${st.id}`)
                        }
                        aria-pressed={on}
                        className={`rounded-form border px-3 py-2 text-left text-[11.5px] transition ${
                          on
                            ? "border-clinical bg-clinical-tint"
                            : "border-rule hover:border-clinical"
                        }`}
                      >
                        <span
                          className={`block font-medium ${on ? "text-clinical" : "text-ink"}`}
                        >
                          {st.label}
                        </span>
                        <span className="block text-ink-faint">{st.blurb}</span>
                        <span className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                          {BLOCS.map((b) => {
                            const d = st.effects[b.id] ?? 0;
                            if (d === 0) return null;
                            return (
                              <span
                                key={b.id}
                                className={`num ${d > 0 ? "text-good" : "text-alarm"}`}
                              >
                                {d > 0 ? "+" : ""}
                                {d} {b.label.split(" ")[0].toLowerCase()}
                              </span>
                            );
                          })}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {taken && c.reversals.includes(issue.id) && (
                  <p className="mt-1.5 text-[11.5px] text-caution">
                    You changed your mind on this one in public.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------ the ladder */}
      <section
        aria-labelledby="ladder-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="ladder-h" className="text-sm font-semibold text-ink">
          The ladder
        </h2>
        <Ladder state={state} onCommand={onCommand} />
      </section>

      {/* ------------------------------------------------------- the record */}
      {c.results.length > 0 && (
        <section
          aria-labelledby="record-h"
          className="rounded-lg border border-rule bg-card p-4"
        >
          <h2 id="record-h" className="text-sm font-semibold text-ink">
            Your record
          </h2>
          <ul className="mt-2 space-y-1">
            {[...c.results].reverse().map((r, i) => (
              <li
                key={`${r.week}-${i}`}
                className="flex items-baseline justify-between gap-3 text-xs"
              >
                <span className="text-ink-faint">Week {r.week}</span>
                <span className={r.won ? "text-good" : "text-alarm"}>
                  {r.won ? "Held" : "Lost"} on {(r.share * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Ladder({
  state,
  onCommand,
}: {
  state: RunState;
  onCommand: (cmd: string, arg: string) => void;
}) {
  const c = campaign(state);
  const next = nextOffice(c);
  const blocked = selectionBlocker(c);

  if (!next) {
    return (
      <p className="mt-1 text-xs text-ink-faint">
        There is nothing above this. Holding it is the whole job now.
      </p>
    );
  }

  return (
    <>
      <p className="mt-1 text-xs text-ink-faint">
        {next.label} — {next.blurb} A {Math.round(next.term / 52)}-year term,{" "}
        {next.pay}× the allowance, and a seat that is{" "}
        {next.opposition > 0
          ? `${(next.opposition * 100).toFixed(0)} points harder to hold`
          : "no harder to hold"}
        .
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={blocked !== null || c.outOfOffice}
          onClick={() => onCommand("seekSelection", "")}
          className="rounded-form border border-rule px-3 py-1.5 text-xs text-ink transition enabled:hover:border-clinical enabled:hover:text-clinical disabled:cursor-not-allowed disabled:opacity-45"
        >
          Ask to be selected
        </button>
        <span className="text-xs text-ink-faint">
          {c.outOfOffice
            ? "Not while you are out of office."
            : (blocked ?? "The party would put you up. A new campaign, and a new polling day.")}
        </span>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="sign text-[10.5px] leading-none text-ink-faint">{label}</dt>
      <dd className="num mt-1 text-[13.5px] leading-none text-ink">{value}</dd>
    </div>
  );
}
