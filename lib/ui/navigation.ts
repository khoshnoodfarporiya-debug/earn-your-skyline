/**
 * Navigation model.
 *
 * Nine equally-weighted tabs told a new player nothing about what mattered.
 * They are now five destinations, each answering a different question:
 *
 *   Overview  — what do I do this week?
 *   Practice  — what am I able to treat?
 *   Network   — where am I, and what is happening out there?
 *   Career    — what am I qualified to do myself?
 *   Life      — what is all this for?
 *
 * Every former tab is still reachable; the ones that are consequences of
 * other decisions (Caseload, Growth) now sit inside the section that causes
 * them rather than competing with it.
 */

export type ScreenId =
  | "overview"
  | "build"
  | "staff"
  | "supplies"
  | "caseload"
  | "contracts"
  | "team"
  | "money"
  | "rivals"
  | "cities"
  | "outbreaks"
  | "growth"
  | "career"
  | "standing"
  | "people"
  | "timeline"
  | "character"
  | "life"
  /* The two screens a career that is not the Physician has of its own. */
  | "operation"
  | "home"
  /* The Chef's own screens. Ids are deliberately distinct from the
     Physician's — `sectionOf` is a single index across every career, so a
     shared id would route a Chef into a medical section. */
  | "kitchen"
  | "larder"
  | "menu"
  | "pass"
  | "brigade"
  | "books"
  /* Phase 3: what the city thinks, and who else is cooking in it. */
  | "reviews"
  | "scene"
  /* Phase 4: the chef rather than the restaurant. */
  | "craft"
  | "beyond"
  /* The Solicitor's own screens, distinct from both other careers' for the
     same reason the Chef's are: `sectionOf` is a single flat index, and a
     shared id routes a solicitor into somebody else's section. `casework` is
     deliberately not the Physician's `caseload`, and `ledger` is deliberately
     not the Chef's `books`. */
  | "instructions"
  | "casework"
  | "ledger"
  | "firm";

export type SectionId =
  | "overview"
  | "practice"
  | "network"
  | "career"
  | "life"
  /* The generic shell's own destinations. Deliberately not "practice" and
     "network": those ids belong to the Physician, and `defaultScreen` would
     route a Chef to the medical Build screen — which is exactly what it did
     the first time this was wired up. */
  | "business"
  | "where"
  /* The Chef's one content destination, holding five screens. */
  | "kitchen"
  /* And the one that is about the chef rather than the restaurant. */
  | "chef"
  /* The Solicitor's one content destination, holding four screens. */
  | "chambers";

export interface ScreenDef {
  id: ScreenId;
  label: string;
  /** One line shown under the sub-nav explaining what this screen decides. */
  purpose: string;
}

export interface SectionDef {
  id: SectionId;
  label: string;
  /** Icon key resolved by NavIcon. */
  icon: string;
  screens: ScreenDef[];
}

export const SECTIONS: SectionDef[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "pulse",
    screens: [
      {
        id: "overview",
        label: "Overview",
        purpose: "Your week, and everything that needs a decision.",
      },
    ],
  },
  {
    id: "practice",
    label: "Practice",
    icon: "building",
    screens: [
      {
        id: "build",
        label: "Build",
        purpose: "Premises, departments and equipment — what you are able to treat.",
      },
      {
        id: "staff",
        label: "Staff",
        purpose: "Who does the work, and what they cost you every week.",
      },
      {
        id: "supplies",
        label: "Supplies",
        purpose:
          "Consumables the clinic burns through. Buy ahead for a discount, or pay spot forever.",
      },
      {
        id: "caseload",
        label: "Caseload",
        purpose: "Who arrived last week, who you treated, and who you turned away.",
      },
      {
        id: "contracts",
        label: "Work",
        purpose: "Assignments on offer, what you are carrying, and how it is going.",
      },
      {
        id: "team",
        label: "Team",
        purpose: "Who works here, how they are doing, and what this place is like.",
      },
      {
        id: "money",
        label: "Money",
        purpose: "What you owe, what you gave away, and what is still on offer.",
      },
    ],
  },
  {
    id: "network",
    label: "Network",
    icon: "globe",
    screens: [
      {
        id: "cities",
        label: "Cities",
        purpose: "Where you operate and which markets are worth entering.",
      },
      {
        id: "outbreaks",
        label: "Outbreaks",
        purpose: "What is spreading, and how you intend to answer it.",
      },
      {
        id: "growth",
        label: "Growth",
        purpose: "Marketing, and the catchment it buys you.",
      },
      {
        id: "rivals",
        label: "Rivals",
        purpose: "The other careers running beside yours, and where they stand.",
      },
    ],
  },
  {
    id: "career",
    label: "Career",
    icon: "certificate",
    screens: [
      {
        id: "career",
        label: "Career",
        purpose: "Qualifications — what you can personally take on.",
      },
      {
        id: "character",
        label: "Character",
        purpose: "Where you came from, who you became, and what this is for.",
      },
      {
        id: "standing",
        label: "Standing",
        purpose: "What six different groups of people think of you, and why.",
      },
      {
        id: "people",
        label: "People",
        purpose: "The colleagues, rivals and backers who remember what you did.",
      },
      {
        id: "timeline",
        label: "Timeline",
        purpose: "What has actually happened in this career so far.",
      },
    ],
  },
  {
    id: "life",
    label: "Life",
    icon: "home",
    screens: [
      {
        id: "life",
        label: "Life",
        purpose: "What the money is for, and what it costs you to keep.",
      },
    ],
  },
];

