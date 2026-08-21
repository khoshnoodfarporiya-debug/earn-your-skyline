/**
 * DOES EVERY CITY PLAY?
 *
 * The start city moves rent, takings, demand, produce prices, shelf life,
 * fees, chambers and the ceiling on the work a market offers. Numbers that
 * interlocking cannot be checked by reading them, so this plays every city of
 * the Chef and the Solicitor with one plain competent bot and reports what
 * happened.
 *
 * ------------------------------------------------------------- what it is for
 *
 * Not to prove the cities are *equal* — they are not meant to be. It is to
 * catch the two failures that would make a choice a trap:
 *
 *   1. a city where the bot is insolvent for most of the run, and
 *   2. a city that reaches the target so early that nothing else matters.
 *
 * The bot is deliberately unclever and identical in every city: it is a
 * control, not a player. A city looking bad here means the city is hard for
 * an ordinary approach, which is a design statement worth making on purpose
 * rather than by accident.
 *
 * Run: npx tsx scripts/cities.ts [runs]
 */

import {
  advanceWeek,
  resolveEventChoice,
  runCommand,
  startRun,
} from "../lib/game/engine";
import { chef, kitchen, kitchenWorth, goalFor as chefGoal } from "../lib/game/careers/chef";
import {
  KITCHEN_CITIES,
  SERVICE_BY_ID,
  brigadeCovers,
  forecastFor,
  larderCovers,
  premisesPrice,
  PREMISES,
} from "../lib/game/careers/kitchen";
import {
  lawyer,
  practice,
  firmWorth,
  goalFor as firmGoal,
} from "../lib/game/careers/lawyer";
import {
  CASE_BY_ID,
  LEGAL_CITIES,
  hoursOutstanding,
  oddsFor,
  staffHours,
} from "../lib/game/careers/casework";
import {
  WINES,
  bottlesHeld,
  casePrice,
  pourRate,
  cellarFull,
} from "../lib/game/careers/cellar";
import {
  TECHNIQUES,
  canLearn,
  knowsTechnique,
} from "../lib/game/careers/craft";
import {
  VENTURES,
  ventureBlocker,
  ventureFee,
  venturesOf,
} from "../lib/game/careers/ventures";
import { weeklyOutgoings } from "../lib/game/careers/chef";
import { localOf } from "../lib/game/careers/kitchen";
import { money } from "../lib/game/format";

const RUNS = Math.max(1, Number(process.argv[2]) || 24);
/*
 * What `payLoan` moves in one press, and the buffer both bots keep behind it.
 *
 * Paying down to the last note is not prudence, it is the same over-commitment
 * the career is about: the first version of this rule left about two thousand
 * pounds in the account and the next event that cost eleven hundred started a
 * spiral that ran for a hundred and eighteen weeks. Six weeks of standing
 * costs is what an operator actually keeps.
 */
const LOAN_STEP = 10_000;
const HORIZON = 120;

interface Result {
  reached: boolean;
  worth: number;
  weeksBroke: number;
  troughCash: number;
}

/* ------------------------------------------------------------------- chef */

/**
 * A plain kitchen.
 *
 * Orders against the forecast rather than by habit, opens dinner with a block
 * of prep, takes the next room when it can comfortably afford it, and hires
 * when there is more demand than hands. No city-specific cleverness: the same
 * rules run in Mumbai and in Paris, which is the point.
 */
