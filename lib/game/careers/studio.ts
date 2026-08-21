import type { StartCity } from "../types";

/**
 * THE STUDIO
 *
 * Everything the Architect is made of. No React, no engine.
 *
 * ------------------------------------------------------- the binding constraint
 *
 * The long commission. A building takes years, it is paid in stages, and the
 * person paying can change their mind at any point in it.
 *
 * The Solicitor already owns "nothing pays until it is finished", so this
 * career is deliberately built on the opposite half of that idea and one
 * thing nobody else has:
 *
 *   1. YOU DO GET PAID ALONG THE WAY. Each stage banks its share of the fee
 *      the moment it completes, and that money is yours for good. This is the
 *      floor the lumpy careers lack, and it is why an architect can survive a
 *      project that never gets built.
 *
 *   2. AND YOU CAN BE SENT BACKWARDS. A client who changes the brief drops
 *      the commission back a stage — the drawings for it are gone and the
 *      weeks must be spent again. The fees already banked stay banked, which
 *      is the whole tension: a project can pay you three times for the same
 *      stage and still never finish.
 *
 *   3. THE COUNTER-LEVER IS TIME WITH THE CLIENT. Revisions are not weather.
 *      A client who has seen you this month is far less likely to reinvent
 *      the brief, so hours spent in meetings rather than at the board are the
 *      real defence — and they draw nothing.
 *
 * Competitions sit on top of all of it: months of unpaid work, usually for
 * nothing, and the only way to be allowed to bid for the work that matters.
 */

/* ------------------------------------------------------------ where you are */

export interface StudioCity extends StartCity {
  /** Multiplies every fee here. */
  feeIndex: number;
  /** Multiplies how often clients reinvent the brief. */
  volatility: number;
  /** What an assistant costs, weekly, before the role's own rate. */
  wageIndex: number;
  /** Studio rent, weekly. */
  rent: number;
}

export const STUDIO_CITIES: StudioCity[] = [
  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    position: "amsterdam",
    blurb:
      "Modest budgets, serious clients, and planning rules that were written by people who cared.",
    effects: [
      "Clients here change their minds least",
      "Fees are the smallest on the board",
      "A cheap studio and cheap staff",
    ],
    difficulty: "gentle",
    feeIndex: 0.85,
    volatility: 0.7,
    wageIndex: 0.95,
    rent: 420,
  },
  {
    id: "milan",
    name: "Milan",
    country: "Italy",
    position: "milan",
    blurb: "A city that will forgive a late building but never an ugly one.",
    effects: [
      "Reputation is worth more here than anywhere",
      "Middling fees and middling patience",
      "Competitions are taken seriously",
    ],
    difficulty: "even",
    feeIndex: 1.0,
    volatility: 1.0,
    wageIndex: 1.0,
    rent: 560,
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    position: "tokyo",
    blurb:
      "Tight sites, exact clients, and a construction industry that does what the drawing says.",
    effects: [
      "Technical stages go faster — the drawings are trusted",
      "Good fees and demanding briefs",
      "An expensive studio",
    ],
    difficulty: "even",
    feeIndex: 1.15,
    volatility: 0.9,
    wageIndex: 1.2,
    rent: 780,
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    position: "dubai",
    blurb:
      "The largest fees you will ever be offered, attached to the least settled minds.",
    effects: [
      "Fees are half again what they are anywhere else",
      "Clients reinvent the brief constantly",
      "Towers, and the chance to be sent back to the start of one",
    ],
    difficulty: "hard",
    feeIndex: 1.5,
    volatility: 1.7,
    wageIndex: 1.1,
    rent: 690,
  },
];

export const STUDIO_CITY_BY_ID = new Map(STUDIO_CITIES.map((c) => [c.id, c]));

export const studioCityOf = (a: StudioState): StudioCity =>
  STUDIO_CITY_BY_ID.get(a.city) ?? STUDIO_CITIES[0];

/* --------------------------------------------------------------- the stages */

