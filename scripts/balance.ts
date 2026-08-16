/**
 * Balance harness. Plays the Physician career to completion under fixed
 * strategies and checks the design's claims hold:
 *
 *   1. Grinding alone must LOSE — one person cannot outwork an organisation.
 *   2. Resting alone must LOSE — the bills do not stop.
 *   3. Buying capacity without opening new medicine must FALL SHORT.
 *   4. Following the caseload signal must be able to WIN.
 *
 * Claim 3 is the important one: it is what makes the medical layer a game
 * rather than decoration.
 *
 * Run: npx tsx scripts/balance.ts
 */

import { doctor, med, netWorth } from "../lib/game/careers/doctor";
import {
  advanceWeek,
  resolveEventChoice,
  runCommand,
  startRun,
} from "../lib/game/engine";
import { strategies, type Strategy } from "./strategy";
import { hasMilestone } from "../lib/game/timeline";
import { SETBACK_LABEL } from "../lib/game/setbacks";

/**
 * The horizon.
 *
 * The game no longer ends, so a run has to be *stopped* to be measured. 156
 * weeks is the old week limit, chosen deliberately: every balance figure in
 * the README was produced under it, so the numbers stay comparable across the
 * change that removed it.
 */
const HORIZON = 156;

/**
 * What "success" means now that nothing wins.
 *
 * The old measure was `outcome.kind === "won"`, which the sandbox change
 * deleted — and with it, briefly, every figure in the harness went to zero.
 * The replacement is the milestone that *used* to be the win: debt cleared and
 * the practice worth the goal. Same threshold, same meaning, no ending.
 */
const REACHED = "the-hospital-is-yours";

function play(strategy: Strategy, seed: number) {
  let s = startRun(doctor, seed);
  /* The week the goal was first reached, or null. Recorded rather than
     inferred, because the run keeps going afterwards and the state at the
     horizon no longer tells you when it happened. */
  let reachedWeek: number | null = null;

  for (let i = 0; i < HORIZON; i++) {
    // Each command is attempted independently: one unaffordable purchase must
    // not mask the ones listed after it.
    for (const c of strategy.shop(s)) {
      s = runCommand(doctor, s, c.cmd, c.arg);
    }

    const budget = doctor.timeBudget(s);
    const result = advanceWeek(doctor, s, strategy.plan(s, budget));
    s = result.state;

    // Always takes the first option, so this measures a floor not a ceiling.
    if (result.event) {
      s = resolveEventChoice(doctor, s, result.event.def, 0);
    }

    if (reachedWeek === null && hasMilestone(s, REACHED)) reachedWeek = s.week;
  }
  return { state: s, reachedWeek };
}

/**
 * Seeds per strategy. 40 is a fast default for iterating; pass a larger
 * number to separate signal from sampling noise:
 *
 *   npm run balance -- 200
 *
 * At 40 seeds the standard error on a ~65% rate is about 7.5 points, so
 * mid-table gaps under ~15 points mean nothing. At 200 it falls to ~3.4.
 */
const RUNS = Math.max(1, Number(process.argv[2]) || 40);
/** 95% confidence half-width for a rate p over n runs, in percentage points. */
const margin = (wins: number, n: number) => {
  const p = wins / n;
  return 1.96 * Math.sqrt((p * (1 - p)) / n) * 100;
};

console.log(`\nPhysician — ${RUNS} runs per strategy\n${"─".repeat(70)}`);

for (const strategy of strategies) {
  let wins = 0;
  const endWeeks: number[] = [];
  const worths: number[] = [];
  const depts: number[] = [];
  const staff: number[] = [];
  const causes: Record<string, number> = {};

  for (let i = 0; i < RUNS; i++) {
    const { state: s, reachedWeek } = play(strategy, 1000 + i * 37);
    if (reachedWeek !== null) {
      wins++;
      endWeeks.push(reachedWeek);
    }
    /* What the run was carrying at the horizon. A setback is no longer an
       ending, so this is a snapshot of trouble rather than a cause of death —
       and "clear" is now a real and common answer. */
    const carrying =
      (s.setbacks ?? []).map((x) => SETBACK_LABEL[x.kind]).join(" + ") || "clear";
    causes[carrying] = (causes[carrying] ?? 0) + 1;
    worths.push(netWorth(s));
    depts.push(med(s).departments.length);
    staff.push(med(s).staff.length);
  }

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  console.log(`\n${strategy.name}`);
  console.log(
    `  reached goal  ${((wins / RUNS) * 100).toFixed(0)}% ±${margin(wins, RUNS).toFixed(1)}`,
  );
  console.log(
    `  avg week      ${endWeeks.length ? avg(endWeeks).toFixed(0) : "—"} (when reached)`,
  );
  console.log(
    `  avg net worth $${Math.round(avg(worths)).toLocaleString("en-US")}`,
  );
  console.log(
    `  built         ${avg(depts).toFixed(1)} departments, ${avg(staff).toFixed(1)} staff`,
  );
  console.log(
    `  at week ${HORIZON}   ${Object.entries(causes)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(", ")}`,
  );
}
console.log("");
