import type { Rng } from "../types";
import type { PhoneState } from "../medical/types";

/**
 * THE CASE PIPELINE
 *
 * The Physician is paid for the week he works. The Chef is paid the night she
 * serves. The Solicitor is paid **on settlement**, months after the work, and
 * only if it goes his way — and that single fact is the entire career.
 *
 * ---------------------------------------------------------------- the shape
 *
 * You take instructions. Each is a lump of hours that must be found before it
 * can resolve, and while you are finding them the rent is still due. So the
 * business is permanently financing its own work in progress: the more you
 * take on, the deeper the hole gets before any of it pays.
 *
 * Then it resolves, and it is not certain. Preparation moves the odds — hours
 * beyond the minimum genuinely improve your chances — but never to one. A case
 * you spent four months on can still come back against you, and it pays
 * nothing when it does.
 *
 * ------------------------------------------------------------ the decision
 *
 * Which is why every case can be **settled**. A settlement is a fraction of
 * the fee, available immediately, certain. Taking it is often correct and
 * always feels like losing. Refusing it is how the good runs happen and how
 * the bad ones end. That choice — repeated, with real information about the
 * odds — is what this career has instead of the Chef's larder.
 *
 * Deadlines are the third pressure. Instructions expire; hours already sunk
 * into a case you let lapse are simply gone.
 */

/**
 * A kind of instruction.
 *
 * `fee` against `hours` is the number that decides whether this career is a
 * game or a formality, and the first pass got it badly wrong: a contract
 * dispute paid $165,000 for 105 hours — $1,571 an hour — while a paralegal
 * delivering those hours cost $44 of salary for each one. Hiring was a
 * thirty-fold return, the simulation cleared the target in every single run,
 * and there was no decision anywhere in it.
 *
 * Fees now sit near $300–700 an hour of *expected* value once the odds are
 * applied, against staff who cost $60–110 an hour to keep. That leaves a real
 * margin — this is a profitable trade — without making the answer to every
 * question "hire somebody".
 */
export interface CaseKind {
  id: string;
  label: string;
  blurb: string;
  /** Hours of work before it can resolve at all. */
  hours: number;
  /** Paid on a win. Nothing on a loss. */
  fee: number;
  /** Chance of winning with the bare minimum of preparation. */
  baseOdds: number;
  /** Weeks from instruction to the court date. Miss it and it is lost. */
  window: number;
  /** Reputation swing on a win. Losses cost roughly half this. */
  prestige: number;
}

export const CASE_KINDS: CaseKind[] = [
  {
    id: "conveyance",
    label: "A house purchase",
    blurb:
      "Searches, a chain that keeps breaking, and a client who rings every day. Dull, quick, and it pays.",
    hours: 14,
    fee: 4_200,
    baseOdds: 0.9,
    window: 8,
    prestige: 1,
  },
  {
    id: "probate",
    label: "An estate to wind up",
    blurb:
      "A will, three siblings and a house nobody can agree on. It will take longer than anyone has said.",
    hours: 26,
    fee: 9_500,
    baseOdds: 0.82,
    window: 14,
    prestige: 2,
  },
  {
    id: "employment",
    label: "An unfair dismissal",
    blurb:
      "She was managed out and everybody knows it. Proving what everybody knows is the job.",
    hours: 44,
    fee: 17_500,
    baseOdds: 0.58,
    window: 18,
    prestige: 5,
  },
  {
    id: "injury",
    label: "A personal injury claim",
    blurb:
      "Liability is admitted; the number is not. Paid on the outcome, which means paid on how hard you push.",
    hours: 62,
    fee: 33_000,
    baseOdds: 0.52,
    window: 22,
    prestige: 7,
  },
  {
    id: "commercial",
    label: "A contract dispute",
    blurb:
      "Two companies, one badly drafted clause, and counsel on the other side who does this every day.",
    hours: 105,
    fee: 74_000,
    baseOdds: 0.45,
    window: 30,
    prestige: 13,
  },
  {
    id: "class",
    label: "A group claim",
    blurb:
      "Two hundred claimants against somebody who can afford to make it last for years. It will define the firm either way.",
    hours: 190,
    fee: 205_000,
    baseOdds: 0.36,
    window: 44,
    prestige: 26,
  },
];