/**
 * NAVIGATION FOR A CAREER THAT IS NOT THE PHYSICIAN
 *
 * `SECTIONS` above is a medical vocabulary — Caseload, Supplies, Outbreaks —
 * and eighteen months of Physician-specific screens sit behind it. A second
 * career cannot borrow that and should not pretend to.
 *
 * So a career the app has no bespoke screens for gets two destinations: the
 * week, and the thing the career is about — the planner, the ledger and the
 * events are engine-level and already career-agnostic, and the one screen
 * carries the mechanic that makes the career different from the others.
 *
 * Both careers that have ever used this have since outgrown it: the Chef
 * first (`CHEF_SECTIONS`), the Solicitor after (`LAWYER_SECTIONS`). What is
 * left here is the landing place for the *next* career, which is the job it
 * was written for. It is honestly a smaller shell than the Physician's, not a
 * claim of parity.
 */
const GENERIC_SECTIONS: SectionDef[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "pulse",
    screens: [
      {
        id: "overview",
        label: "Overview",
        purpose: "Your week, and everything that needs a decision.",
      },
    ],
  },
  {
    id: "business",
    label: "Business",
    icon: "building",
    screens: [
      {
        id: "operation",
        label: "Business",
        purpose: "What you are running, and the decision it puts in front of you.",
      },
    ],
  },
  {
    id: "where",
    label: "Map",
    icon: "globe",
    screens: [
      {
        id: "home",
        label: "Map",
        purpose: "Where you work, and how far that currently reaches.",
      },
    ],
  },
];

/**
 * NAVIGATION FOR THE CHEF
 *
 * The Chef outgrew the generic shell first. One "Business" screen carried the
 * book, the larder, six suppliers, the kit list, the brigade and the service
 * report in a single column — about two thousand pixels of scrolling on a
 * phone, with the decision you opened it to make somewhere in the middle.
 *
 * It is still one destination in the bar, because a Chef runs one restaurant
 * and a second primary tab would imply a second business. What changed is that
 * the destination now has screens, each answering a question the career
 * actually asks:
 *
 *   The room    what can this building do?
 *   Larder      what is in it, how long has it got, and who brings more?
 *   The pass    what am I able to serve, and how did the last night go?
 *   Brigade     who is on the line, and are they staying?
 *   Money       what is coming in, what leaves anyway, and what is it worth?
 *
 * No mechanic moved. This is the same state, split at the seams it already
 * had.
 */
const CHEF_SECTIONS: SectionDef[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "pulse",
    screens: [
      {
        id: "overview",
        label: "Overview",
        purpose: "Your week, and everything that needs a decision.",
      },
    ],
  },
  {
    id: "kitchen",
    label: "Kitchen",
    icon: "building",
    screens: [
      {
        id: "kitchen",
        label: "The room",
        purpose:
          "Premises and equipment — how many you can seat, and how long food keeps.",
      },
      {
        id: "larder",
        label: "Larder",
        purpose:
          "What is in stock, what dies next week, and who you order the rest from.",
      },
      {
        id: "menu",
        label: "Menu",
        purpose:
          "What you cook, what it costs to make, and what you charge for it.",
      },
      {
        id: "pass",
        label: "The pass",
        purpose:
          "How much of the room you sell in advance, what you can serve, and how the last night went.",
      },
      {
        id: "brigade",
        label: "Brigade",
        purpose: "Who is on the line, how they are holding up, and who else you could take on.",
      },
      {
        id: "books",
        label: "Money",
        purpose: "Takings, the costs that arrive whether you open or not, and the loan.",
      },
      {
        id: "reviews",
        label: "Word of mouth",
        purpose:
          "What seven different groups of people think of you, what they wrote, and what needs an answer.",
      },
    ],
  },
  /*
   * THE FOURTH DESTINATION, AND WHY IT IS NOT PART OF THE KITCHEN
   *
   * Everything under Kitchen is a property of the restaurant: the room, the
   * stock, the menu, the brigade, the book. These two are properties of the
   * *chef* — what they can personally do, and the work they are offered
   * because of it — and they travel with the person rather than the premises.
   *
   * The Physician has had exactly this separation since it shipped, under
   * "Career". It is the same distinction and it earns its own tab for the same
   * reason: a player deciding whether to spend a week learning to fillet fish
   * is not thinking about their larder.
   */
  {
    id: "chef",
    label: "You",
    icon: "certificate",
    screens: [
      {
        id: "craft",
        label: "The craft",
        purpose:
          "What you can personally cook, what you are learning, and where you could go to learn faster.",
      },
      {
        id: "beyond",
        label: "Beyond the kitchen",
        purpose:
          "Books, television, consultancy and pop-ups — and the weeks they take out of your own pass.",
      },
    ],
  },
  {
    id: "where",
    label: "Map",
    icon: "globe",
    screens: [
      {
        id: "home",
        label: "Map",
        purpose: "Where you work, and how far that currently reaches.",
      },
      {
        id: "scene",
        label: "The scene",
        purpose:
          "Who eats out in this city, what the season is doing, and the three restaurants competing for them.",
      },
    ],
  },
];