export interface Stage {
  id: string;
  label: string;
  blurb: string;
  /** Weeks of drawing at one board. */
  weeks: number;
  /** Share of the total fee banked when this stage completes. */
  feeShare: number;
}

/**
 * How a building is actually paid for: in five instalments, against work.
 *
 * The shares are front-light and middle-heavy on purpose. Concept pays almost
 * nothing, which is why a practice that only ever wins concept work starves,
 * and technical pays the most, which is why being sent back from tender to
 * design is the most expensive sentence in the career.
 */
export const STAGES: Stage[] = [
  {
    id: "concept",
    label: "Concept",
    blurb: "The idea, the massing, and the drawing that wins the room over.",
    weeks: 3,
    feeShare: 0.1,
  },
  {
    id: "design",
    label: "Design development",
    blurb: "Plans that survive contact with a structural engineer.",
    weeks: 5,
    feeShare: 0.2,
  },
  {
    id: "technical",
    label: "Technical design",
    blurb:
      "Every junction, every threshold, every drawing somebody has to build from.",
    weeks: 8,
    feeShare: 0.3,
  },
  {
    id: "tender",
    label: "Tender",
    blurb: "Contractors price it, and discover what you have asked for.",
    weeks: 4,
    feeShare: 0.15,
  },
  {
    id: "construction",
    label: "On site",
    blurb: "Two years of being wrong in public and fixing it in the rain.",
    weeks: 10,
    feeShare: 0.25,
  },
];

export const STAGE_COUNT = STAGES.length;

/* -------------------------------------------------------------- the work */

export interface ProjectKind {
  id: string;
  label: string;
  blurb: string;
  /** Before the city's fee index. */
  fee: number;
  /** Multiplies every stage's week count. */
  size: number;
  /** Standing needed before anybody offers you one. */
  needsReputation: number;
  /** How readily this client reinvents the brief, weekly, before the city. */
  volatility: number;
  /** What finishing one does to your standing. */
  prestige: number;
}

export const PROJECT_KINDS: ProjectKind[] = [
  {
    id: "extension",
    label: "A house extension",
    blurb:
      "A kitchen, a rooflight, and a couple who have opinions about handles.",
    fee: 14_000,
    size: 0.35,
    needsReputation: 0,
    volatility: 0.05,
    prestige: 1,
  },
  {
    id: "house",
    label: "A private house",
    blurb: "One client, one site, and the best work you will be allowed to do.",
    fee: 52_000,
    size: 0.7,
    needsReputation: 18,
    volatility: 0.07,
    prestige: 3,
  },
  {
    id: "offices",
    label: "An office building",
    blurb:
      "A developer, a spreadsheet, and a facade that has to cost what they said.",
    fee: 180_000,
    size: 1.1,
    needsReputation: 35,
    volatility: 0.09,
    prestige: 5,
  },
  {
    id: "school",
    label: "A school",
    blurb:
      "Public money, a committee, and the only building here that anybody will thank you for.",
    fee: 240_000,
    size: 1.25,
    needsReputation: 48,
    volatility: 0.11,
    prestige: 9,
  },
  {
    id: "tower",
    label: "A tower",
    blurb:
      "Forty floors, a client who has never finished anything, and your name on all of it.",
    fee: 620_000,
    size: 1.9,
    needsReputation: 62,
    volatility: 0.15,
    prestige: 14,
  },
  {
    id: "museum",
    label: "A museum",
    blurb:
      "The one everybody will know you for. Won in competition, never offered.",
    fee: 480_000,
    size: 1.7,
    needsReputation: 999,
    volatility: 0.1,
    prestige: 22,
  },
];

export const KIND_BY_ID = new Map(PROJECT_KINDS.map((k) => [k.id, k]));

/* -------------------------------------------------------------- the studio */

export interface StudioRole {
  id: string;
  label: string;
  blurb: string;
  salary: number;
  hireCost: number;
  /** Weeks of drawing added per week. */
  output: number;
}

