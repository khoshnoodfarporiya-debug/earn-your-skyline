import type { CareerDef, RunState } from "../game/types";
import type { Allocation } from "../game/engine";
import { weeklyBurnFor } from "./constraint";
import { kitchen } from "../game/careers/chef";
import { larderCovers } from "../game/careers/kitchen";

/**
 * PLAN IT FOR ME
 *
 * Every week starts with a sensible plan already filled in, chosen for the
 * situation you are in, with one sentence saying why (owner's brief, Nov
 * 2026: "some players are just not gonna do it because it's complicated").
 * The player can commit it as it stands, pick one of three other plans in
 * one tap, or change it block by block.
 *
 * The plans come from the balance harness's bots (`scripts/cities.ts`), which
 * play every career to its goal on allocations like these, so "Steady" is a
 * week that has been shown to work rather than a guess. Only the weekly time
 * is planned: what to buy, hire or take on stays the player's decision.
 */

export type PlanKind = "steady" | "earn" | "grow" | "rest";

export interface PlanChoice {
  kind: PlanKind;
  label: string;
  /** Why this plan, in one plain sentence. */
  reason: string;
  /** The week, spread over the real budget and only over actions this run has. */
  alloc: Allocation;
}

/** Blocks per action, filled in order until the week runs out. */
type Weights = Partial<Record<string, number>>;

interface CareerPlans {
  labels?: Partial<Record<PlanKind, string>>;
  steady: (s: RunState, has: (id: string) => boolean) => { w: Weights; why: string };
  earn: (s: RunState, has: (id: string) => boolean) => Weights;
  grow: (s: RunState, has: (id: string) => boolean) => Weights;
  rest: (s: RunState, has: (id: string) => boolean) => Weights;
}

const DEFAULT_LABELS: Record<PlanKind, string> = {
  steady: "Steady week",
  earn: "Push for money",
  grow: "Invest in growth",
  rest: "Rest up",
};

/** The first of these this run can actually do. */
const first = (has: (id: string) => boolean, ...ids: string[]) =>
  ids.find((id) => has(id));

/** The Chef's main service, or none while the larder is empty. */
const service = (s: RunState, has: (id: string) => boolean, ...ids: string[]) =>
  larderCovers(kitchen(s)) > 0 ? first(has, ...ids) : undefined;