/**
 * NAVIGATION FOR THE SOLICITOR
 *
 * The Solicitor was the last career on the generic shell, and it showed. One
 * "Business" screen carried the live files, the instructions on the table and
 * the hire shelf in a single column — so the decision the whole career is
 * built around, whether to settle or go to the door, sat below two other
 * things on a phone.
 *
 * It is still one destination in the bar, because a solicitor runs one
 * practice and a second primary tab would imply a second firm. What changed is
 * that the destination now has screens, each answering a question the career
 * actually asks — and, crucially, the *reports* are split from the
 * *transactions*:
 *
 *   Instructions   what is on the table, who pays and when, what to decline
 *   Casework       what you are carrying, and what settling it pays today
 *   The books      cash, what you are owed, what is unbilled, what falls due
 *   The firm       who is billing hours, and what they cost every week
 *
 * Hiring and briefing counsel are not here: those are calls you make, and
 * they live on the handset under Roll and Listings. The same split the Chef's
 * market and agency went through, for the same reason.
 */
const LAWYER_SECTIONS: SectionDef[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "pulse",
    screens: [
      {
        id: "overview",
        label: "Overview",
        purpose: "Your week, and everything that needs a decision.",
      },
    ],
  },
  {
    id: "chambers",
    label: "Chambers",
    icon: "building",
    screens: [
      {
        id: "instructions",
        label: "Instructions",
        purpose:
          "What is on the table, who is paying and when, and what this market will ever send you.",
      },
      {
        id: "casework",
        label: "Casework",
        purpose:
          "The files you are carrying, what they are worth if they land, and what settling pays today.",
      },
      {
        id: "ledger",
        label: "The books",
        purpose:
          "Cash, what you are owed, what is unbilled, and the costs that fall due whatever happens.",
      },
      {
        id: "firm",
        label: "The firm",
        purpose:
          "Who is billing hours for you, what they cost every week, and what the record says you have done.",
      },
    ],
  },
  {
    id: "where",
    label: "Map",
    icon: "globe",
    screens: [
      {
        id: "home",
        label: "Map",
        purpose: "Where you work, and how far that currently reaches.",
      },
    ],
  },
];

/** The destinations this career actually has. */
export function sectionsFor(careerId: string): SectionDef[] {
  if (careerId === "doctor") return SECTIONS;
  if (careerId === "chef") return CHEF_SECTIONS;
  if (careerId === "lawyer") return LAWYER_SECTIONS;
  return GENERIC_SECTIONS;
}

const SCREEN_INDEX = new Map<ScreenId, { section: SectionDef; screen: ScreenDef }>();
for (const section of [
  ...SECTIONS,
  ...GENERIC_SECTIONS,
  ...CHEF_SECTIONS,
  ...LAWYER_SECTIONS,
]) {
  for (const screen of section.screens) {
    if (!SCREEN_INDEX.has(screen.id)) SCREEN_INDEX.set(screen.id, { section, screen });
  }
}

/**
 * The section a screen belongs to.
 *
 * `careerId` matters whenever two careers share a screen id, which `home` and
 * `overview` both do. The Chef's Map destination carries two screens and the
 * Solicitor's carries one, and the flat index answers with whichever was
 * registered first — so without the career, a Chef standing on the map was
 * told their section had a single screen and the sub-navigation refused to
 * render. The scene screen was unreachable, and a Playwright run found it.
 *
 * The argument is optional so every existing caller still compiles, and the
 * flat index remains the fallback for anything that genuinely does not know
 * which career it is looking at.
 */
export function sectionOf(screen: ScreenId, careerId?: string): SectionDef {
  if (careerId) {
    const owned = sectionsFor(careerId).find((section) =>
      section.screens.some((s) => s.id === screen),
    );
    if (owned) return owned;
  }
  return SCREEN_INDEX.get(screen)?.section ?? SECTIONS[0];
}

export function screenOf(screen: ScreenId): ScreenDef {
  return SCREEN_INDEX.get(screen)?.screen ?? SECTIONS[0].screens[0];
}

/** Landing screen when a primary destination is tapped. */
export function defaultScreen(section: SectionId): ScreenId {
  return (
    [
      ...SECTIONS,
      ...GENERIC_SECTIONS,
      ...CHEF_SECTIONS,
      ...LAWYER_SECTIONS,
    ].find((s) => s.id === section)?.screens[0].id ?? "overview"
  );
}
