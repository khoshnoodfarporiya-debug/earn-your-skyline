import { CRISIS_STAGES, NEGLECT_LIMIT, type CrisisKind } from "../game/crisis";
import type { MedIconName } from "../../components/visuals/MedIcon";

/**
 * WHAT STARTED THIS, AND WHAT MAKES IT WORSE
 *
 * A crisis card showed the stage, the severity and the choices. It did not say
 * where the thing came from or what happens if you close the tab — and both are
 * things the simulation knows exactly.
 *
 * `worsens` is not flavour: the drift rule in `neglect()` is +2 a week for the
 * first two weeks of inaction, then 6 plus the number of weeks ignored, an
 * automatic jump to the final stage at four, and a bad self-resolution at
 * eight. Those numbers are quoted here so a card can state the deadline rather
 * than implying one.
 */

export interface CrisisGuide {
  icon: MedIconName;
  /** Where this kind of trouble comes from. */
  cause: string;
  /** What it costs while it runs, and what it costs if left alone. */
  worsens: string;
  /** Who feels it. */
  affects: string;
}

export const CRISIS_GUIDE: Record<CrisisKind, CrisisGuide> = {
  lawsuit: {
    icon: "clipboard",
    cause: "A poor outcome that somebody decided to pursue rather than accept.",
    worsens:
      "The cost of settling rises with the severity. Fighting it is cheaper up front and much more expensive if you lose.",
    affects: "Your cash, your malpractice risk, and the clinician who treated them.",
  },
  walkout: {
    icon: "team",
    cause:
      "Workplace culture falling far enough that the people carrying the rota stopped believing it would improve.",
    worsens:
      "Capacity is already down while this runs. Left alone, more follow — and the ones who go first are the ones with somewhere to go.",
    affects: "Everyone still on the payroll, and the departments they were covering.",
  },
  inspection: {
    icon: "shield",
    cause:
      "Malpractice risk climbing far enough that the regulator stopped waiting for a complaint.",
    worsens:
      "Every week you do not answer adds severity, and a fourth week of silence jumps it straight to the final stage. Being seen to cooperate is worth more than being right.",
    affects:
      "Your licence, your credibility, and every clinician who has to explain who they work for.",
  },
  cashflow: {
    icon: "money",
    cause:
      "Fixed costs outrunning what the practice bills — usually an estate bought ahead of the caseload.",
    worsens:
      "Interest compounds and the options narrow. Each week of delay makes the remaining routes out more expensive than the last.",
    affects: "Payroll, upkeep, and every plan that assumed the money would be there.",
  },
  dataleak: {
    icon: "shield",
    cause:
      "Patient records going somewhere they should not have. Almost always process rather than malice.",
    worsens:
      "Patient trust bleeds every week it is unaddressed, and the regulator's interest grows with the silence.",
    affects: "Everyone on your list, whether or not their record was in it.",
  },
  scandal: {
    icon: "alert",
    cause:
      "Something the public found out about — usually the gap between what you said and what you did.",
    worsens:
      "Popularity and patient trust bleed every week it runs, and the story gets larger the longer it goes unanswered.",
    affects: "Your panel, your standing, and anyone associated with you.",
  },
  shortage: {
    icon: "capsule",
    cause:
      "A break in the consumables chain — usually a stock-out you gambled on, sometimes the market itself.",
    worsens:
      "Capacity is throttled while it runs. Every week without a fix treats fewer people at the same fixed cost.",
    affects: "Every site at once, and every case that needs anything at all.",
  },
};

/**
 * How far through a crisis is, and how long inaction has left.
 *
 * `stagesTotal` is read from the authored stage list, so a crisis that gains a
 * beat reports the new count without a change here.
 */
export function crisisProgress(
  kind: CrisisKind,
  stage: number,
  ignored: number,
) {
  const stagesTotal = CRISIS_STAGES[kind].length;
  return {
    stage: stage + 1,
    stagesTotal,
    /** Weeks of doing nothing before it resolves itself, badly. */
    weeksToBurnout: Math.max(0, NEGLECT_LIMIT - ignored),
    /** Inaction jumps straight to the final stage at four weeks. */
    weeksToEscalation: Math.max(0, 4 - ignored),
  };
}