const PLANS: Record<string, CareerPlans> = {
  doctor: {
    steady: () => ({
      w: { clinic: 3, manage: 1, study: 1, people: 1 },
      why: "Most of the week seeing patients, with time to run the practice, keep learning and keep people on side.",
    }),
    earn: () => ({ clinic: 5, manage: 1 }),
    grow: () => ({ outreach: 2, clinic: 2, network: 1, content: 1 }),
    rest: () => ({ rest: 3, exercise: 2, clinic: 1 }),
  },
  chef: {
    steady: (s, has) => {
      const main = first(has, "dinner", "counter", "lunch");
      const second = first(has, "lunch", "counter");
      /* An empty larder cannot serve anybody: booking services against it
         is booking empty rooms. Say what unblocks it instead. */
      if (main && larderCovers(kitchen(s)) <= 0) {
        return {
          w: { prep: 2, develop: 2, room: 2 },
          why: "The larder is empty, so no service can run yet. Buy produce on the Larder screen and this plan switches to services.",
        };
      }
      if (!main) {
        return {
          w: { prep: 2, develop: 2, room: 2 },
          why: "No service can run yet, so the week goes on prep and the menu. Buy produce on the Larder screen to open.",
        };
      }
      return {
        w: { [main]: 3, ...(second && second !== main ? { [second]: 1 } : {}), prep: 1, room: 1 },
        why: "Cook the stock before it spoils: three main services, prep to supply them, and time front of house.",
      };
    },
    earn: (s, has) => {
      const main = service(s, has, "dinner", "counter", "lunch");
      /* Nothing pays with an empty larder: the same week as Steady, which
         the list then drops as a duplicate rather than offer "Prep ×6". */
      if (!main) return { prep: 2, develop: 2, room: 2 };
      const second = service(s, has, "lunch", "counter", "catering");
      return { [main]: 4, ...(second && second !== main ? { [second]: 1 } : {}), prep: 1 };
    },
    grow: (s, has) => {
      const main = service(s, has, "dinner", "counter", "lunch");
      return { develop: 2, practise: 1, ...(main ? { [main]: 2 } : {}), prep: 1 };
    },
    rest: (s, has) => {
      const main = service(s, has, "dinner", "counter", "lunch");
      return { rest: 3, ...(main ? { [main]: 2 } : { room: 2 }), prep: 1 };
    },
  },
  lawyer: {
    steady: () => ({
      w: { casework: 4, pitch: 1, network: 1 },
      why: "Fees only arrive when cases settle, so most of the week goes on casework, with one block to win more.",
    }),
    earn: () => ({ casework: 5, pitch: 1 }),
    grow: () => ({ pitch: 2, network: 2, research: 2 }),
    rest: () => ({ rest: 3, casework: 3 }),
  },
  founder: {
    steady: (s, has) => ({
      w: has("pitch")
        ? { build: 2, sell: 2, pitch: 2 }
        : { build: 2, sell: 2, interview: 1, ...(s.r.cash > 8_000 ? { market: 1 } : { sell: 3 }) },
      why: has("pitch")
        ? "A round is open: keep building and selling, and give the pitch the time it needs."
        : "Build the product and sell it in equal measure, and keep listening to customers.",
    }),
    earn: () => ({ sell: 4, build: 2 }),
    grow: (s) => ({ build: 3, interview: 2, ...(s.r.cash > 8_000 ? { market: 1 } : { sell: 1 }) }),
    rest: () => ({ rest: 3, build: 2, sell: 1 }),
  },
  politician: {
    labels: { earn: "Campaign hard" },
    steady: () => ({
      w: { casework: 2, party: 2, canvass: 1, organise: 1 },
      why: "Support leaks every week: help constituents, keep the party behind you, and canvass the doors.",
    }),
    earn: (s) => ({ canvass: s.r.cash > 1_200 ? 4 : 2, casework: 2 }),
    grow: (s) => ({ party: 2, organise: 2, fundraise: 1, ...(s.r.cash > 2_000 ? { media: 1 } : { casework: 1 }) }),
    rest: () => ({ rest: 3, casework: 2, canvass: 1 }),
  },
  architect: {
    steady: () => ({
      w: { draw: 4, client: 1, court: 1 },
      why: "Commissions pay in stages, so most of the week at the board, with time to keep the client close.",
    }),
    earn: () => ({ draw: 5, client: 1 }),
    grow: () => ({ court: 2, compete: 2, draw: 2 }),
    rest: () => ({ rest: 3, draw: 2, client: 1 }),
  },
  engineer: {
    steady: () => ({
      w: { design: 3, test: 1, support: 1, sell: 1 },
      why: "Design on the bench, test what you build, and look after what you have already shipped.",
    }),
    earn: () => ({ sell: 2, support: 2, test: 2 }),
    grow: () => ({ design: 4, test: 2 }),
    rest: () => ({ rest: 3, design: 2, test: 1 }),
  },
};

const available = (career: CareerDef, state: RunState) =>
  career.actions.filter((a) => !a.unlocked || a.unlocked(state));