export const CASE_BY_ID = new Map(CASE_KINDS.map((c) => [c.id, c]));

/**
 * WHERE THE FIRM PRACTISES
 *
 * The Chef's city decides what a cover is worth and how long food keeps. A
 * solicitor's city decides something sharper: **what work exists here at
 * all**. A market town has house purchases and probate for ever and will
 * never send you a group claim; the City of London has all of it and four
 * other firms already acting.
 *
 *   `fee`      what the same instruction bills for
 *   `rent`     what chambers cost, due while nothing has settled
 *   `flow`     how often an instruction comes in the door
 *   `reach`    the largest prestige of work this market ever produces
 *
 * `reach` is the one that makes a city a decision rather than a rate card. It
 * caps the ladder: choosing Lagos is choosing a cheap, busy practice with a
 * ceiling, and choosing London is choosing to pay for the chance at the work
 * that ends the run. London is 1.0 on everything else, because it is where
 * this career has always started and a save from before this choice existed
 * reads as London and plays exactly as it did.
 */
export interface LegalCity {
  id: string;
  name: string;
  country: string;
  /** Key into the projected map positions. */
  position: string;
  blurb: string;
  fee: number;
  rent: number;
  flow: number;
  /** The most prestigious work this market offers. See CASE_KINDS.prestige. */
  reach: number;
  difficulty: "gentle" | "even" | "hard";
}

export const LEGAL_CITIES: LegalCity[] = [
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    position: "london",
    blurb:
      "The courts, the counsel and the clients within a mile of each other. Every kind of work this trade has, and everybody else is here too.",
    fee: 1,
    rent: 1,
    flow: 1,
    reach: 26,
    difficulty: "even",
  },
  {
    id: "madrid",
    name: "Madrid",
    country: "Spain",
    position: "madrid",
    blurb:
      "Cheap rooms and steady domestic work. Conveyancing and estates for as long as you want them, and a ceiling you will reach.",
    fee: 0.78,
    rent: 0.6,
    flow: 1.15,
    reach: 7,
    difficulty: "gentle",
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    position: "amsterdam",
    blurb:
      "Small, orderly and well paid. Less work comes in than you would like, and rather more of it is worth having.",
    fee: 1.05,
    rent: 0.85,
    flow: 0.85,
    reach: 13,
    difficulty: "even",
  },
  {
    id: "newyork",
    name: "New York",
    country: "United States",
    position: "newyork",
    blurb:
      "The biggest fees in the world, the biggest rent in the world, and opponents who can afford to make it last for years.",
    fee: 1.55,
    rent: 1.7,
    flow: 0.95,
    reach: 26,
    difficulty: "hard",
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    position: "singapore",
    blurb:
      "Commercial work and almost nothing else. Contracts and shipping disputes arrive constantly; nobody here needs a will drafting.",
    fee: 1.25,
    rent: 1.2,
    flow: 1.1,
    reach: 13,
    difficulty: "even",
  },
  {
    id: "lagos",
    name: "Lagos",
    country: "Nigeria",
    position: "lagos",
    blurb:
      "More people needing a solicitor than there are solicitors. Fees are a third of London's and the phone does not stop.",
    fee: 0.45,
    rent: 0.4,
    flow: 1.5,
    reach: 7,
    difficulty: "hard",
  },
];

export const LEGAL_CITY_BY_ID = new Map(LEGAL_CITIES.map((c) => [c.id, c]));

/** The city this firm practises in. Absent on a save written before the choice. */
export const legalCityOf = (p: PracticeState): LegalCity =>
  LEGAL_CITY_BY_ID.get(p.city ?? "london") ?? LEGAL_CITIES[0];

