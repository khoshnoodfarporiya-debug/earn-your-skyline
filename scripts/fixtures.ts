/**
 * DETERMINISTIC BROWSER FIXTURES
 *
 * Saves the end-to-end tests preload into localStorage, written by the real
 * engine so they are always a shape the validator accepts. Nothing here is a
 * hand-built object literal: a fixture that drifts from the save contract
 * would make the browser tests pass while the app was broken.
 *
 * Regenerate with `npm run fixtures`. The output is committed so a test run
 * needs no build step of its own.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { doctor, med } from "../lib/game/careers/doctor";
import { advanceWeek, runCommand, startRun } from "../lib/game/engine";
import { EVENT_VISUALS } from "../lib/ui/visuals";
import { postContext } from "../lib/game/medical/phone";
import { POSTS } from "../lib/game/medical/posts";
import type { RunState } from "../lib/game/types";

const OUT = join("e2e", "fixtures");
mkdirSync(OUT, { recursive: true });

const write = (name: string, state: RunState) => {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(state));
  console.log(
    `${name}: week ${state.week}, ${state.outcome ? state.outcome.kind : "in play"}`,
  );
};

const cmd = (s: RunState, c: string, a: string) => runCommand(doctor, s, c, a);

/* ------------------------------------------------- a run part-way through */
{
  let s = startRun(doctor, 21);
  s.r.cash = 500_000;
  s = cmd(s, "enterCity", "madrid");
  s = cmd(s, "buyFacility", "clinic:madrid");
  s = cmd(s, "hire", "nurse");
  s = cmd(s, "openDepartment", "paediatrics");
  for (let i = 0; i < 3; i++) s = advanceWeek(doctor, s, { clinic: 4 }).state;
  write("midrun", s);
}

/* ------------------------------- one week short of the real win condition */
{
  const s = startRun(doctor, 55);
  s.week = 120;
  // The genuine condition: debt cleared AND net worth over the goal.
  s.r.debt = 0;
  s.r.cash = 3_000_000;
  if (s.outcome) throw new Error("fixture must not already carry an outcome");
  write("nearly-won", s);
}

/* --------------------------------- one week short of a serious setback
 *
 * This fixture used to assert the run LOST. Nothing loses any more: the four
 * automatic terminators became recoverable setbacks, so the useful fixture is
 * a run about to fall into one — which gives the browser suite something to
 * drive the recovery interface against.
 *
 * Insolvency rather than burnout: the weekly resolution *reduces* burnout by
 * a couple of points, so a run sitting at 99 recovers faster than a week of
 * clinic can push it. Overdraft has no such counter-force.
 */
{
  const s = startRun(doctor, 55);
  s.week = 60;
  s.r.cash = -59_800; // insolvency begins below -$60,000
  const probe = advanceWeek(doctor, JSON.parse(JSON.stringify(s)), { rest: 4 });
  const fell = (probe.state.setbacks ?? []).some((x) => x.kind === "insolvency");
  if (!fell) {
    throw new Error(
      `nearly-lost fixture does not enter insolvency: cash ${probe.state.r.cash}`,
    );
  }
  if (probe.state.outcome) {
    throw new Error(
      "nearly-lost fixture ENDED the run — the sandbox rule has regressed",
    );
  }
  console.log("  (falls into insolvency, and keeps playing)");
  write("nearly-lost", s);
}

/* ------------------------- the week before an event that carries artwork */
{
  const illustrated = new Set(Object.keys(EVENT_VISUALS));
  let found: RunState | null = null;

  outer: for (let seed = 1; seed <= 80 && !found; seed++) {
    let s = startRun(doctor, seed);
    s.r.cash = 300_000;
    for (let w = 0; w < 60; w++) {
      const before = JSON.parse(JSON.stringify(s)) as RunState;
      const { state, event } = advanceWeek(doctor, s, { rest: 4 });
      if (event && illustrated.has(event.def.id)) {
        console.log(`  (event ${event.def.id} at seed ${seed} week ${before.week})`);
        found = before;
        break outer;
      }
      if (state.outcome) break;
      s = state;
    }
  }
  if (!found) throw new Error("no illustrated event found in 80 seeds");
  write("before-event", found);
}

/* ------------------- a run with something worth posting about and no post
   yet made, so the once-a-week rule can be exercised in a single week */
{
  let s = startRun(doctor, 7);
  s.r.cash = 200_000;
  s = cmd(s, "hire", "nurse");
  s = cmd(s, "openDepartment", "paediatrics");
  s = cmd(s, "buyEquipment", "lab");
  s = advanceWeek(doctor, s, { clinic: 4 }).state;

  const m = med(s);
  if (m.phone.lastPostWeek !== 0) {
    throw new Error("fixture expects no post made yet");
  }
  // The composer is only useful if it has something in it.
  const ctx = postContext(m, { week: s.week, panel: s.r.panel });
  const available = POSTS.filter(
    (p) => p.available(ctx) && !(p.once && m.phone.postsMade.includes(p.id)),
  );
  if (available.length === 0) {
    throw new Error("phone fixture has nothing available to post");
  }
  console.log(`  (${available.length} posts available: ${available.map((p) => p.label).join(", ")})`);
  write("phone-ready", s);
}