function playChef(cityId: string, seed: number): Result {
  let s = startRun(chef, seed, { city: cityId });
  let weeksBroke = 0;
  let troughCash = s.r.cash;
  let reached = false;

  for (let week = 1; week <= HORIZON; week++) {
    const k = kitchen(s);

    /*
     * Order to the *low* end of the forecast, not the high one.
     *
     * The first version of this bot ordered to the top of the band and went
     * insolvent in five cities out of seven — including Lyon, whose economy
     * has not changed and is known to be playable. Over-ordering is the
     * mistake this career is built around, so a bot that makes it every week
     * measures the mistake rather than the market.
     */
    const dinner = SERVICE_BY_ID.get("dinner")!;
    const fc = forecastFor(k, s.r.reputation, dinner, 3, s.r.skill);
    /*
     * Capped by what the brigade can actually plate.
     *
     * The forecast is *demand*, and in a busy city demand is far past what a
     * solo kitchen can cook — the second version of this bot bought to it
     * anyway and binned the difference every week in Mumbai and New York,
     * which is the mistake the career is about rather than a fact about
     * those cities. The screen names the binding constraint; the bot now
     * reads it.
     */
    const hands = Math.round(brigadeCovers(k, s.r.skill) * 1.18);
    const want = Math.min(Math.round(fc.low * 1.1), hands);
    for (let i = 0; i < 3; i++) {
      if (larderCovers(kitchen(s)) >= want) break;
      const before = s.r.cash;
      s = runCommand(chef, s, "buyProduce", "market:basic");
      if (s.r.cash === before) break; /* refused — too dear, or below minimum */
      if (s.r.cash < 2_500) break;
    }

    /*
     * A bigger room only when the covers are there to fill it and the cash is
     * there to carry it for a while. Rent arrives every week afterwards and a
     * room taken too early is how a good kitchen dies.
     */
    const here = kitchen(s);
    const next = PREMISES[PREMISES.findIndex((p) => p.id === here.premises) + 1];
    const full = (here.lastService?.turnedAway ?? 0) > 0 || here.streak > 0;
    if (next && full && s.r.cash > premisesPrice(here, next) * 3) {
      s = runCommand(chef, s, "takePremises", next.id);
    } else if (
      s.r.cash > 60_000 &&
      !(kitchen(s).equipment ?? []).includes("coldroom")
    ) {
      s = runCommand(chef, s, "buyKit", "coldroom");
    } else if (s.r.cash > 25_000 && kitchen(s).staff.length < 3) {
      s = runCommand(chef, s, "hireKitchen", "partie");
    }

    const rest = s.r.burnout > 70 ? 1 : 0;
    const out = advanceWeek(chef, s, {
      dinner: 3,
      lunch: 1,
      prep: 1,
      ...(rest > 0 ? { rest } : { room: 1 }),
    });
    s = out.state;
    /*
     * The control does *not* service the fit-out loan, and that is deliberate.
     *
     * It has been the baseline three phases of work were measured against, and
     * changing what it does invalidates every reading taken before now. It
     * also turns out to be delicate: an earlier version of this bot repaid
     * down to a small float and then could not absorb a $1,100 event, and it
     * spiralled for a hundred and eighteen weeks. What the loan does to a run
     * is measured by the ambitious bot below, which does service it.
     */
    /* The harness always takes the first option, as the Physician's does, so
       every figure here is a floor rather than a ceiling. */
    if (out.event) s = resolveEventChoice(chef, s, out.event.def, 0);

    if (s.r.cash < 0) weeksBroke++;
    troughCash = Math.min(troughCash, s.r.cash);
    if (!reached && s.r.debt <= 0 && kitchenWorth(s) >= chefGoal(s)) reached = true;
  }

  return { reached, worth: kitchenWorth(s), weeksBroke, troughCash };
}

/**
 * THE AMBITIOUS KITCHEN
 *
 * The plain bot above never learns a technique, never buys a bottle and never
 * takes an offer, which means it proves the Phase 4 systems are *optional* and
 * nothing whatever about whether they are balanced.
 *
 * This one takes all of it. Same ordering discipline, same room rule, same
 * refusal to be clever about the city — and on top of that it practises every
 * week it can afford to, buys wine when it has a cellar to keep it in, hires a
 * sommelier once there is a list worth selling, and accepts whatever venture
 * it is offered.
 *
 * ------------------------------------------------------------ what it checks
 *
 * Two failures, and they are the opposite of each other:
 *
 *   1. **A trap.** If this bot is materially worse off than the plain one,
 *      the new systems are a way to lose, and a player who engages with the
 *      career as designed is being punished for it.
 *   2. **A free lunch.** If it is dramatically better in every city, the
 *      cellar or the ventures are printing money and the trade is not a trade.
 *
 * Somewhere in between is the answer, and the report prints both bots so the
 * gap is visible rather than asserted.
 */