/** What an instruction of this kind bills here. */
export const feeIn = (p: PracticeState, k: CaseKind): number =>
  Math.round(k.fee * legalCityOf(p).fee);

/**
 * What people cost here.
 *
 * The same hole the Chef had, found the same way: fees and chambers were
 * local while salaries were not, so a firm in Lagos billed at 45% and paid a
 * London associate $2,900 a week. Halfway between what the market pays and
 * what it charges for a room, applied when somebody is hired so the figure on
 * the payroll is already the local one.
 */
export const legalLabourIndex = (p: PracticeState): number =>
  (legalCityOf(p).fee + legalCityOf(p).rent) / 2;

export interface LegalRole {
  id: string;
  label: string;
  blurb: string;
  hireCost: number;
  salary: number;
  /** Hours this person contributes to the pipeline each week. */
  hours: number;
  /** Added to the odds on everything the firm runs. */
  weight: number;
}

export const LEGAL_ROLES: LegalRole[] = [
  {
    id: "paralegal",
    label: "Paralegal",
    blurb:
      "Bundles, disclosure, chasing the other side. Hours you do not have to find yourself.",
    hireCost: 1_800,
    salary: 980,
    hours: 13,
    weight: 0.005,
  },
  {
    id: "associate",
    label: "Associate solicitor",
    blurb: "Runs their own files. The first hire that makes the firm bigger than you.",
    hireCost: 7_500,
    salary: 2_900,
    hours: 21,
    weight: 0.02,
  },
  {
    id: "partner",
    label: "Salaried partner",
    blurb:
      "Brings a practice with them and wins the ones you would have settled.",
    hireCost: 22_000,
    salary: 6_400,
    hours: 18,
    weight: 0.05,
  },
  {
    id: "clerk",
    label: "Practice clerk",
    blurb: "Keeps the diary, the billing and the deadlines. Nothing lapses on their watch.",
    hireCost: 1_400,
    salary: 820,
    hours: 4,
    weight: 0.005,
  },
];

export const LEGAL_ROLE_BY_ID = new Map(LEGAL_ROLES.map((r) => [r.id, r]));

/**
 * WHETHER THE CLIENT ACTUALLY PAYS, AND WHEN
 *
 * The career's premise is that work is not money until a court says so. This
 * is the second half of that sentence, and it was missing: a won case handed
 * over cash on the spot, which quietly made a verdict the end of the story.
 * It is not. A judgment in your favour is a *bill*, and a bill is a promise
 * from somebody who may be slow, or arguing, or gone.
 *
 * Stated on the instruction **before** it is accepted, because the whole
 * point is that it is a term of the work rather than a surprise afterwards.
 * The big fee and the bad payer are correlated on purpose — see `payerFor`.
 *
 *   `weeks`      how long after the verdict the money arrives
 *   `doubt`      chance at maturity that it has to be written down
 *   `recovers`   what you get when it is
 */
export type PayerId = "prompt" | "slow" | "doubtful";

export interface Payer {
  id: PayerId;
  label: string;
  /** One line, shown on the instruction. */
  note: string;
  weeks: number;
  doubt: number;
  recovers: number;
}

export const PAYERS: Payer[] = [
  {
    id: "prompt",
    label: "Pays on delivery",
    note: "The bill goes out and the money is there. Rarer than it sounds.",
    weeks: 0,
    doubt: 0,
    recovers: 1,
  },
  {
    id: "slow",
    label: "Slow payer",
    note: "You will be paid. You will be paid in about five weeks, and the rent is weekly.",
    weeks: 5,
    doubt: 0,
    recovers: 1,
  },
  {
    id: "doubtful",
    label: "Doubtful",
    note: "Their finance department has a process. Some of these are never collected in full.",
    weeks: 9,
    doubt: 0.3,
    recovers: 0.55,
  },
];

export const PAYER_BY_ID = new Map(PAYERS.map((p) => [p.id, p]));

/** Absent means the save was written before payers existed: it paid on the nail. */
export const payerOf = (id: PayerId | undefined): Payer =>
  PAYER_BY_ID.get(id ?? "prompt") ?? PAYERS[0];

