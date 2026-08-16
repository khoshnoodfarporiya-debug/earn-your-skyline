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
  | "life";

export type SectionId = "overview" | "practice" | "network" | "career" | "life";

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

const SCREEN_INDEX = new Map<ScreenId, { section: SectionDef; screen: ScreenDef }>();
for (const section of SECTIONS) {
  for (const screen of section.screens) {
    SCREEN_INDEX.set(screen.id, { section, screen });
  }
}

export function sectionOf(screen: ScreenId): SectionDef {
  return SCREEN_INDEX.get(screen)?.section ?? SECTIONS[0];
}

export function screenOf(screen: ScreenId): ScreenDef {
  return SCREEN_INDEX.get(screen)?.screen ?? SECTIONS[0].screens[0];
}

/** Landing screen when a primary destination is tapped. */
export function defaultScreen(section: SectionId): ScreenId {
  return (
    SECTIONS.find((s) => s.id === section)?.screens[0].id ?? "overview"
  );
}