export const STUDIO_ROLES: StudioRole[] = [
  {
    id: "assistant",
    label: "Part I assistant",
    blurb: "Cheap hands, endless energy, and everything needs checking.",
    salary: 620,
    hireCost: 700,
    output: 0.55,
  },
  {
    id: "architect",
    label: "Project architect",
    blurb: "Runs a job without you in the room. The backbone of a studio.",
    salary: 1_450,
    hireCost: 1_700,
    output: 1.25,
  },
  {
    id: "technologist",
    label: "Technologist",
    blurb:
      "Lives in the technical stage, which is where the money and the mistakes are.",
    salary: 1_250,
    hireCost: 1_400,
    output: 1.0,
  },
  {
    id: "associate",
    label: "Associate",
    blurb:
      "Sees the client so you do not have to, and they leave the brief alone afterwards.",
    salary: 1_850,
    hireCost: 2_200,
    output: 0.9,
  },
];

export const STUDIO_ROLE_BY_ID = new Map(STUDIO_ROLES.map((r) => [r.id, r]));

export interface StudioHire {
  id: string;
  name: string;
  role: string;
  salary: number;
  since: number;
}

/* --------------------------------------------------------- the commissions */

export interface Commission {
  id: string;
  kind: string;
  client: string;
  /** Index into STAGES. */
  stage: number;
  /** Weeks of drawing done in the current stage. */
  progress: number;
  /** Fee banked so far. Never returned, whatever happens next. */
  paid: number;
  /** How many times the brief has been reinvented under you. */
  revisions: number;
  /** Week the client was last actually seen. Recency is the whole defence. */
  lastSeen: number;
  startedWeek: number;
  done?: boolean;
}

export interface CompetitionEntry {
  id: string;
  kind: string;
  /** Weeks of work put in. More work, better odds. */
  effort: number;
  /** The week it is judged. */
  judgedWeek: number;
  entrants: number;
}

export interface StudioState {
  city: string;
  commissions: Commission[];
  offers: { id: string; kind: string; client: string }[];
  competition?: CompetitionEntry;
  team: StudioHire[];
  /** Buildings finished, by kind. The portfolio is what you are allowed to bid on. */
  built: string[];
  wonCompetitions: number;
  /** Which commission the board is pointed at. */
  focus?: string;
  nextId: number;
}

export function initialStudio(): StudioState {
  return {
    city: STUDIO_CITIES[0].id,
    commissions: [],
    offers: [],
    team: [],
    built: [],
    wonCompetitions: 0,
    nextId: 1,
  };
}

/* -------------------------------------------------------------- the numbers */

export const feeFor = (a: StudioState, kind: ProjectKind): number =>
  Math.round(kind.fee * studioCityOf(a).feeIndex);

/** What a stage of this project is worth when it completes. */
export const stageFee = (
  a: StudioState,
  kind: ProjectKind,
  stage: Stage,
): number => Math.round(feeFor(a, kind) * stage.feeShare);

/** Weeks of drawing this stage needs for this project. */
export const stageWeeks = (kind: ProjectKind, stage: Stage): number =>
  Math.max(1, Math.round(stage.weeks * kind.size));

export const rolePayStudio = (
  a: StudioState,
  role: StudioRole,
): { salary: number; hireCost: number } => ({
  salary: Math.round(role.salary * studioCityOf(a).wageIndex),
  hireCost: Math.round(role.hireCost * studioCityOf(a).wageIndex),
});

export const studioWages = (a: StudioState): number =>
  a.team.reduce((n, h) => n + h.salary, 0);

/** Drawing the studio does without you, weekly. */
export const studioOutput = (a: StudioState): number =>
  a.team.reduce((n, h) => {
    const role = STUDIO_ROLE_BY_ID.get(h.role);
    return n + (role?.output ?? 0);
  }, 0);

/** Associates are the ones who keep clients calm. */
export const associateCount = (a: StudioState): number =>
  a.team.filter((h) => h.role === "associate").length;