function playAmbitiousChef(cityId: string, seed: number): Result {
  let s = startRun(chef, seed, { city: cityId });
  let weeksBroke = 0;
  let troughCash = s.r.cash;
  let reached = false;

  for (let week = 1; week <= HORIZON; week++) {
    const k = kitchen(s);

    /*
     * How much of the week is actually going to be spent cooking, worked out
     * before the food is bought rather than after — the first version of this
     * bot bought for three blocks and opened four, which measures a bot that
     * cannot count rather than anything about the craft.
     */
    /*
     * A buffer, measured in weeks of standing costs.
     *
     * Everything the ambitious bot does beyond cooking — the cellar, the
     * sommelier, a block of practice, a commitment — is paid for out of
     * *slack*, and a kitchen with no slack has none to spend. Without this
     * the bot bought a wine store in New York while two weeks from insolvent
     * and spiralled, which measures a bot that cannot read its own bank
     * balance rather than anything about the craft.
     */
    const weekly = Math.max(1, weeklyOutgoings(k));
    const slack = s.r.cash / weekly;

    const learning =
      slack > 6 &&
      TECHNIQUES.some((t) => canLearn(k, t) && !knowsTechnique(k, t.id));
    /*
     * THE SAME WEEK THE PLAIN BOT RUNS, MINUS WHAT IT SPENDS ELSEWHERE.
     *
     * Three dinners and a lunch, not four dinners. A dinner block seats about
     * a third of the room, so a fourth of them is largely empty — and the bot
     * buys food for every block it opens, so an empty block is a week of
     * produce in the bin. Doing that in New York, where produce is half as
     * dear again, put this bot a million behind and overdrawn for a hundred
     * weeks out of a hundred and twenty. It was measuring its own arithmetic.
     */
    const dinners = 3;

    /* Food, on exactly the same rule the plain bot uses. */
    const dinner = SERVICE_BY_ID.get("dinner")!;
    const fc = forecastFor(k, s.r.reputation, dinner, dinners, s.r.skill);
    const hands = Math.round(brigadeCovers(k, s.r.skill) * 1.18);
    const want = Math.min(Math.round(fc.low * 1.1), hands);
    for (let i = 0; i < 3; i++) {
      if (larderCovers(kitchen(s)) >= want) break;
      const before = s.r.cash;
      s = runCommand(chef, s, "buyProduce", "market:basic");
      if (s.r.cash === before) break;
      if (s.r.cash < 2_500) break;
    }

    /* The room, the cold room, the brigade — all as before. */
    const here = kitchen(s);
    const next = PREMISES[PREMISES.findIndex((p) => p.id === here.premises) + 1];
    const full = (here.lastService?.turnedAway ?? 0) > 0 || here.streak > 0;
    if (next && full && s.r.cash > premisesPrice(here, next) * 3) {
      s = runCommand(chef, s, "takePremises", next.id);
    } else if (
      s.r.cash > 60_000 &&
      !(kitchen(s).equipment ?? []).includes("coldroom")
    ) {
      s = runCommand(chef, s, "buyKit", "coldroom");
    } else if (s.r.cash > 25_000 && kitchen(s).staff.length < 3) {
      s = runCommand(chef, s, "hireKitchen", "partie");
    }

    /* ------------------------------------------------------- the additions */

    /*
     * The cellar, once there is somewhere to keep it. Buys the best case it
     * can comfortably afford, which is the decision a chef building a list
     * actually makes — and it is money off the floor either way.
     */
    if (
      slack > 10 &&
      s.r.cash > 90_000 &&
      !(kitchen(s).equipment ?? []).includes("cellar")
    ) {
      s = runCommand(chef, s, "buyKit", "cellar");
    } else if ((kitchen(s).equipment ?? []).includes("cellar")) {
      /*
       * Buy to what the room will actually drink, not to what the bank will
       * allow.
       *
       * A rack is money off the floor, and a bot that puts six per cent of its
       * cash into wine every week regardless of how much it pours is making
       * the over-ordering mistake this whole career is about — in wine rather
       * than in produce. It went insolvent in five cities out of seven doing
       * exactly that. Six weeks of stock is a cellar; sixty is a hobby.
       */
      const drinkers = kitchen(s).lastService?.served ?? 0;
      const weeklyPour = Math.floor(
        (drinkers * pourRate(kitchen(s), true)) / 2.4,
      );
      const affordable = WINES.filter(
        (w) => casePrice(kitchen(s), w) < s.r.cash * 0.05,
      ).sort((a, b) => b.prestige - a.prestige)[0];
      if (
        affordable &&
        slack > 6 &&
        !cellarFull(kitchen(s)) &&
        bottlesHeld(kitchen(s)) < Math.max(24, weeklyPour * 6)
      ) {
        s = runCommand(chef, s, "buyWine", affordable.id);
      }
      /* And somebody to sell it, once there is a list worth selling. */
      if (
        bottlesHeld(kitchen(s)) > 60 &&
        slack > 8 &&
        s.r.cash > 30_000 &&
        !kitchen(s).staff.some((x) => x.role === "somm")
      ) {
        s = runCommand(chef, s, "hireKitchen", "somm");
      }
    }

    /* Whatever is on the table. A bot that takes everything is the honest
       upper bound on what the ventures are worth. */
    if (slack > 8 && !venturesOf(kitchen(s)).active) {
      const offer = VENTURES.filter(
        (v) => !ventureBlocker(v, kitchen(s), s.r.reputation, s.r.cash, week),
      ).sort((a, b) => ventureFee(kitchen(s), b) - ventureFee(kitchen(s), a))[0];
      if (offer) s = runCommand(chef, s, "startVenture", offer.id);
    }

    /* Practice goes into the cheapest thing still open, every week the block
       is there to spend. */
    const open = TECHNIQUES.filter(
      (t) => canLearn(kitchen(s), t) && !knowsTechnique(kitchen(s), t.id),
    ).sort((a, b) => a.cost - b.cost)[0];
    if (open) s = runCommand(chef, s, "setPractice", open.id);

    /*
     * The whole week, every week.
     *
     * A bot that leaves a block unspent is measuring its own arithmetic
     * rather than the systems it is supposed to be testing — and the point of
     * this bot is the *comparison*, so it has to work as hard as the plain
     * one does.
     */
    /*
     * EXACTLY THE PLAIN BOT'S WEEK, WITH ONE BLOCK SPENT DIFFERENTLY.
     *
     * Three dinners, a lunch and a block of prep — the same four service
     * blocks the control runs — and then the sixth block goes on practice
     * instead of working the room. That is the honest cost of learning
     * something: not a service, but the hour you would have spent in the
     * dining room being charming.
     *
     * Getting this wrong was worth about a quarter of a million pounds a run.
     * The first version dropped the *lunch* whenever burnout called for a
     * rest, which the control never does, and the missing service block
     * compounded across a hundred and twenty weeks into a bankruptcy that had
     * nothing to do with anything this bot was meant to be testing.
     */
    const rest = s.r.burnout > 70 ? 1 : 0;
    const budget = chef.timeBudget(s);
    const practising = learning && rest === 0 ? 1 : 0;
    /* A running commitment eats the week from the bottom: the sixth block
       first, then the lunch, and only then a dinner. */
    const spare = budget - dinners - 1;
    const sixth = spare >= 2 ? 1 : 0;
    const lunch = spare >= 1 ? 1 : 0;
    const dinnersNow = Math.max(1, Math.min(dinners, budget - 1));

    const out = advanceWeek(chef, s, {
      dinner: dinnersNow,
      prep: 1,
      ...(lunch > 0 ? { lunch } : {}),
      ...(sixth > 0
        ? rest > 0
          ? { rest }
          : practising > 0
            ? { practise: 1 }
            : { room: 1 }
        : {}),
    });
    s = out.state;
    /* And it pays the loan down, because a kitchen holding six figures and a
       fit-out debt is not a decision anybody makes. */
    /*
     * Services the loan, but only from genuine surplus.
     *
     * The buffer is flat and local rather than a multiple of `weeklyOutgoings`,
     * because standing costs are almost nothing at a market stall while food
     * and events are not — a buffer sized on rent alone is no buffer at all in
     * the weeks it is most needed.
     */
    if (s.r.debt > 0 && s.r.cash - LOAN_STEP > localOf(kitchen(s), 30_000)) {
      s = runCommand(chef, s, "payLoan", "");
    }
    if (out.event) s = resolveEventChoice(chef, s, out.event.def, 0);

    if (s.r.cash < 0) weeksBroke++;
    troughCash = Math.min(troughCash, s.r.cash);
    if (!reached && s.r.debt <= 0 && kitchenWorth(s) >= chefGoal(s)) reached = true;
  }

  return { reached, worth: kitchenWorth(s), weeksBroke, troughCash };
}

