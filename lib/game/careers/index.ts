import type { CareerDef } from "../types";
import { doctor } from "./doctor";
import { chef } from "./chef";
import { lawyer } from "./lawyer";

/**
 * Careers are registered here. Adding one is a self-contained job: implement
 * CareerDef, register it, and the engine — week loop, events, ledger, saves,
 * setbacks — adapts with no changes anywhere else.
 *
 * -------------------------------------------------------- what they share
 *
 * Nothing except the shape. Each one is built around a different binding
 * constraint, which is the only thing that makes a second career worth
 * playing rather than a reskin of the first:
 *
 *   Physician   capability — you cannot treat what you have no department for
 *   Chef        spoilage   — stock decays, and is served oldest-first
 *   Solicitor   the pipeline — nothing pays until it settles, and it might not
 *
 * A career whose constraint is really "have more money" does not belong here.
 * That test is what the previews below are held to.
 */
export const CAREERS: CareerDef[] = [doctor, chef, lawyer];

export interface CareerPreview {
  id: string;
  label: string;
  icon: string;
  tagline: string;
  distinctRule: string;
  available: boolean;
  /** How hard the run is, in one word. */
  difficulty: "Demanding" | "Punishing" | "Volatile";
  /** What the career hands you on week one. */
  advantages: string[];
  /** The ways it ends badly. For a built career these are the real ones. */
  risks: string[];
}

/**
 * The advantages and risks on a *built* career's card are not flavour: each
 * line corresponds to something the career actually does. The Physician's
 * starting debt, three-claims limit and burnout ceiling are read straight off
 * `doctor.checkSetbacks` and `doctor.initialResources`; the Chef's spoilage
 * and the Solicitor's settlement risk likewise. Anything that stops being true
 * in the simulation must stop being claimed here.
 *
 * The unbuilt ones below are marked `available: false` and are **designs, not
 * implementations**. They are listed because a distinct binding constraint is
 * the hard part of specifying a career and writing it down is what makes the
 * next one cheap to build — the Chef and the Solicitor sat here in exactly
 * this form before they existed. Nothing reads them as mechanics.
 */
export const CAREER_PREVIEWS: CareerPreview[] = [
  {
    id: doctor.id,
    label: doctor.label,
    icon: doctor.icon,
    tagline: doctor.tagline,
    distinctRule: doctor.distinctRule,
    available: true,
    difficulty: "Demanding",
    advantages: [
      "A licence that already works where you trained",
      "Patients arrive whether or not you are ready for them",
      "Fourteen markets open to you once you can afford them",
    ],
    risks: [
      "$165,000 of student debt from week one",
      "Three claims lost and your licence is suspended",
      "Burnout reaching 100 signs you off, and getting back is slow",
    ],
  },
  {
    id: chef.id,
    label: chef.label,
    icon: chef.icon,
    tagline: chef.tagline,
    distinctRule: chef.distinctRule,
    available: true,
    difficulty: "Volatile",
    advantages: [
      "Takings clear the same night you serve",
      "A full room compounds — nothing fills a dining room like not getting in",
      "Your own cooking is the one input nobody can take off you",
    ],
    risks: [
      "Produce spoils on a clock and leaves as a write-off",
      "Stock is served oldest-first, so over-ordering shows up on the plate",
      "Rent and wages fall due whether or not you open",
    ],
  },
  {
    id: lawyer.id,
    label: lawyer.label,
    icon: lawyer.icon,
    tagline: lawyer.tagline,
    distinctRule: lawyer.distinctRule,
    available: true,
    difficulty: "Punishing",
    advantages: [
      "One won case can fund a year of the firm",
      "Every live case carries a settlement you can take instead",
      "Standing decides the size of the work you are offered",
    ],
    risks: [
      "Nothing pays until it settles, and the rent does not wait",
      "A case can be lost after months of work and bills nothing",
      "Miss a deadline and the hours already sunk are simply gone",
    ],
  },

  /* ------------------------------------------------- designed, not built */

  {
    id: "architect",
    label: "Architect",
    icon: "compass",
    tagline:
      "A practice of one, a competition entry nobody asked for, and a fee scale set by people who have never drawn anything.",
    distinctRule:
      "Your constraint is the long commission. Buildings take years, payment is staged against milestones you do not control, and a client can change their mind in month eighteen and reset the work.",
    available: false,
    difficulty: "Punishing",
    advantages: [
      "One landmark rewrites what you are allowed to bid for",
      "Staged fees give a floor the other lumpy careers lack",
    ],
    risks: [
      "A commission can be redesigned around you at any stage",
      "Competitions cost real months and usually pay nothing",
    ],
  },
  {
    id: "founder",
    label: "Founder",
    icon: "rocket",
    tagline:
      "An idea, eleven weeks of savings, and a market that has not asked for it yet.",
    distinctRule:
      "Your constraint is runway. Everything is priced in weeks of survival rather than money, and raising more buys time at the cost of owning less of what you are building.",
    available: false,
    difficulty: "Punishing",
    advantages: [
      "Growth compounds faster here than in any other career",
      "You can trade ownership for time whenever you are willing to",
    ],
    risks: [
      "Runway is measured in weeks and only ever shortens",
      "Every raise takes a permanent share of the outcome",
    ],
  },
  {
    id: "politician",
    label: "Politician",
    icon: "podium",
    tagline:
      "A ward nobody wants, a party that has not decided about you, and an electorate that has.",
    distinctRule:
      "Your constraint is the electoral cycle. Support decays continuously and is only banked on polling day, so the whole run is spent spending capital you cannot keep.",
    available: false,
    difficulty: "Volatile",
    advantages: [
      "Office converts standing into things no amount of money buys",
      "A crisis handled well moves support faster than years of work",
    ],
    risks: [
      "Support decays every single week you do not defend it",
      "One position taken badly follows you for the rest of the run",
    ],
  },
  {
    id: "engineer",
    label: "Engineer",
    icon: "gear",
    tagline:
      "A workshop, a prototype that nearly works, and a certification body with no interest in your timeline.",
    distinctRule:
      "Your constraint is defect risk. Everything you ship carries latent faults that surface weeks later, so shipping faster raises revenue now and liability you cannot see yet.",
    available: false,
    difficulty: "Demanding",
    advantages: [
      "A certified product earns while you sleep",
      "Fixing a fault before it surfaces is far cheaper than after",
    ],
    risks: [
      "Faults are invisible when you ship and expensive when they land",
      "A recall can outlive the product that caused it",
    ],
  },
];

export function getCareer(id: string): CareerDef | undefined {
  return CAREERS.find((c) => c.id === id);
}