/**
 * The chance this client reinvents the brief this week.
 *
 * Three things move it, and the player can change two of them: the kind of
 * project, the city, and — the important one — how recently the client has
 * actually seen somebody. A client visited this month is most of the way to
 * being safe; one who has not been seen for a season is a coin toss waiting
 * to happen.
 */
export function revisionRisk(
  a: StudioState,
  c: Commission,
  week: number,
): number {
  const kind = KIND_BY_ID.get(c.kind);
  if (!kind) return 0;
  const base = kind.volatility * studioCityOf(a).volatility;
  /* Neglect, in weeks, capped so it cannot run away entirely. */
  const since = Math.min(12, Math.max(0, week - c.lastSeen));
  const neglect = 0.45 + (since / 12) * 0.9;
  /* Every associate takes a slice off the top by being the one who calls. */
  const cover = Math.max(0.45, 1 - associateCount(a) * 0.18);
  /* A brief already reinvented twice belongs to a client who does that. */
  const form = 1 + c.revisions * 0.12;
  return Math.min(0.6, base * neglect * cover * form);
}

/** How far back a revision throws you. Bigger projects fall further. */
export function revisionDepth(c: Commission): number {
  const kind = KIND_BY_ID.get(c.kind);
  if (!kind) return 1;
  return kind.size >= 1.5 ? 2 : 1;
}

/** Total fee still unbanked on a commission. */
export function unbanked(a: StudioState, c: Commission): number {
  const kind = KIND_BY_ID.get(c.kind);
  if (!kind) return 0;
  return Math.max(0, feeFor(a, kind) - c.paid);
}

/** Everything the studio is owed but has not earned yet. */
export const workOnTheBoards = (a: StudioState): number =>
  a.commissions
    .filter((c) => !c.done)
    .reduce((n, c) => n + unbanked(a, c), 0);

export const stageOf = (c: Commission): Stage =>
  STAGES[Math.max(0, Math.min(STAGE_COUNT - 1, c.stage))];

/** 0-1 through the current stage. */
export function stageProgress(c: Commission): number {
  const kind = KIND_BY_ID.get(c.kind);
  if (!kind) return 0;
  return Math.min(1, c.progress / stageWeeks(kind, stageOf(c)));
}

/** 0-1 through the whole building, by fee rather than by stage count. */
export function overallProgress(a: StudioState, c: Commission): number {
  const kind = KIND_BY_ID.get(c.kind);
  if (!kind) return 0;
  const fee = feeFor(a, kind);
  return fee > 0 ? Math.min(1, c.paid / fee) : 0;
}

/* ------------------------------------------------------------ competitions */

/** Entering costs money as well as months. */
export const entryFee = (a: StudioState, kind: ProjectKind): number =>
  Math.round(feeFor(a, kind) * 0.012);

/**
 * The odds of winning, given the work put in and who else entered.
 *
 * Deliberately poor. A competition is months of unpaid work that usually pays
 * nothing — the registry's own words — and the reason to enter anyway is that
 * a museum is the only route to the top of the profession.
 */
export function competitionOdds(
  entry: CompetitionEntry,
  reputation: number,
): number {
  const effort = Math.min(1, entry.effort / 10);
  const standing = Math.min(1, reputation / 100);
  const field = Math.max(2, entry.entrants);
  return Math.min(0.72, ((0.35 + effort * 0.9 + standing * 0.6) / field) * 2.2);
}

/** What a practice is allowed to be offered, by what it has finished. */
export function offerableKinds(
  a: StudioState,
  reputation: number,
): ProjectKind[] {
  return PROJECT_KINDS.filter(
    (k) => k.needsReputation <= reputation && k.needsReputation < 999,
  );
}

/** Names for the people who commission buildings. */
const CLIENTS = [
  "the Vermeulen family", "Brandt Developments", "the city council",
  "Hollis & Wray", "the Okonjo trust", "Marchetti Holdings",
  "a retired surgeon", "the harbour authority", "Ravel Estates",
  "an anonymous collector", "the school board", "Sørensen Group",
];

export const clientName = (n: number) => CLIENTS[n % CLIENTS.length];
