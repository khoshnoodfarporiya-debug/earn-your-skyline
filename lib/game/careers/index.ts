import type { CareerDef } from "../types";
import { doctor } from "./doctor";

/**
 * Careers are registered here. Adding one is a self-contained job: implement
 * CareerDef, register it, and the whole UI — meters, actions, ledger, events,
 * win screen — adapts with no changes anywhere else.
 *
 * The two below are stubs on purpose. They show the shape of the design: each
 * one has a different binding constraint, so the optimal play is different.
 */
export const CAREERS: CareerDef[] = [doctor];

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
 * The advantages and risks on the Physician card are not flavour: each line
 * corresponds to something the career actually does. The starting debt, the
 * three-claims limit and the burnout ceiling are all read straight off
 * `doctor.checkOutcome` and `doctor.initialResources`. Anything that stops
 * being true in the simulation must stop being claimed here.
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
    id: "chef",
    label: "Chef",
    icon: "knife",
    tagline:
      "One rented kitchen, a supplier who wants cash up front, and produce that is worth less every hour.",
    distinctRule:
      "Your constraint is spoilage, not time. Stock decays weekly, so over-ordering is as fatal as under-ordering, and a single bad review outruns a month of good service.",
    available: false,
    difficulty: "Volatile",
    advantages: [
      "Cash clears the same night you serve",
      "A full room forgives a great many mistakes",
    ],
    risks: [
      "Stock decays whether or not anybody eats it",
      "One bad review outruns a month of good service",
    ],
  },
  {
    id: "lawyer",
    label: "Solicitor",
    icon: "scales",
    tagline:
      "A practising certificate, a borrowed desk, and no clients who can pay yet.",
    distinctRule:
      "Your constraint is the case pipeline. Work is lumpy and paid on settlement, so you gamble months of billable time on outcomes you only partly control.",
    available: false,
    difficulty: "Punishing",
    advantages: [
      "A single won case can fund a year",
      "Reputation compounds harder here than anywhere",
    ],
    risks: [
      "Months of billable time ride on outcomes you only partly control",
      "Nothing pays until settlement",
    ],
  },
];

export function getCareer(id: string): CareerDef | undefined {
  return CAREERS.find((c) => c.id === id);
}
