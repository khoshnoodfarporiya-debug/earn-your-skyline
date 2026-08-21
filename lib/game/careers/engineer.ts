import type { CareerDef, LedgerLine, RunState } from "../types";
import type { SetbackKind } from "../setbacks";
import { money } from "../format";
import { pushLog } from "../engine";
import {
  PRODUCT_BY_ID,
  WORKSHOP_CITIES,
  WORKSHOP_CITY_BY_ID,
  buildableKinds,
  certWeeksFor,
  confidenceOf,
  designNeeded,
  designProgress,
  estimateOf,
  faultCost,
  initialWorkshop,
  kindOf,
  productName,
  recallCost,
  revenueOf,
  shippedProducts,
  surfaceChance,
  testYield,
  workshopCityOf,
  workshopRevenue,
  wouldCertify,
  type Product,
  type WorkshopState,
} from "./workshop";

/**
 * THE ENGINEER
 *
 * See `workshop.ts` for the model, and in particular for why `latent` never
 * reaches a screen.
 *
 * ------------------------------------------------------------ the week
 *
 *   Design   builds the product — and puts faults into it, every week
 *   Test     takes faults out, and narrows what you know about the rest
 *   Certify  submits it; the certifier fails what is too far gone
 *   Support  cleans up what has already reached customers
 *
 * The one rule that makes this career its own: **designing is what creates
 * the defects**. Nothing else in the game punishes you for doing the work.
 * A bigger, better product is a bigger, worse liability, and the only defence
 * is weeks that produce nothing a customer can see.
 */

const START_CASH = 24_000;
const START_DEBT = 30_000;

export const workshop = (s: RunState): WorkshopState =>
  s.data.workshop as WorkshopState;

const goalFor = (s: RunState): number =>
  Math.round(700_000 * workshopCityOf(workshop(s)).revenueIndex);

const worthOf = (s: RunState): number => s.r.cash - s.r.debt;

function focused(w: WorkshopState): Product | undefined {
  const live = w.products.filter((p) => p.stage !== "withdrawn");
  return live.find((p) => p.id === w.focus) ?? live[0];
}