/**
 * Money a court has said is yours, which is not the same as money.
 *
 * A bill is created by a verdict, sits on the books earning nothing, and can
 * be sold to a factor at a discount that gets worse the further off it is —
 * which is the career's binding constraint expressed as a button rather than
 * as a sentence in a tooltip.
 */
export interface Bill {
  id: string;
  client: string;
  kind: string;
  /** Face value. What arrives if you simply wait and it holds up. */
  amount: number;
  /** The week it matures. */
  dueWeek: number;
  payer: PayerId;
}

/** An instruction you have accepted and are carrying. */
export interface LiveCase {
  id: string;
  kind: string;
  client: string;
  openedWeek: number;
  dueWeek: number;
  hoursDone: number;
  /** Refreshed each week the case is on the books. */
  settlementOffer: number;

  /*
   * Everything below is optional, and load-bearing rather than lazy: a save
   * written before any of it existed has to keep playing. Every reader goes
   * through a helper that treats absent as the old behaviour — a case with no
   * payer pays on the nail, one with no adjournments has never been put off,
   * one with no counsel is being run by you alone.
   */

  /** Who is paying, carried across from the instruction. */
  payer?: PayerId;
  /** Counsel is briefed on this one. Better odds, cheaper costs if it fails. */
  counsel?: boolean;
  /** Times the court has moved the date. Capped — see `MAX_ADJOURNMENTS`. */
  adjournments?: number;
  /** Taken against somebody you have acted for. The regulator may notice. */
  conflicted?: boolean;
  /** Who is on the other side, when that matters. */
  opponent?: string;
}

/** An instruction on the table, not yet accepted. */
export interface CaseOffer {
  id: string;
  kind: string;
  client: string;
  expiresWeek: number;
  /** Optional for the same reason as on the case: an older offer pays promptly. */
  payer?: PayerId;
  /** True when this is against a former client of yours. */
  conflict?: boolean;
  /** Named when there is a conflict, so the warning can say who. */
  opponent?: string;
}

export interface Verdict {
  caseId: string;
  kind: string;
  won: boolean;
  fee: number;
  odds: number;
  settled: boolean;
  /* Optional: a verdict recorded before any of this existed simply has none. */
  /** The week it was decided, so the record reads as a history. */
  week?: number;
  /** The other side's costs, when it went against you. */
  costs?: number;
  /** True when the fee became a bill rather than money. */
  billed?: boolean;
}

export interface PracticeState {
  /**
   * Where the firm practises. Chosen at week one and never changed.
   *
   * Optional so a save written before the choice existed loads and reads as
   * London, which is where every run before this one was.
   */
  city?: string;
  cases: LiveCase[];
  offers: CaseOffer[];
  staff: { id: string; name: string; role: string; salary: number }[];
  /** Chambers rent, which scales with how much room the firm needs. */
  rooms: number;
  lastVerdicts: Verdict[];
  nextId: number;

  /* ------------------------------------------------------------ optional
   *
   * All of it added after the career shipped, all of it absent on an older
   * save, and every reader below treats absent as the state the firm was in
   * before the system existed: no bills outstanding, nobody acted for, no
   * echo from anything said in public.
   */

  /** Judgments in your favour that have not turned into money yet. */
  bills?: Bill[];
  /** Clients you have been instructed by. What a conflict is measured against. */
  actedFor?: string[];
  /** Extra tries at an instruction next week, from something you published. */
  echo?: number;
  /**
   * How much publicity is currently improving what the other side will pay.
   *
   * Decays fast on purpose. A case that is in the paper is worth more to make
   * go away, and it stops being in the paper.
   */
  pressure?: number;
  /**
   * The firm's phone: feed, messages, news, standing.
   *
   * Optional so a save written before the handset existed gains one on first
   * touch rather than being rejected for not having one — the same treatment
   * the kitchen's phone gets.
   */
  phone?: PhoneState;
}

/* ----------------------------------------------------------------- helpers */