/* -------------------------------------------------------------- solicitor */

/**
 * A plain firm.
 *
 * Takes what it can staff, works the files, settles anything whose odds have
 * gone bad with the deadline close, and hires when the hours outstanding are
 * more than it can find. Again: identical rules in every market.
 */
function playLawyer(cityId: string, seed: number): Result {
  let s = startRun(lawyer, seed, { city: cityId });
  let weeksBroke = 0;
  let troughCash = s.r.cash;
  let reached = false;

  for (let week = 1; week <= HORIZON; week++) {
    const p = practice(s);

    /*
     * Accept only what the firm has the hours to finish.
     *
     * The first version took four files regardless and was overdrawn for
     * ninety weeks in every market — it was measuring an over-committed firm,
     * not the cities. A practice finances its own work in progress, so the
     * bot carries what it can actually deliver.
     */
    const capacity = 12 + s.r.skill * 0.12 * 4 + staffHours(p);
    for (const offer of [...p.offers]) {
      const kind = CASE_BY_ID.get(offer.kind);
      if (!kind) continue;
      const live = practice(s);
      if (live.cases.length >= 3) break;
      if (hoursOutstanding(live) + kind.hours > capacity * 10) continue;
      s = runCommand(lawyer, s, "takeCase", offer.id);
    }

    /* Settle what is going badly and is nearly due; carry the rest. */
    for (const c of [...practice(s).cases]) {
      const kind = CASE_BY_ID.get(c.kind);
      if (!kind) continue;
      const near = c.dueWeek - s.week <= 2;
      const ready = c.hoursDone / kind.hours;
      if (near && ready < 0.85 && oddsFor(c, practice(s), s.r.skill) < 0.55) {
        s = runCommand(lawyer, s, "settleCase", c.id);
      }
    }

    /* Hire against the work in the building, not against the balance: an
       associate is $2,900 a week whether or not there is a file for them. */
    if (
      s.r.cash > 45_000 &&
      practice(s).staff.length < 3 &&
      hoursOutstanding(practice(s)) > staffHours(practice(s)) * 6
    ) {
      s = runCommand(lawyer, s, "hireLegal", "associate");
    }

    const rest = s.r.burnout > 72 ? 1 : 0;
    const out = advanceWeek(lawyer, s, {
      casework: 4,
      pitch: 1,
      ...(rest > 0 ? { rest } : { network: 1 }),
    });
    s = out.state;
    if (out.event) s = resolveEventChoice(lawyer, s, out.event.def, 0);

    if (s.r.cash < 0) weeksBroke++;
    troughCash = Math.min(troughCash, s.r.cash);
    if (!reached && s.r.debt <= 0 && firmWorth(s) >= firmGoal(s)) reached = true;
  }

  return { reached, worth: firmWorth(s), weeksBroke, troughCash };
}