/** Spread weights over the real budget; leftovers go to the first action that takes them. */
export function spread(
  career: CareerDef,
  state: RunState,
  weights: Weights,
  budget: number,
): Allocation {
  const actions = available(career, state);
  const out: Allocation = {};
  let left = budget;
  for (const [id, want] of Object.entries(weights)) {
    const action = actions.find((a) => a.id === id);
    if (!action || left <= 0 || !want || want <= 0) continue;
    const units = Math.min(want, left, action.maxPerWeek ?? Infinity);
    if (units > 0) {
      out[id] = (out[id] ?? 0) + units;
      left -= units;
    }
  }
  if (left > 0) {
    /* What is left goes to the plan's own actions first, then anything. */
    const order = [
      ...Object.keys(weights).map((id) => actions.find((a) => a.id === id)).filter(Boolean),
      ...actions,
    ] as typeof actions;
    for (const action of order) {
      const room = Math.min(left, (action.maxPerWeek ?? Infinity) - (out[action.id] ?? 0));
      if (room > 0) {
        out[action.id] = (out[action.id] ?? 0) + room;
        left -= room;
      }
      if (left <= 0) break;
    }
  }
  return out;
}

/** Burnout at which the recommendation turns to rest. */
export const REST_AT = 65;

/**
 * The four plans for this week, the recommended one first.
 *
 * Recommended: rest when burnout is high, money when cash will not cover
 * three weeks of fixed costs, otherwise the career's steady week.
 */
export function planChoices(
  career: CareerDef,
  state: RunState,
  budget: number,
): PlanChoice[] {
  const plans = PLANS[career.id];
  if (!plans || budget <= 0) return [];
  const ids = new Set(available(career, state).map((a) => a.id));
  const has = (id: string) => ids.has(id);
  const label = (k: PlanKind) => plans.labels?.[k] ?? DEFAULT_LABELS[k];
  const steady = plans.steady(state, has);
  const burnout = Math.round(state.r.burnout ?? 0);
  const burn = weeklyBurnFor(state) ?? 0;

  const all: PlanChoice[] = [
    { kind: "steady", label: label("steady"), reason: steady.why, alloc: spread(career, state, steady.w, budget) },
    {
      kind: "earn",
      label: label("earn"),
      reason: "Everything into the work that pays this week.",
      alloc: spread(career, state, plans.earn(state, has), budget),
    },
    {
      kind: "grow",
      label: label("grow"),
      reason: "Less money now, more to work with later.",
      alloc: spread(career, state, plans.grow(state, has), budget),
    },
    {
      kind: "rest",
      label: label("rest"),
      reason:
        burnout >= 40
          ? `Three blocks of rest. Burnout is ${burnout} and only rest brings it down.`
          : "A lighter week: three blocks of rest, and the essentials.",
      alloc: spread(career, state, plans.rest(state, has), budget),
    },
  ];

  let pick: PlanKind = "steady";
  if (burnout >= REST_AT) {
    pick = "rest";
    all[3].reason = `Burnout is ${burnout}. Rest now, before it starts to cost you.`;
  } else if (state.r.cash < 0 || (burn > 0 && state.r.cash < burn * 3)) {
    pick = "earn";
    all[1].reason =
      state.r.cash < 0
        ? "You are overdrawn. You recover with work that pays, so that is where this week goes."
        : "Your cash covers less than three weeks of costs. This week goes on the work that pays.";
  }

  /* Drop a plan that came out the same as one before it: two buttons that do
     the same thing are one button too many. */
  const key = (a: Allocation) =>
    Object.entries(a).filter(([, n]) => n > 0).sort().map(([k, n]) => `${k}${n}`).join();
  const ordered = [all.find((p) => p.kind === pick)!, ...all.filter((p) => p.kind !== pick)];
  const seen = new Set<string>();
  return ordered.filter((p) => {
    const k = key(p.alloc);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** "Dinner ×3 · Prep ×1": a plan in one line, in the career's own action order. */
export function describePlan(career: CareerDef, alloc: Allocation): string {
  return career.actions
    .filter((a) => (alloc[a.id] ?? 0) > 0)
    .map((a) => `${a.label} ×${alloc[a.id]}`)
    .join(" · ");
}

/** Whether two allocations are the same week. */
export function samePlan(a: Allocation, b: Allocation): boolean {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const id of ids) if ((a[id] ?? 0) !== (b[id] ?? 0)) return false;
  return true;
}