export const staffHours = (p: PracticeState): number =>
  p.staff.reduce((n, s) => n + (LEGAL_ROLE_BY_ID.get(s.role)?.hours ?? 0), 0);

export const firmWeight = (p: PracticeState): number =>
  p.staff.reduce((n, s) => n + (LEGAL_ROLE_BY_ID.get(s.role)?.weight ?? 0), 0);

export const legalWages = (p: PracticeState): number =>
  p.staff.reduce((n, s) => n + s.salary, 0);

/** Chambers cost. One room per three fee earners, near enough. */
export const chambersRent = (p: PracticeState): number =>
  Math.round(Math.max(1, p.rooms) * 640 * legalCityOf(p).rent);

/**
 * Work in progress: hours already spent on cases that have not paid.
 *
 * The number that kills firms. It is not on the balance sheet as cash and it
 * is not free to carry, and a player who does not watch it will take on a
 * fourth case while three are still unfunded.
 */
export const workInProgress = (p: PracticeState): number =>
  p.cases.reduce((n, c) => {
    const k = CASE_BY_ID.get(c.kind);
    if (!k) return n;
    return n + Math.min(1, c.hoursDone / k.hours) * feeIn(p, k) * 0.35;
  }, 0);

export const hoursOutstanding = (p: PracticeState): number =>
  p.cases.reduce((n, c) => {
    const k = CASE_BY_ID.get(c.kind);
    return k ? n + Math.max(0, k.hours - c.hoursDone) : n;
  }, 0);

/* ------------------------------------------------------- what a clerk is for
 *
 * The practice clerk's card has always said "nothing lapses on their watch",
 * and until the court had a diary of its own that was four hours a week and a
 * sentence. It is now the thing that keeps your hearing dates where the court
 * put them.
 */
export const hasClerk = (p: PracticeState): boolean =>
  p.staff.some((s) => s.role === "clerk");

/** Nothing is put off for ever, and a case that never resolves is not a game. */
export const MAX_ADJOURNMENTS = 3;

/**
 * The chance the court moves this hearing rather than hearing it.
 *
 * Bigger matters slip more — there is more to list, more parties, and more
 * people with a reason to want longer. A clerk cuts it to a third, which is
 * the clearest reason in the career to hire somebody who bills almost no
 * hours at all.
 */
export function relistChance(p: PracticeState, k: CaseKind): number {
  const base = hasClerk(p) ? 0.06 : 0.18;
  return Math.min(0.3, base + k.prestige * 0.004);
}

/** Weeks the court puts it back by. Long enough to hurt, short enough to plan. */
export const RELIST_WEEKS: [number, number] = [3, 6];

/**
 * What a barrister costs, and what they are worth.
 *
 * The purest expression of this career's constraint available: certain cash
 * out **now**, months before the thing it improves can pay anything at all.
 * A player who is solvent can buy better odds; one who is financing four
 * files cannot, which is precisely when they would most like to.
 */
export const counselFee = (p: PracticeState, k: CaseKind): number =>
  Math.round(feeIn(p, k) * 0.09);

/**
 * Added to the odds on a case counsel is briefed on.
 *
 * Priced by simulation rather than by feel, and the first attempt was wrong:
 * at +0.07 for 11% of the fee, the expected return on a brief was about 10.6%
 * of the fee against a cost of 11% — a bet that looked like an investment and
 * was very slightly a loss. Nobody would ever have noticed, which is exactly
 * what makes it a trap.
 *
 * At +0.10 for 9%, briefing a contested matter is clearly worth it and
 * briefing one you were going to win anyway is clearly not — the odds cap at
 * 0.93, so most of what you paid for is thrown away on a strong case. That is
 * a judgement rather than an upgrade, which is the point.
 */
export const COUNSEL_ODDS = 0.1;