/* ------------------------------------------------------------------ report */

const median = (xs: number[]) => {
  const a = [...xs].sort((x, y) => x - y);
  return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
};

function report(
  title: string,
  cities: { id: string; name: string; difficulty: string }[],
  play: (cityId: string, seed: number) => Result,
) {
  console.log(`\n${title} — ${RUNS} runs per city, ${HORIZON} weeks\n${"─".repeat(76)}`);
  console.log(
    `${"city".padEnd(12)}${"stated".padEnd(9)}${"reached".padEnd(9)}${"median worth".padEnd(15)}${"wks overdrawn".padEnd(15)}trough`,
  );
  for (const city of cities) {
    const rs = Array.from({ length: RUNS }, (_, i) => play(city.id, 500 + i * 41));
    const reached = rs.filter((r) => r.reached).length;
    console.log(
      city.name.padEnd(12) +
        city.difficulty.padEnd(9) +
        `${Math.round((reached / RUNS) * 100)}%`.padEnd(9) +
        money(median(rs.map((r) => r.worth))).padEnd(15) +
        median(rs.map((r) => r.weeksBroke)).toFixed(0).padEnd(15) +
        money(median(rs.map((r) => r.troughCash))),
    );
  }
}

report("Chef — a plain kitchen", KITCHEN_CITIES, playChef);
report("Chef — the ambitious kitchen", KITCHEN_CITIES, playAmbitiousChef);
report("Solicitor", LEGAL_CITIES, playLawyer);
console.log("");