export const engineer: CareerDef = {
  id: "engineer",
  label: "Engineer",
  tagline:
    "A workshop, a prototype that nearly works, and a certification body with no interest in your timeline.",
  distinctRule:
    "Your constraint is defect risk. Everything you ship carries latent faults that surface weeks later, so shipping faster raises revenue now and liability you cannot see yet.",
  icon: "gear",
  available: true,
  weekLimit: 156,

  timeBudget: (s) => (s.r.burnout > 80 ? 5 : 6),

  resources: [
    {
      id: "cash",
      label: "Cash",
      hint: "What the shipped products bring in, minus what the broken ones cost.",
      format: "money",
      polarity: "higher-better",
      display: "stat",
    },
    {
      id: "debt",
      label: "Equipment loan",
      hint: "The bench, the oscilloscope, and the year you spent not selling anything.",
      format: "money",
      polarity: "lower-better",
      display: "stat",
    },
    {
      id: "reputation",
      label: "Standing",
      hint: "Whether anybody trusts the next thing you make. Faults in the field take it.",
      format: "int",
      min: 0,
      max: 100,
      polarity: "higher-better",
      display: "meter",
    },
    {
      id: "skill",
      label: "Craft",
      hint: "Better engineering means fewer faults per week of design, not none.",
      format: "int",
      min: 0,
      max: 100,
      polarity: "higher-better",
      display: "meter",
    },
    {
      id: "burnout",
      label: "Burnout",
      hint: "Test rigs at midnight and the certifier's questions in the morning.",
      format: "int",
      min: 0,
      max: 100,
      polarity: "lower-better",
      display: "meter",
    },
  ],

  actions: [
    {
      id: "design",
      label: "At the bench",
      blurb:
        "Build the thing. Every week of it puts faults in that you cannot see yet.",
      timeCost: 1,
      cashCost: 60,
      preview: (s) => {
        const w = workshop(s);
        const p = focused(w);
        if (!p) return ["Nothing on the bench. Start something."];
        const kind = kindOf(p);
        if (!kind) return [];
        const added = kind.complexity * Math.max(0.35, 1 - s.r.skill / 160);
        return [
          `Design ${Math.min(designNeeded(kind), p.design + 1)} of ${designNeeded(kind)} weeks`,
          `And roughly ${added.toFixed(1)} more faults in it — craft reduces this, never to zero`,
        ];
      },
    },
    {
      id: "test",
      label: "Test it",
      blurb:
        "Rigs, soak tests and abuse. Takes faults out, and tells you how many are left.",
      timeCost: 1,
      cashCost: 140,
      preview: (s) => {
        const w = workshop(s);
        const p = focused(w);
        if (!p) return ["Nothing to test."];
        return [
          `Finds and fixes about ${testYield(p).toFixed(1)} faults`,
          `Confidence ${confidenceOf(p)}% → ${confidenceOf({ ...p, tested: p.tested + 1 })}%`,
        ];
      },
    },
    {
      id: "support",
      label: "Support",
      blurb:
        "Answering the failures that have already reached people, and fixing the cause.",
      timeCost: 1,
      cashCost: 0,
      preview: (s) => {
        const w = workshop(s);
        const out = shippedProducts(w).length;
        return [
          out === 0
            ? "Nothing shipped yet — this does nothing"
            : `Clears surfaced faults across ${out} shipped product${out === 1 ? "" : "s"}`,
          "And takes one latent fault out of each of them",
        ];
      },
    },
    {
      id: "sell",
      label: "Find buyers",
      blurb:
        "Distributors and trade shows. Pushes a shipped product further into the market.",
      timeCost: 1,
      cashCost: 120,
      preview: (s) => {
        const w = workshop(s);
        const out = shippedProducts(w).length;
        return [
          out === 0 ? "Nothing shipped yet" : "Reach +12% on every shipped product",
          "More reach is more revenue — and more faults surfacing",
        ];
      },
    },
    {
      id: "rest",
      label: "Step away",
      blurb: "A week away from the bench.",
      timeCost: 1,
      cashCost: 0,
      preview: () => ["Burnout −9", "Nothing is built or tested"],
    },
  ],

  events: [],

  initialResources: () => ({
    cash: START_CASH,
    debt: START_DEBT,
    reputation: 8,
    skill: 34,
    burnout: 10,
    _lastRevenue: 0,
    _burnoutPeak: 0,
  }),

  initialData: () => ({ workshop: initialWorkshop() }),

  startCities: WORKSHOP_CITIES,

  applyStartCity: (s, cityId) => {
    const city = WORKSHOP_CITY_BY_ID.get(cityId);
    if (!city) return;
    const w = workshop(s);
    w.city = cityId;
    s.r.debt = Math.round(START_DEBT * city.revenueIndex);
  },

  command: (s, cmd, arg) => {
    const w = workshop(s);
    switch (cmd) {
      case "startProduct": {
        const kind = PRODUCT_BY_ID.get(arg);
        if (!kind) return;
        if (s.r.skill < kind.needsSkill) return;
        const n = w.nextId++;
        w.products.push({
          id: `pr-${n}`,
          kind: kind.id,
          name: productName(n),
          stage: "design",
          design: 0,
          tested: 0,
          latent: 0,
          surfaced: 0,
          reach: 0,
          recalls: 0,
        });
        w.focus = `pr-${n}`;
        break;
      }

      case "focusProduct": {
        if (w.products.some((p) => p.id === arg && p.stage !== "withdrawn")) {
          w.focus = arg;
        }
        break;
      }

      /* Move a finished design onto the test rig. */
      case "beginTesting": {
        const p = w.products.find((x) => x.id === arg);
        if (!p || p.stage !== "design") return;
        const kind = kindOf(p);
        if (!kind || p.design < designNeeded(kind)) return;
        p.stage = "testing";
        break;
      }

      /*
       * SUBMIT IT.
       *
       * The moment the career is about. You are submitting against an
       * estimate, and the certifier is checking the truth.
       */
      case "submitForCertification": {
        const p = w.products.find((x) => x.id === arg);
        if (!p || (p.stage !== "testing" && p.stage !== "design")) return;
        const kind = kindOf(p);
        if (!kind || p.design < designNeeded(kind)) return;
        if (s.r.cash < kind.certCost) return;
        s.r.cash -= kind.certCost;
        p.stage = "certifying";
        p.submittedWeek = s.week;
        break;
      }

      /*
       * PULL IT YOURSELF.
       *
       * Expensive, and cheaper than the alternative. Takes every latent fault
       * out — you are rebuilding the thing — and costs a fraction of the
       * standing that the same faults would have taken one at a time.
       */
      case "recallProduct": {
        const p = w.products.find((x) => x.id === arg && x.stage === "shipped");
        if (!p) return;
        const cost = recallCost(w, p);
        s.r.cash -= cost;
        p.latent = 0;
        p.surfaced = 0;
        p.recalls += 1;
        p.stage = "testing";
        p.reach = Math.max(0, p.reach * 0.35);
        w.recalls += 1;
        s.r.reputation = Math.max(0, s.r.reputation - 5);
        pushLog(
          s,
          `You recalled the ${p.name} before it did any more damage. ${money(cost)}, and the trade noticed that it was you who said so.`,
          "bad",
        );
        break;
      }

      case "withdrawProduct": {
        const p = w.products.find((x) => x.id === arg);
        if (!p) return;
        p.stage = "withdrawn";
        break;
      }
    }
  },

  applyAction: (s, actionId) => {
    const w = workshop(s);
    switch (actionId) {
      /*
       * Designing creates the defects. Deterministic — the fault count is
       * hidden, not random, and a replayed week must build the same product.
       */
      case "design": {
        const p = focused(w);
        if (!p || (p.stage !== "design" && p.stage !== "testing")) return;
        const kind = kindOf(p);
        if (!kind) return;
        if (p.design < designNeeded(kind)) {
          p.design += 1;
          p.latent += kind.complexity * Math.max(0.35, 1 - s.r.skill / 160);
        }
        s.r.skill = Math.min(100, s.r.skill + 0.3);
        s.r.burnout = Math.min(100, s.r.burnout + 3.5);
        break;
      }
      case "test": {
        const p = focused(w);
        if (!p || (p.stage !== "testing" && p.stage !== "design")) return;
        p.latent = Math.max(0, p.latent - testYield(p));
        p.tested += 1;
        s.r.skill = Math.min(100, s.r.skill + 0.2);
        s.r.burnout = Math.min(100, s.r.burnout + 3);
        break;
      }
      case "support": {
        for (const p of shippedProducts(w)) {
          p.surfaced = 0;
          p.latent = Math.max(0, p.latent - 1);
        }
        s.r.burnout = Math.min(100, s.r.burnout + 2.5);
        break;
      }
      case "sell": {
        for (const p of shippedProducts(w)) {
          p.reach = Math.min(1, p.reach + 0.12);
        }
        s.r.reputation = Math.min(100, s.r.reputation + 0.4);
        s.r.burnout = Math.min(100, s.r.burnout + 2.5);
        break;
      }
      case "rest": {
        s.r.burnout = Math.max(0, s.r.burnout - 9);
        break;
      }
    }
  },

  resolveWeek: (s, rng) => {
    const w = workshop(s);
    const out: LedgerLine[] = [];
    const city = workshopCityOf(w);

    /* ----------------------------------------------------- certification */
    for (const p of w.products) {
      if (p.stage !== "certifying" || p.submittedWeek === undefined) continue;
      if (s.week - p.submittedWeek < certWeeksFor(w)) continue;
      const kind = kindOf(p);
      if (!kind) continue;

      if (wouldCertify(w, p)) {
        p.stage = "shipped";
        p.shippedWeek = s.week;
        p.reach = 0.2;
        out.push({
          label: `${p.name} certified`,
          kind: "info",
          note: "It is on sale. Whatever is left in it is now a customer's problem and yours.",
        });
        pushLog(
          s,
          `The ${p.name} passed certification and is on sale in ${city.name}.`,
          "good",
        );
      } else {
        /*
         * Refused. The certifier found what the testing did not, which is the
         * kindest way the career ever tells you the estimate was optimistic.
         */
        p.stage = "testing";
        p.submittedWeek = undefined;
        /* An assessment is itself a very thorough test. */
        p.tested += 2;
        s.r.reputation = Math.max(0, s.r.reputation - 2);
        out.push({
          label: `${p.name} failed certification`,
          kind: "info",
          note: "They found more in it than you thought. Back to the rig.",
        });
        pushLog(
          s,
          `The certifier refused the ${p.name}. They found more in it than your testing had — which is exactly what testing is for.`,
          "bad",
        );
      }
    }

    /* ---------------------------------------------------------- revenue */
    let earned = 0;
    for (const p of w.products) {
      const r = revenueOf(w, p);
      if (r > 0) {
        earned += r;
        out.push({
          label: `${p.name} — ${Math.round(p.reach * 100)}% of the market`,
          amount: r,
          kind: "income",
        });
      }
      /* A shipped product keeps spreading on its own, slowly. */
      if (p.stage === "shipped") p.reach = Math.min(1, p.reach + 0.03);
    }
    s.r.cash += earned;
    s.r._lastRevenue = earned;

    /*
     * ------------------------------------------------------ THE SURFACING
     *
     * The career's own sentence. Faults you shipped weeks ago arrive now,
     * priced by how far the product has spread and how hard this market
     * takes it. This is the only place `latent` becomes visible, and it
     * becomes visible as a bill.
     */
    for (const p of w.products) {
      if (p.stage !== "shipped" || p.latent < 0.5) continue;
      if (!rng.chance(surfaceChance(p))) continue;
      const cost = faultCost(w, p);
      p.latent = Math.max(0, p.latent - 1);
      p.surfaced += 1;
      w.faultsInField += 1;
      s.r.cash -= cost;
      s.r.reputation = Math.max(0, s.r.reputation - 1.5 * city.scrutiny);
      out.push({
        label: `${p.name} failed in the field`,
        amount: -cost,
        kind: "expense",
        note: "Warranty, replacement, and a customer who tells people.",
      });
      pushLog(
        s,
        `A ${p.name} failed at a customer. ${money(cost)} to put right, and it was in there when you shipped it.`,
        "bad",
      );
    }

    /* -------------------------------------------------------- the bills */
    out.push({
      label: `Workshop in ${city.name}`,
      amount: -city.overhead,
      kind: "expense",
    });
    s.r.cash -= city.overhead;

    s.r.burnout = Math.max(0, s.r.burnout - 1);
    s.r._burnoutPeak = Math.max(s.r._burnoutPeak ?? 0, s.r.burnout);
    return out;
  },

  checkSetbacks: (s) => {
    const out: SetbackKind[] = [];
    const w = workshop(s);
    if (Math.max(s.r.burnout, s.r._burnoutPeak ?? 0) >= 100) out.push("collapse");
    if (s.r.cash < -40_000) out.push("insolvency");
    /* A run of failures in the field is how an engineer loses their name. */
    if (w.faultsInField >= 12 && s.r.reputation <= 15) out.push("disgrace");
    if (out.includes("collapse")) s.r._burnoutPeak = 0;
    return out;
  },

  validateData: (data) => {
    const d = data as { workshop?: unknown };
    if (typeof d !== "object" || d === null) return false;
    const w = d.workshop as WorkshopState | undefined;
    if (typeof w !== "object" || w === null) return false;
    if (!WORKSHOP_CITY_BY_ID.has(w.city)) return false;
    if (!Array.isArray(w.products)) return false;
    const stages = ["design", "testing", "certifying", "shipped", "withdrawn"];
    for (const p of w.products) {
      if (!PRODUCT_BY_ID.has(p.kind)) return false;
      if (!stages.includes(p.stage)) return false;
      if (
        [p.design, p.tested, p.latent, p.reach].some(
          (n) => typeof n !== "number" || !Number.isFinite(n),
        )
      ) {
        return false;
      }
      if (p.latent < 0) return false;
    }
    return true;
  },

  scoreboard: (s) => {
    const w = workshop(s);
    const out = shippedProducts(w).length;
    return {
      label: "The workshop",
      value: money(worthOf(s)),
      sub: `${out} on sale · ${money(workshopRevenue(w))}/wk · ${w.faultsInField} faults reached customers`,
    };
  },

  briefing: (s, alloc) => {
    const w = workshop(s);
    const p = focused(w);
    if (!p) {
      return [
        {
          label: "Nothing on the bench",
          value: "—",
          tone: "bad" as const,
          note: "Start a product from the Business screen.",
        },
      ];
    }
    const kind = kindOf(p);
    if (!kind) return [];

    /*
     * The briefing has to show the *estimate* moving, never the truth. This
     * is the one screen where the player decides whether to ship, and it must
     * be decided on the same information an engineer would actually have.
     */
    const projected: Product = { ...p };
    const designBlocks = alloc.design ?? 0;
    const testBlocks = alloc.test ?? 0;
    for (let i = 0; i < designBlocks; i++) {
      if (projected.design < designNeeded(kind)) {
        projected.design += 1;
        projected.latent += kind.complexity * Math.max(0.35, 1 - s.r.skill / 160);
      }
    }
    for (let i = 0; i < testBlocks; i++) {
      projected.latent = Math.max(0, projected.latent - testYield(projected));
      projected.tested += 1;
    }
    const est = estimateOf(projected);

    const rows = [
      {
        label: "Faults in it, estimated",
        value: `${est.low}–${est.high}`,
        tone:
          est.high <= workshopCityOf(w).certTolerance
            ? ("good" as const)
            : est.low > workshopCityOf(w).certTolerance
              ? ("bad" as const)
              : ("neutral" as const),
        note: `${confidenceOf(projected)}% confident. The certifier here accepts up to ${workshopCityOf(w).certTolerance}.`,
      },
      {
        label: p.stage === "shipped" ? "Reach" : "Design",
        value:
          p.stage === "shipped"
            ? `${Math.round(p.reach * 100)}%`
            : `${Math.min(designNeeded(kind), projected.design)} of ${designNeeded(kind)} weeks`,
        tone:
          p.stage === "shipped"
            ? ("neutral" as const)
            : designProgress(projected) >= 1
              ? ("good" as const)
              : ("neutral" as const),
        note:
          p.stage === "shipped"
            ? `Earning ${money(revenueOf(w, p))} a week, and spreading.`
            : "Every week of design puts more faults in than the last one took out.",
      },
    ];

    if (p.stage === "shipped") {
      rows.push({
        label: "Chance one surfaces",
        value: `${Math.round(surfaceChance(p) * 100)}%`,
        tone:
          surfaceChance(p) > 0.25
            ? ("bad" as const)
            : surfaceChance(p) > 0.1
              ? ("neutral" as const)
              : ("good" as const),
        note: `Each one costs about ${money(faultCost(w, p))}.`,
      });
    }
    return rows;
  },

  objective: (s) => {
    const goal = goalFor(s);
    return {
      text: `Build a workshop worth ${money(goal)} in ${workshopCityOf(workshop(s)).name}. Everything you design has faults in it that you cannot see, and shipping is the moment they stop being yours to find and start being customers' to discover.`,
      progress: Math.max(0, Math.min(1, worthOf(s) / goal)),
    };
  },
};

export { buildableKinds, worthOf };