/**
 * What losing costs, over and above being paid nothing.
 *
 * Until this existed a loss was merely a blank week, and the settle-or-fight
 * decision was therefore a free option: run every case to the door, because
 * the worst outcome was zero. It is not zero. The other side's costs follow
 * the event, and a firm that fights everything pays for the other side's
 * solicitors as well as its own.
 *
 * Counsel argues them down, which is the second half of what the brief fee
 * buys. Settling avoids them entirely — that is the real reason solicitors
 * settle, and it is now the real reason in here too.
 */
export const costsOrder = (
  p: PracticeState,
  k: CaseKind,
  counsel: boolean,
): number => Math.round(feeIn(p, k) * 0.16 * (counsel ? 0.55 : 1));

/* ------------------------------------------------------------------- bills */

export const billsOf = (p: PracticeState): Bill[] => p.bills ?? [];

/**
 * WHAT A CLERK IS REALLY FOR
 *
 * Their card has always said "keeps the diary, the billing and the deadlines",
 * and for a long time only the diary half was true. The billing half is this:
 * somebody whose job is chasing money gets it in sooner and gets more of it.
 *
 * It matters because it is the only thing in the firm that attacks the career's
 * actual constraint. Every other hire buys hours, and hours are not the problem
 * — a practice with four people and no cash is still a practice with no cash.
 *
 * Simulation is why this exists at all. A clerk whose entire value was fewer
 * adjournments was worth about £160 a week against a salary of £820, so hiring
 * one was a slow way to lose, which no card said and no player would have
 * spotted.
 */
export const billWeeks = (p: PracticeState, payer: Payer): number =>
  payer.weeks === 0 ? 0 : Math.max(1, payer.weeks - (hasClerk(p) ? 2 : 0));

/** How likely a doubtful client is to argue the bill down, given who chases it. */
export const billDoubt = (p: PracticeState, payer: Payer): number =>
  payer.doubt * (hasClerk(p) ? 0.6 : 1);

/** Face value of every judgment that has not turned into money yet. */
export const billsOwed = (p: PracticeState): number =>
  billsOf(p).reduce((n, b) => n + b.amount, 0);

/**
 * What a factor will pay for a bill today.
 *
 * Worse the further off it is, because that is what they are actually buying:
 * the wait, and the chance it never lands. A bill maturing next week fetches
 * most of its face; one nine weeks out fetches barely half. Selling is never
 * the arithmetically best move and is frequently the only move, which is the
 * correct shape for a decision in this career.
 */
export function factorValue(b: Bill, week: number): number {
  const weeksLeft = Math.max(0, b.dueWeek - week);
  const rate = Math.max(0.55, Math.min(0.86, 0.86 - 0.035 * weeksLeft));
  return Math.round(b.amount * rate);
}

/**
 * The odds on a case as it currently stands.
 *
 * Base odds, plus what preparation beyond the minimum buys, plus counsel if
 * they are briefed, plus the firm's weight and your own skill. Capped below 1
 * on purpose: there is no amount of work that makes a contested case certain,
 * and a career built on pretending otherwise would have no decisions in it.
 */
export function oddsFor(
  c: LiveCase,
  p: PracticeState,
  skill: number,
): number {
  const k = CASE_BY_ID.get(c.kind);
  if (!k) return 0;
  const over = Math.max(0, c.hoursDone - k.hours) / Math.max(1, k.hours);
  const prep = Math.min(0.22, over * 0.3);
  const counsel = c.counsel ? COUNSEL_ODDS : 0;
  return Math.max(
    0.05,
    Math.min(0.93, k.baseOdds + prep + counsel + firmWeight(p) + skill / 900),
  );
}

/** As far as anything you have said in public can move an offer. */
export const MAX_PRESSURE = 0.12;

/**
 * What the other side will pay to make it go away.
 *
 * Rises as the case gets stronger, which is what makes settling a real
 * decision rather than an obvious mistake: the better your position, the more
 * you are being offered to give it up.
 *
 * Two later terms pull against each other. Publicity lifts it — a matter that
 * is being written about is worth more to end quietly. Every adjournment
 * shaves it, because they can see what waiting costs you and you cannot see
 * what it costs them.
 */
export function settlementFor(
  c: LiveCase,
  p: PracticeState,
  skill: number,
): number {
  const k = CASE_BY_ID.get(c.kind);
  if (!k) return 0;
  const odds = oddsFor(c, p, skill);
  const waited = Math.max(0.7, 1 - 0.04 * (c.adjournments ?? 0));
  const public_ = 1 + Math.min(MAX_PRESSURE, p.pressure ?? 0);
  /* Below the expected value — they are buying certainty too, and they are
     better at pricing it than you are. */
  return Math.round(feeIn(p, k) * odds * 0.72 * waited * public_);
}

const CLIENTS = [
  "Halloran & Co", "the Aldridge estate", "Ms Baptiste", "Northgate Freight",
  "Mr Ferreira", "the Okonjo family", "Vance Holdings", "Ms Lindqvist",
  "Ardal Construction", "the Wren Trust", "Mr Saeed", "Cormack Retail",
];

/**
 * Who is behind this instruction, and when they will actually pay.
 *
 * Deliberately correlated with the size of the work. A house purchase is a
 * couple who have a mortgage advance sitting in an account; a group claim is
 * funded by somebody with a finance department, a process, and no particular
 * hurry. That correlation is the point: the instruction that would change the
 * firm is also the one that will not pay for two months after it lands, which
 * is the same sentence as the career's premise seen from a different angle.
 */
export function payerFor(k: CaseKind, rng: Rng): PayerId {
  const prompt = Math.max(0.2, 0.62 - k.prestige * 0.014);
  if (rng.chance(prompt)) return "prompt";
  return rng.chance(0.7) ? "slow" : "doubtful";
}

/**
 * What comes in the door this week.
 *
 * Reputation gates the size of the work, not the volume: a firm nobody has
 * heard of still gets house purchases, it simply never gets the group claim.
 * That is the ladder the career climbs.
 *
 * `echo` is what something you published is still doing — an extra try at the
 * door for a week or two, on top of whatever pitching you did in person.
 */
export function newOffers(
  p: PracticeState,
  reputation: number,
  week: number,
  pitching: number,
  rng: Rng,
): CaseOffer[] {
  const out: CaseOffer[] = [];
  const city = legalCityOf(p);
  const echo = Math.max(0, p.echo ?? 0);
  const tries = 1 + pitching + echo;
  for (let i = 0; i < tries; i++) {
    if (
      !rng.chance(
        (0.35 + pitching * 0.16 + echo * 0.1 + reputation / 260) * city.flow,
      )
    ) {
      continue;
    }
    /*
     * Two gates, and they are different in kind. Reputation is what you have
     * earned and it rises; `reach` is what this market has and it does not.
     * A firm in Lagos can become the best-regarded practice in the city and
     * still never be offered a group claim, because the claim is not here.
     */
    const reachable = CASE_KINDS.filter(
      (k) => k.prestige <= 2 + reputation / 3.2 && k.prestige <= city.reach,
    );
    if (reachable.length === 0) continue;
    const kind = rng.pick(reachable);
    /*
     * A conflict can only exist once there is a history to conflict with, so
     * this is quiet for the first weeks of a run and then starts happening —
     * which is exactly how it goes. The other side is somebody you have
     * already acted for, which is why it is a conflict rather than bad luck.
     */
    const acted = p.actedFor ?? [];
    const clash = acted.length > 0 && rng.chance(0.14);
    const opponent = clash ? rng.pick(acted) : undefined;
    out.push({
      id: `of-${p.nextId++}`,
      kind: kind.id,
      client: rng.pick(CLIENTS),
      expiresWeek: week + 3,
      payer: payerFor(kind, rng),
      ...(opponent ? { conflict: true, opponent } : {}),
    });
  }
  return out;
}

export function initialPractice(): PracticeState {
  return {
    cases: [],
    offers: [],
    staff: [],
    rooms: 1,
    lastVerdicts: [],
    nextId: 1,
    bills: [],
    actedFor: [],
    echo: 0,
    pressure: 0,
  };
}
