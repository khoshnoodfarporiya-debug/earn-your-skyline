/**
 * Exercises every command the UI can dispatch, and asserts each one both
 * applies when it should and refuses when it should not.
 *
 * The UI can only reach these through affordability-gated buttons, so this is
 * where the guard rails actually get tested.
 *
 * Run: npx tsx scripts/commands.ts
 */

import { doctor, med } from "../lib/game/careers/doctor";
import {
  advanceWeek,
  resolveEventChoice,
  runCommand,
  startRun,
} from "../lib/game/engine";
import { nextStep } from "../lib/ui/guidance";
import { makeRng } from "../lib/game/rng";
import {
  PERSON_ROLES,
  driftPeople,
  personIn,
  remembers,
  touchPerson,
} from "../lib/game/people";
import { hasMilestone, mark, timelineOf } from "../lib/game/timeline";
import {
  MAX_PENDING,
  schedule,
  takeDue,
  upcoming,
} from "../lib/game/consequences";
import {
  REPUTATIONS,
  REP_BY_ID,
  applyRep,
  attritionRisk,
  hiringBonus,
  overallReputation,
} from "../lib/game/reputation";
import { CHAIN_EVENTS } from "../lib/game/medical/chains";
import { SAVE_KEYS, migrateRun, validateRun } from "../lib/game/save";
import {
  MAX_SETBACKS,
  RECOVERY,
  SETBACK_KINDS,
  canPractise,
  has,
  setbackEffects,
} from "../lib/game/setbacks";
import { BACKGROUNDS, fromBackground } from "../lib/game/backgrounds";
import {
  TRAITS,
  TRAIT_CAP,
  burnoutFactor,
  checkTraits,
  ethicsDrift,
  hasTrait,
  loyaltyDrift,
  noteBehaviour,
  opportunismFactor,
  preparationFactor,
} from "../lib/game/traits";
import {
  AMBITIONS,
  AMBITION_BY_ID,
  checkAmbition,
  setAmbition,
} from "../lib/game/ambitions";
import {
  grantFor,
  legacyFor,
  retire,
  retirementSummary,
} from "../lib/game/retirement";
import { driftMarket, type CityMarket } from "../lib/game/medical/economy";
import {
  churnRate,
  cultureScore,
  errorRate,
  hydrateStaff,
  productivityFactor,
  recruitAppeal,
} from "../lib/game/medical/culture";
import {
  MAX_RIVAL_HISTORY,
  initialRival,
  recordContest,
  rivalBid,
  tickRivals,
} from "../lib/game/rivals";
import { PHYSICIAN_RIVALS } from "../lib/game/medical/rivalCast";
import { CAST_BY_ID } from "../lib/game/medical/cast";
import {
  CONTRACT_KINDS,
  MAX_ACTIVE,
  MAX_CONTRACT_HISTORY,
  MAX_OFFERS,
  readinessFor,
  requiredScore,
  resolveContract,
  rollComplication,
  startContract,
} from "../lib/game/contracts";
import {
  CONTRACT_BY_ID,
  MEDICAL_CONTRACTS,
} from "../lib/game/medical/contractList";
import {
  FUNDING_KINDS,
  MAX_EQUITY,
  MAX_OBLIGATIONS,
  dividendOn,
  equitySold,
  fundingOffers,
  obligations,
  ownedShare,
  repay,
  takeFunding,
  tickFinance,
  totalOutstanding,
} from "../lib/game/finance";
import { MAX_WORLD_NEWS, rivalNews, worldNews } from "../lib/game/news";
import {
  CRISIS_KINDS,
  CRISIS_STAGES,
  MAX_CRISES,
  NEGLECT_LIMIT,
  crisisRisk,
  startCrisis,
  tickCrisis,
} from "../lib/game/crisis";
import { loadLastPlan, saveLastPlan } from "../lib/game/save";
import { PLANS, applyPlan, clampPlan } from "../components/overview/QuickPlan";
import {
  CAREER_VISUALS,
  clusterNodes,
  CITY_VISUALS,
  EVENT_VISUALS,
  MILESTONE_VISUAL,
  NETWORK_VISUAL,
  OUTBREAK_VISUAL,
  PRACTICE_STAGES,
  PRACTICE_VISUAL,
  SECTION_VISUALS,
  careerVisual,
  cityVisual,
  eventVisual,
  networkNodes,
  networkRoutes,
  practiceStageIndex,
} from "../lib/ui/visuals";
import { CAREER_PREVIEWS } from "../lib/game/careers";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Every file under a directory, recursively. */
function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walkFiles(join(dir, entry.name))
      : [join(dir, entry.name)],
  );
}
import { centreScroll } from "../lib/ui/worldmap";
import {
  BORDER_PATH,
  GRATICULE_PATH,
  LAND_PATH,
} from "../lib/ui/worldmap.generated";

/**
 * Real coordinates for the fourteen markets, mirroring `scripts/build-map.ts`.
 * Duplicated deliberately: if the two ever disagree, the projection assertion
 * below fails, which is exactly the drift worth catching.
 */
const CITY_LATLON: Record<string, [number, number]> = {
  lyon: [4.84, 45.76],
  madrid: [-3.7, 40.42],
  milan: [9.19, 45.46],
  berlin: [13.4, 52.52],
  amsterdam: [4.9, 52.37],
  paris: [2.35, 48.86],
  london: [-0.13, 51.51],
  dubai: [55.27, 25.2],
  singapore: [103.82, 1.35],
  tokyo: [139.69, 35.69],
  newyork: [-74.01, 40.71],
  saopaulo: [-46.63, -23.55],
  mumbai: [72.88, 19.08],
  lagos: [3.38, 6.52],
};

/** One point inside each region the map must actually draw. */
const REGION_PROBES: Record<string, [number, number]> = {
  "north-america": [-100, 45],
  "south-america": [-60, -10],
  europe: [10, 50],
  africa: [20, 0],
  "middle-east": [45, 25],
  "south-asia": [78, 22],
  "southeast-asia": [105, 12],
  "east-asia": [110, 35],
};
import { loadRun } from "../lib/game/save";
import { compactCount } from "../lib/game/format";
import { FACILITY_BY_ID } from "../lib/game/medical/data";
import { activeCities } from "../lib/game/medical/sim";
import { playerCoverage, recruitBonus } from "../lib/game/medical/progression";
import { catchmentMultiplier } from "../lib/game/medical/marketing";
import { lifestyleValue, restBonus } from "../lib/game/medical/lifestyle";
import {
  CITIES,
  capturedShare,
  cityOf,
  contestedShare,
  populationCeiling,
} from "../lib/game/medical/cities";
import {
  OUTBREAKS,
  OUTBREAK_BY_ID,
  outbreakPressure,
  outbreakSurge,
  pressureBand,
  severityCeiling,
} from "../lib/game/medical/outbreaks";
import {
  MAX_FEED,
  MAX_MESSAGES,
  MAX_NEWS,
  reactionsFor,
  unreadMessages,
} from "../lib/game/medical/phone";
import {
  commsHazardFactor,
  commsReachBonus,
  commsScrutinyRelief,
  commsStaff,
  scrutinyRisk,
  sentimentCatchment,
  trustRecruitBonus,
} from "../lib/game/medical/social";
import {
  SUPPLY_COST,
  consumptionFor,
  drawSupplies,
  supplyThrottle,
  tierCost,
  tierStock,
} from "../lib/game/medical/supplies";
import { computeCapacity } from "../lib/game/medical/sim";
import {
  capacityIn,
  catchmentIn,
  facilityPrice,
  slotsIn,
} from "../lib/game/medical/sim";
import { patientFlow, flowIsConsistent } from "../lib/ui/flow";
import { capacityPipeline, pipelineMatchesEngine } from "../lib/ui/capacity";
import { DEPARTMENTS, departmentCoverage } from "../lib/ui/departments";
import { weeklyFinance } from "../lib/ui/finance";
import { standingRows } from "../lib/ui/standing";
import { CRISIS_GUIDE, crisisProgress } from "../lib/ui/pressure";
import { SPECIALTIES } from "../lib/game/medical/data";
import { coverageFor, payroll } from "../lib/game/medical/sim";
import { MED_ICON_NAMES } from "../components/visuals/MedIcon";
import { basename, dirname } from "node:path";
import { PURCHASE_ART, missingArt, orphanArt } from "../lib/ui/purchaseArt";
import { ART_SIZES } from "../lib/ui/purchaseArt.generated";
import { DEPARTMENT_BY_ID } from "../lib/ui/departments";
import { allPurchases } from "../lib/ui/purchases";
import { LIFESTYLE } from "../lib/game/medical/lifestyle";
import { EQUIPMENT } from "../lib/game/medical/data";
import {
  CAST_PORTRAITS,
  allPortraits,
  castHandles,
  hasPortraitForPerson,
  isOrganisation,
  portraitForPerson,
  portraitForSocialHandle,
} from "../lib/ui/portraits";
import { BOTS } from "../lib/game/medical/bots";
import { FULL_CAST } from "../lib/game/medical/cast";
import { staffName } from "../lib/game/medical/data";
import { initialsOf } from "../lib/game/people";
import type { RunState } from "../lib/game/types";

let failures = 0;
function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  ok    ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const run = (s: RunState, cmd: string, arg = "") =>
  runCommand(doctor, s, cmd, arg);

console.log("\nCommand contract\n" + "─".repeat(52));

let s = startRun(doctor, 99);
s.r.cash = 1_000_000;

// --- facilities ------------------------------------------------------------
const before = med(s).facilities.length;
s = run(s, "buyFacility", "clinic");
check("buyFacility adds a site", med(s).facilities.length === before + 1);
check("buyFacility charges cash", s.r.cash === 1_000_000 - 34_000);

const poor = run({ ...s, r: { ...s.r, cash: 10 } }, "buyFacility", "hospital");
check(
  "buyFacility refused when unaffordable",
  med(poor).facilities.length === med(s).facilities.length,
);

// --- departments -----------------------------------------------------------
s = run(s, "openDepartment", "cardiology");
check("openDepartment opens it", med(s).departments.includes("cardiology"));

const dup = run(s, "openDepartment", "cardiology");
check(
  "openDepartment refuses duplicates",
  med(dup).departments.length === med(s).departments.length,
);

// Fill every department slot, then confirm the next one is refused.
let filled = s;
for (const d of [
  "paediatrics",
  "dermatology",
  "psychiatry",
  "radiology",
  "neurology",
  "orthopaedics",
] as const) {
  filled = run(filled, "openDepartment", d);
}
const slots = med(filled).facilities.reduce(
  (n, f) => n + (f.type === "clinic" ? 3 : f.type === "room" ? 1 : 0),
  0,
);
check(
  "openDepartment respects premises limit",
  med(filled).departments.length <= slots,
  `${med(filled).departments.length} departments vs ${slots} slots`,
);

// --- equipment -------------------------------------------------------------
s = run(s, "buyEquipment", "ecg");
check("buyEquipment adds it", med(s).equipment.includes("ecg"));
const dupEq = run(s, "buyEquipment", "ecg");
check(
  "buyEquipment refuses duplicates",
  med(dupEq).equipment.length === med(s).equipment.length,
);

// --- staff -----------------------------------------------------------------
s = run(s, "hire", "nurse");
check(
  "hire adds a nurse",
  med(s).staff.some((x) => x.role === "nurse"),
);

s = run(s, "hire", "specialist:cardiology");
const spec = med(s).staff.find((x) => x.role === "specialist");
check(
  "hire specialist parses role:specialty",
  spec?.specialty === "cardiology",
);
check("hired staff carry a name and skill", !!spec?.name && spec.skill > 0);

const noSpec = run(s, "hire", "specialist");
check(
  "hire refuses a specialist with no specialty",
  med(noSpec).staff.length === med(s).staff.length,
);

const target = med(s).staff[0].id;
const cashBefore = s.r.cash;
const salary = med(s).staff[0].salary;
s = run(s, "fire", target);
check("fire removes them", !med(s).staff.some((x) => x.id === target));
check("fire charges severance", s.r.cash === cashBefore - salary * 2);

const ghost = run(s, "fire", "does-not-exist");
check(
  "fire on an unknown id is a no-op",
  med(ghost).staff.length === med(s).staff.length,
);

// --- triage ----------------------------------------------------------------
s = run(s, "triage", "profitable");
check("triage sets the policy", med(s).triage === "profitable");

// --- loan ------------------------------------------------------------------
const debtBefore = s.r.debt;
s = run(s, "payLoan");
check("payLoan reduces the balance", s.r.debt === debtBefore - 10_000);

const broke = run({ ...s, r: { ...s.r, cash: 0 } }, "payLoan");
check("payLoan refused with no cash", broke.r.debt === s.r.debt);

const cleared = run(
  { ...s, r: { ...s.r, debt: 3_000, cash: 50_000 } },
  "payLoan",
);
check(
  "payLoan never overshoots into negative debt",
  cleared.r.debt === 0,
  `got ${cleared.r.debt}`,
);

// --- qualifications --------------------------------------------------------
let q = startRun(doctor, 5);
q.r.cash = 500_000;
q = run(q, "buyFacility", "clinic");
q = run(q, "openDepartment", "cardiology");

const tooSoon = run(q, "enrol", "membership:cardiology");
check(
  "enrol refused without skill or CPD",
  med(tooSoon).qualifications.length === 1,
);

q.r.skill = 80;
q.r.cpd = 400;
const skipped = run(q, "enrol", "fellowship:cardiology");
check(
  "enrol refused when the prerequisite is missing",
  !med(skipped).qualifications.some((x) => x.id === "fellowship"),
);

q = run(q, "enrol", "membership:cardiology");
check(
  "enrol grants the qualification",
  med(q).qualifications.some(
    (x) => x.id === "membership" && x.specialty === "cardiology",
  ),
);
check("enrol charges tuition and CPD", q.r.cpd === 360);
check(
  "membership raises personal coverage",
  playerCoverage(med(q), "cardiology") === 3,
);
check(
  "coverage is per-department, not global",
  playerCoverage(med(q), "general") === 2,
);

q = run(q, "enrol", "fellowship:cardiology");
check(
  "fellowship stacks on membership",
  playerCoverage(med(q), "cardiology") === 4,
);

const wrongField = run(q, "enrol", "surgical:general");
check(
  "specialised prerequisite must be in the same field",
  !med(wrongField).qualifications.some((x) => x.id === "surgical"),
);

const beforeRecruit = recruitBonus(med(q));
q = run(q, "enrol", "doctorate");
check(
  "doctorate improves future recruits",
  recruitBonus(med(q)) > beforeRecruit,
);

// --- marketing -------------------------------------------------------------
let mk = startRun(doctor, 11);
mk.r.cash = 200_000;
const baseMul = catchmentMultiplier(med(mk), 50);
mk = run(mk, "toggleCampaign", "billboards");
check(
  "toggleCampaign starts a campaign",
  med(mk).campaigns.includes("billboards"),
);
check(
  "campaign raises the catchment multiplier",
  catchmentMultiplier(med(mk), 50) > baseMul,
);
mk = run(mk, "toggleCampaign", "billboards");
check(
  "toggleCampaign stops it again",
  !med(mk).campaigns.includes("billboards"),
);

const lockedOut = run(
  { ...mk, r: { ...mk.r, reputation: 20 } },
  "toggleCampaign",
  "referralNetwork",
);
check(
  "campaign refused below its reputation floor",
  !med(lockedOut).campaigns.includes("referralNetwork"),
);

// Word-of-mouth channels must be able to go negative on a bad reputation.
const social = run(mk, "toggleCampaign", "socialMedia");
check(
  "word-of-mouth reach shrinks when poorly regarded",
  catchmentMultiplier(med(social), 10) < catchmentMultiplier(med(social), 90),
);

// --- lifestyle -------------------------------------------------------------
let lf = startRun(doctor, 13);
lf.r.cash = 3_000_000;
lf = run(lf, "buyLifestyle", "townhouse");
check("buyLifestyle adds the item", med(lf).lifestyle.includes("townhouse"));
check("home adds rest bonus", restBonus(med(lf)) > 0);

const cashBeforeUpgrade = lf.r.cash;
lf = run(lf, "buyLifestyle", "suburban_house");
check(
  "a second home replaces the first",
  med(lf).lifestyle.includes("suburban_house") &&
    !med(lf).lifestyle.includes("townhouse"),
);
check(
  "trading up refunds the old home at its retained value",
  Math.round(lf.r.cash) ===
    Math.round(cashBeforeUpgrade - 430_000 + 180_000 * 0.95),
);

lf = run(lf, "buyLifestyle", "sports_car");
check(
  "depreciating items cost net worth",
  lifestyleValue(med(lf)) < 430_000 + 265_000,
);

lf = run(lf, "buyLifestyle", "chauffeur");
check("chauffeur grants a time block", doctor.timeBudget(lf) === 7);

const soldCash = run(lf, "sellLifestyle", "sports_car");
check(
  "sellLifestyle returns the retained value",
  Math.round(soldCash.r.cash) === Math.round(lf.r.cash + 265_000 * 0.4),
);

// --- cities ----------------------------------------------------------------
let ct = startRun(doctor, 21);
ct.r.cash = 2_000_000;

check("starts licensed only at home", med(ct).cities.length === 1);
check("home city holds the starting panel", (med(ct).panels.lyon ?? 0) > 0);

const unlicensed = run(ct, "buyFacility", "clinic:london");
check(
  "cannot buy premises in an unlicensed city",
  med(unlicensed).facilities.length === med(ct).facilities.length,
);

const cashBeforeEntry = ct.r.cash;
const londonEntry = cityOf("london").entryCost;
ct = run(ct, "enterCity", "london");
check("enterCity licenses the market", med(ct).cities.includes("london"));
check(
  "enterCity charges the registration",
  ct.r.cash === cashBeforeEntry - londonEntry,
  `expected ${londonEntry}`,
);

const twice = run(ct, "enterCity", "london");
check(
  "enterCity refuses duplicates",
  med(twice).cities.length === med(ct).cities.length,
);

// Property prices scale with the local market.
const lyonPrice = facilityPrice("clinic", "lyon");
const londonPrice = facilityPrice("clinic", "london");
check(
  "premises cost more in expensive markets",
  londonPrice > lyonPrice * 1.5,
  `${lyonPrice} vs ${londonPrice}`,
);

const cashBeforeBuild = ct.r.cash;
ct = run(ct, "buyFacility", "clinic:london");
check(
  "buyFacility places it in the named city",
  med(ct).facilities.some((f) => f.city === "london"),
);
check(
  "buyFacility charges the local price",
  ct.r.cash === cashBeforeBuild - londonPrice,
);
check("slotsIn counts per city", slotsIn(med(ct), "london") === 110);
check(
  "a new market opens with patients already waiting",
  (med(ct).panels.london ?? 0) > 0,
  `got ${Math.round(med(ct).panels.london ?? 0)}`,
);
check(
  "the seed reflects reputation rather than filling the market",
  (med(ct).panels.london ?? 0) <
    catchmentIn(med(ct), "london", ct.r.reputation) * 0.6,
);

// Population caps what any market can ever give you.
check(
  "catchment is capped by population",
  catchmentIn(med(ct), "london", 100) <= populationCeiling("london"),
);
check(
  "a bigger city supports a bigger ceiling",
  populationCeiling("tokyo") > populationCeiling("amsterdam"),
);

// Relocating moves where your own hours land.
check("you start based at home", med(ct).homeCity === "lyon");
ct = run(ct, "relocate", "london");
check("relocate moves you", med(ct).homeCity === "london");
const nowhere = run(ct, "relocate", "tokyo");
check(
  "relocate refuses an unlicensed city",
  med(nowhere).homeCity === "london",
);

// Your personal hours only count where you are.
const atHome = capacityIn(med(ct), "london", 4, 60, 20);
const away = capacityIn(med(ct), "lyon", 4, 60, 20);
check(
  "personal hours count only in your home city",
  atHome.personalUnits > 0 && away.personalUnits === 0,
);

// --- outbreaks -------------------------------------------------------------
const ob = startRun(doctor, 41);
ob.r.cash = 2_000_000;
ob.r.cpd = 500;
const flu = OUTBREAK_BY_ID.get("influenza")!;
med(ob).outbreaks.push({
  id: "influenza",
  city: "lyon",
  weeksLeft: flu.duration,
  startedWeek: 1,
  contained: false,
});
const key = "influenza:lyon";

check(
  "an outbreak surges its own specialties",
  outbreakSurge(med(ob), "lyon", "general") === flu.surge,
);
check(
  "it leaves other specialties alone",
  outbreakSurge(med(ob), "lyon", "oncology") === 1,
);
check(
  "and other cities alone",
  outbreakSurge(med(ob), "paris", "general") === 1,
);

const contained = run(ob, "contain", key);
check("contain marks it", med(contained).outbreaks[0].contained);
check(
  "contain blunts the surge without ending it",
  outbreakSurge(med(contained), "lyon", "general") < flu.surge &&
    med(contained).outbreaks.length === 1,
);

// Vaccination needs a pharmacy, not just money.
const noPharmacy = run(ob, "vaccinate", key);
check(
  "vaccination refused without a pharmacy",
  med(noPharmacy).outbreaks.length === 1,
);
let withPharmacy = run(ob, "buyEquipment", "pharmacy");
withPharmacy = run(withPharmacy, "vaccinate", key);
check(
  "vaccination ends it once you can dispense",
  med(withPharmacy).outbreaks.length === 0,
);
check(
  "vaccination is a reputation event",
  withPharmacy.r.reputation > ob.r.reputation,
);

// Research costs your own CPD and solves the pathogen permanently.
const brokeOnCpd = run({ ...ob, r: { ...ob.r, cpd: 0 } }, "research", key);
check(
  "research refused without the CPD",
  med(brokeOnCpd).outbreaks.length === 1,
);
const researched = run(ob, "research", key);
check("research ends the outbreak", med(researched).outbreaks.length === 0);
check(
  "research records the pathogen",
  med(researched).solved.includes("influenza"),
);
check("research costs CPD", researched.r.cpd === ob.r.cpd - flu.researchCpd);

// Publishing clears it everywhere, not just where you did the work.
const twoCities = startRun(doctor, 43);
twoCities.r.cash = 2_000_000;
twoCities.r.cpd = 500;
for (const c of ["lyon", "paris"] as const) {
  med(twoCities).outbreaks.push({
    id: "influenza",
    city: c,
    weeksLeft: 5,
    startedWeek: 1,
    contained: false,
  });
}
const published = run(twoCities, "research", "influenza:lyon");
check(
  "publishing ends the pathogen in every city",
  med(published).outbreaks.length === 0,
);

// --- weekly history --------------------------------------------------------
const hx = startRun(doctor, 51);
check("a fresh run has no history", hx.history.length === 0);

const wk1 = advanceWeek(doctor, hx, { clinic: 3, rest: 3 });
check("committing a week records it", wk1.state.history.length === 1);
check("the record is the week just played", wk1.state.history[0].week === 1);
check(
  "the recorded net matches the ledger total",
  Math.round(wk1.state.history[0].net) ===
    Math.round(wk1.ledger.reduce((sum, l) => sum + (l.amount ?? 0), 0)),
);

const wk2 = advanceWeek(doctor, wk1.state, { clinic: 3, rest: 3 });
check("history accumulates in order", wk2.state.history.length === 2);
check(
  "history is oldest-first",
  wk2.state.history[0].week < wk2.state.history[1].week,
);
check(
  "advancing does not mutate the previous state's history",
  wk1.state.history.length === 1,
);

// The outlay line is added after resolveWeek returns, so a week with cash
// actions is the case that catches recording the net too early.
const paid = advanceWeek(doctor, hx, { clinic: 2, study: 2, outreach: 2 });
const paidNet = paid.ledger.reduce((sum, l) => sum + (l.amount ?? 0), 0);
check(
  "the net includes the week's cash outlay",
  Math.round(paid.state.history[0].net) === Math.round(paidNet) &&
    paid.ledger.some((l) => l.label === "Week's outlay"),
);

// --- phone: initialisation -------------------------------------------------
let ph = startRun(doctor, 61);
check("phone state initialises", !!med(ph).phone);
check(
  "social starts at gameplay-neutral values",
  med(ph).phone.social.trust === 50 &&
    med(ph).phone.social.sentiment === 50 &&
    med(ph).phone.social.scrutiny === 0 &&
    med(ph).phone.social.followers === 0,
);
check(
  "the neutral values produce zero gameplay effect",
  trustRecruitBonus(med(ph)) === 0 &&
    sentimentCatchment(med(ph)) === 1 &&
    scrutinyRisk(med(ph)) === 0,
);
check("nothing has been posted", med(ph).phone.lastPostWeek === 0);
check("feeds start empty", med(ph).phone.feed.length === 0);

// --- phone: publishing -----------------------------------------------------
const beforeTrust = med(ph).phone.social.trust;
ph = run(ph, "post", "edu.prevention");
check("publishing adds the post to the feed", med(ph).phone.feed.length === 1);
check(
  "the published post is yours",
  med(ph).phone.feed[0].kind === "player" &&
    med(ph).phone.feed[0].week === ph.week,
);
check(
  "publishing moves the social metrics",
  med(ph).phone.social.trust > beforeTrust &&
    med(ph).phone.social.followers > 0,
);
check("publishing records the week", med(ph).phone.lastPostWeek === ph.week);

// One post per week, enforced in the command rather than the button.
const secondPost = run(ph, "post", "edu.myth");
check(
  "a second post in the same week is refused",
  med(secondPost).phone.feed.length === 1,
);

// Context gating: a department post needs a department to announce.
let ctxRun = startRun(doctor, 62);
const noDept = run(ctxRun, "post", "dept.launch");
check(
  "a post is refused when its context is missing",
  med(noDept).phone.feed.length === 0,
);
ctxRun.r.cash = 500_000;
ctxRun = run(ctxRun, "buyFacility", "room:lyon");
ctxRun = run(ctxRun, "openDepartment", "paediatrics");
const withDept = run(ctxRun, "post", "dept.launch");
check(
  "the same post succeeds once the context exists",
  med(withDept).phone.feed.length === 1,
);
check(
  "a department launch brings patients next week",
  (withDept.r._panelPending ?? 0) > 0,
);

// A hiring announcement banks a bonus and spends it on the next hire only.
let hireRun = startRun(doctor, 63);
hireRun.r.cash = 500_000;
hireRun = run(hireRun, "post", "hiring.open");
check(
  "a hiring post banks a recruit bonus",
  med(hireRun).phone.recruitBoost > 0,
);
const hired = run(hireRun, "hire", "gp");
check(
  "the bonus is spent on the next hire",
  med(hired).phone.recruitBoost === 0,
);
const hiredAgain = run(hired, "hire", "nurse");
check(
  "the bonus does not apply twice",
  med(hiredAgain).phone.recruitBoost === 0,
);

// --- phone: confidentiality hazard ----------------------------------------
// The sensational case study either lands or backfires, deterministically
// per seed — never both, and always exactly one feed entry.
let hazardHit = 0;
for (let seed = 0; seed < 24; seed++) {
  let h = startRun(doctor, 700 + seed);
  h.week = 6;
  h = run(h, "post", "case.sensational");
  const post = med(h).phone.feed[0];
  if (post.tone === "bad") {
    hazardHit++;
    if (!med(h).phone.messages.some((x) => x.role === "regulator")) {
      check("a backfire always raises a complaint", false);
    }
  }
}
check(
  "the confidentiality hazard sometimes lands and sometimes does not",
  hazardHit > 0 && hazardHit < 24,
  `${hazardHit}/24 backfired`,
);

// Determinism: identical seed and week must give an identical result.
const runA = run(
  Object.assign(startRun(doctor, 777), { week: 6 }),
  "post",
  "case.sensational",
);
const runB = run(
  Object.assign(startRun(doctor, 777), { week: 6 }),
  "post",
  "case.sensational",
);
check(
  "publishing is deterministic for a given seed and week",
  med(runA).phone.feed[0].tone === med(runB).phone.feed[0].tone &&
    med(runA).phone.feed[0].likes === med(runB).phone.feed[0].likes,
);

// --- phone: bounds ---------------------------------------------------------
let bounded = startRun(doctor, 64);
for (let i = 0; i < MAX_FEED + 25; i++) {
  med(bounded).phone.feed.unshift({
    id: `filler.${i}`,
    week: 1,
    author: "Filler",
    handle: "@filler",
    kind: "world",
    body: "x",
    likes: 1,
    comments: [],
    tone: "neutral",
  });
}
bounded = run(bounded, "post", "edu.prevention");
check(
  "the feed is capped when posting",
  med(bounded).phone.feed.length === MAX_FEED,
  `${med(bounded).phone.feed.length}`,
);

// Weekly generation must also respect the caps over a long run.
let longRun = startRun(doctor, 65);
longRun.r.cash = 400_000;
for (let i = 0; i < 60; i++) {
  longRun = advanceWeek(doctor, longRun, { clinic: 3, rest: 3 }).state;
  if (longRun.outcome) break;
}
const lp = med(longRun).phone;
check("feed stays bounded across a long run", lp.feed.length <= MAX_FEED);
check("messages stay bounded", lp.messages.length <= MAX_MESSAGES);
check("news stays bounded", lp.news.length <= MAX_NEWS);

// --- phone: messages -------------------------------------------------------
const msgRun = startRun(doctor, 66);
med(msgRun).phone.messages.push({
  id: "test.msg",
  week: 1,
  from: "Priya Raman",
  handle: "@p.raman",
  role: "journalist",
  body: "Comment?",
  read: false,
  choices: [
    {
      label: "Comment",
      detail: "",
      effect: { scrutiny: -10, trust: 2 },
      reply: "Answered.",
    },
  ],
});
check("an unread message is counted", unreadMessages(med(msgRun)) === 1);
const answered = run(msgRun, "answerMessage", "test.msg|0");
check(
  "answering records the choice",
  med(answered).phone.messages[0].answered === 0,
);
check("answering applies its effect", med(answered).phone.social.trust > 50);
check("answering marks it read", unreadMessages(med(answered)) === 0);
const twiceAnswered = run(answered, "answerMessage", "test.msg|0");
check(
  "a message cannot be answered twice",
  med(twiceAnswered).phone.social.trust === med(answered).phone.social.trust,
);

// --- phone: immutability ---------------------------------------------------
const prePost = startRun(doctor, 67);
const posted = run(prePost, "post", "edu.prevention");
check(
  "posting does not mutate the previous state",
  med(prePost).phone.feed.length === 0 && med(posted).phone.feed.length === 1,
);
check(
  "posting does not mutate the previous social metrics",
  med(prePost).phone.social.followers === 0,
);

// --- consumables -----------------------------------------------------------
let sup = startRun(doctor, 71);
check("supplies initialise with stock", med(sup).supplies.stock > 0);
check("auto-order is on by default", med(sup).supplies.autoOrder === true);
check("nothing is throttled at the start", supplyThrottle(med(sup)) === 1);

// Bulk orders cost cash and give more stock than they cost.
sup.r.cash = 500_000;
const stockBefore = med(sup).supplies.stock;
const cashBefore2 = sup.r.cash;
const orderCost = tierCost(med(sup), "weeks12");
sup = run(sup, "buySupplies", "weeks12");
check("an order charges cash", sup.r.cash === cashBefore2 - orderCost);
check("an order adds stock", med(sup).supplies.stock > stockBefore);
check(
  "bulk yields more stock than it costs — that is the discount",
  med(sup).supplies.stock - stockBefore > orderCost,
);
check(
  "a larger tier is cheaper per unit of stock",
  tierStock(med(sup), "weeks26") / tierCost(med(sup), "weeks26") >
    tierStock(med(sup), "weeks4") / tierCost(med(sup), "weeks4"),
);

const brokeOnSupplies = run(
  { ...sup, r: { ...sup.r, cash: 10 } },
  "buySupplies",
  "weeks26",
);
check(
  "an unaffordable order is refused",
  med(brokeOnSupplies).supplies.stock === med(sup).supplies.stock,
);

const toggled = run(sup, "toggleAutoOrder", "");
check("auto-order toggles", med(toggled).supplies.autoOrder === false);

// Consumption is charged on what was treated, not what was billed.
const cases = [
  { severity: 1, treated: 10 },
  { severity: 4, treated: 2 },
];
check(
  "consumption is priced per case by severity",
  consumptionFor(cases) === 10 * SUPPLY_COST[1] + 2 * SUPPLY_COST[4],
);

// Auto-order covers a gap at spot price rather than blocking.
const gap = startRun(doctor, 72);
med(gap).supplies.stock = 0;
med(gap).supplies.autoOrder = true;
const covered = drawSupplies(med(gap), 500);
check("auto-order covers a shortfall", covered.emergencySpend === 500);
check("auto-order never stocks out", covered.stockedOut === false);

// With it off, running dry throttles the practice.
const dry = startRun(doctor, 73);
med(dry).supplies.stock = 0;
med(dry).supplies.autoOrder = false;
const ranOut = drawSupplies(med(dry), 500);
check("without auto-order a shortfall stocks you out", ranOut.stockedOut);
check("no emergency spend when auto-order is off", ranOut.emergencySpend === 0);
check("a stock-out throttles capacity", supplyThrottle(med(dry)) < 1);

// --- communications manager ------------------------------------------------
let comms = startRun(doctor, 74);
check("no comms staff to begin with", commsStaff(med(comms)) === 0);
check(
  "comms effects are no-ops at zero staff",
  commsReachBonus(med(comms)) === 1 &&
    commsHazardFactor(med(comms)) === 1 &&
    commsScrutinyRelief(med(comms)) === 0,
);

comms.r.cash = 200_000;
comms = run(comms, "hire", "comms");
check("a comms manager can be hired", commsStaff(med(comms)) === 1);
check(
  "a comms manager amplifies reach and reduces hazard",
  commsReachBonus(med(comms)) > 1 && commsHazardFactor(med(comms)) < 1,
);
check(
  "a comms manager is not a treating clinician",
  computeCapacity(med(comms), 0, 50, 20).staffUnits === 0,
  `got ${computeCapacity(med(comms), 0, 50, 20).staffUnits}`,
);

// The hazard reduction must actually change outcomes across seeds.
let plainBackfires = 0;
let commsBackfires = 0;
for (let seed = 0; seed < 30; seed++) {
  let plain = startRun(doctor, 900 + seed);
  plain.week = 6;
  plain = run(plain, "post", "case.sensational");
  if (med(plain).phone.feed[0].tone === "bad") plainBackfires++;

  let withComms = startRun(doctor, 900 + seed);
  withComms.week = 6;
  withComms.r.cash = 200_000;
  withComms = run(withComms, "hire", "comms");
  withComms = run(withComms, "post", "case.sensational");
  if (med(withComms).phone.feed[0].tone === "bad") commsBackfires++;
}
check(
  "a comms manager measurably reduces backfires",
  commsBackfires < plainBackfires,
  `${commsBackfires} vs ${plainBackfires} of 30`,
);

// --- regression: event panel rewards must survive weekly resolution --------
/*
 * `s.r.panel` is derived from `m.panels` at the end of every week, so an
 * event that writes to it directly is erased by the very next resolution.
 * Both of these events used to do exactly that. They now queue through
 * `_panelPending`, which is delivered to the home city during panel drift.
 */
function eventChoice(id: string, label: RegExp) {
  const def = doctor.events.find((e) => e.id === id);
  if (!def) throw new Error(`missing event ${id}`);
  const index = def.choices.findIndex((c) => label.test(c.label));
  if (index < 0) throw new Error(`missing choice for ${id}`);
  return { def, index };
}

/** Panel held in one city, read straight from the canonical store. */
const panelIn = (s: RunState, city: string) => med(s).panels[city] ?? 0;

{
  const surge = eventChoice("flu_surge", /Absorb/);
  let before = startRun(doctor, 81);
  before.r.cash = 200_000;
  // Settle the panel first so drift is small and the reward is visible.
  before = advanceWeek(doctor, before, { clinic: 3, rest: 3 }).state;

  const baseline = advanceWeek(doctor, before, { clinic: 3, rest: 3 }).state;

  const withSurge = resolveEventChoice(doctor, before, surge.def, surge.index);
  check(
    "seasonal surge queues its registrations rather than writing the panel",
    (withSurge.r._panelPending ?? 0) === 18,
  );
  const afterWeek = advanceWeek(doctor, withSurge, {
    clinic: 3,
    rest: 3,
  }).state;
  check(
    "seasonal surge patients survive the next weekly resolution",
    afterWeek.r.panel > baseline.r.panel + 15,
    `${Math.round(afterWeek.r.panel)} vs baseline ${Math.round(baseline.r.panel)}`,
  );
  check(
    "the surge lands in the home city",
    panelIn(afterWeek, "lyon") > panelIn(baseline, "lyon") + 15,
  );
  check(
    "the pending queue is emptied once delivered",
    (afterWeek.r._panelPending ?? 0) === 0,
  );
}

{
  const deal = eventChoice("insurer_contract", /Sign/);
  let before = startRun(doctor, 82);
  before.r.cash = 400_000;
  before = advanceWeek(doctor, before, { clinic: 3, rest: 3 }).state;

  const expected = Math.round(60 + before.r.panel * 0.18);
  const baseline = advanceWeek(doctor, before, { clinic: 3, rest: 3 }).state;

  const signed = resolveEventChoice(doctor, before, deal.def, deal.index);
  check(
    "insurer contract queues its calculated gain",
    (signed.r._panelPending ?? 0) === expected,
    `queued ${signed.r._panelPending}, expected ${expected}`,
  );
  const afterWeek = advanceWeek(doctor, signed, { clinic: 3, rest: 3 }).state;
  check(
    "insurer contract members survive the next weekly resolution",
    afterWeek.r.panel > baseline.r.panel + expected * 0.8,
    `${Math.round(afterWeek.r.panel)} vs baseline ${Math.round(baseline.r.panel)}, expected +${expected}`,
  );
}

// Multi-city: the reward is delivered to the home city only, and stays there.
{
  const surge = eventChoice("flu_surge", /Absorb/);
  let multi = startRun(doctor, 83);
  multi.r.cash = 900_000;
  multi = run(multi, "enterCity", "madrid");
  multi = run(multi, "buyFacility", "clinic:madrid");
  multi = advanceWeek(doctor, multi, { clinic: 3, rest: 3 }).state;

  const baseline = advanceWeek(doctor, multi, { clinic: 3, rest: 3 }).state;
  const surged = resolveEventChoice(doctor, multi, surge.def, surge.index);
  const after = advanceWeek(doctor, surged, { clinic: 3, rest: 3 }).state;

  check(
    "with two cities the reward still lands, and in the home city",
    panelIn(after, "lyon") > panelIn(baseline, "lyon") + 15,
  );
  // Not exactly equal: the surge also grants +3 reputation, which lifts every
  // city's catchment slightly. What must not happen is the 18 registrations
  // being delivered a second time, so the tolerance is well under 18.
  check(
    "the reward is not duplicated into the other city",
    Math.abs(panelIn(after, "madrid") - panelIn(baseline, "madrid")) < 3,
    `madrid ${panelIn(after, "madrid").toFixed(2)} vs ${panelIn(baseline, "madrid").toFixed(2)}`,
  );

  // Deterministic: the same inputs give the same panels.
  const repeat = advanceWeek(
    doctor,
    resolveEventChoice(doctor, multi, surge.def, surge.index),
    { clinic: 3, rest: 3 },
  ).state;
  check(
    "event panel delivery is deterministic",
    panelIn(repeat, "lyon") === panelIn(after, "lyon") &&
      panelIn(repeat, "madrid") === panelIn(after, "madrid"),
  );
}

// --- regression: restocking clears the shortage penalty --------------------
{
  const out = startRun(doctor, 84);
  out.r.cash = 300_000;
  med(out).supplies.autoOrder = false;
  med(out).supplies.stock = 0;
  // Force a real stock-out through the normal draw path.
  drawSupplies(med(out), 500);
  check("the practice is genuinely stocked out", supplyThrottle(med(out)) < 1);

  const restocked = run(out, "buySupplies", "weeks12");
  check(
    "a successful restock clears the shortage penalty",
    supplyThrottle(med(restocked)) === 1 &&
      med(restocked).supplies.throttleWeeks === 0,
  );
  check("a successful restock adds stock", med(restocked).supplies.stock > 0);

  // An order that cannot be paid for must leave the penalty in place.
  const broke = run(
    { ...out, r: { ...out.r, cash: 5 } },
    "buySupplies",
    "weeks26",
  );
  check(
    "an unaffordable order does not clear the penalty",
    supplyThrottle(med(broke)) < 1 && med(broke).supplies.stock === 0,
  );
  const bogus = run(out, "buySupplies", "not-a-tier");
  check(
    "an invalid order does not clear the penalty",
    supplyThrottle(med(bogus)) < 1,
  );

  // Auto-order behaviour is untouched: it still covers gaps at spot price
  // and still never stocks out.
  const auto = startRun(doctor, 85);
  med(auto).supplies.stock = 0;
  med(auto).supplies.autoOrder = true;
  const drew = drawSupplies(med(auto), 400);
  check(
    "auto-order still covers a gap without throttling",
    drew.emergencySpend === 400 &&
      drew.stockedOut === false &&
      supplyThrottle(med(auto)) === 1,
  );
}

// --- regression: guidance counts clinic blocks only ------------------------
{
  /*
   * The panel is chosen to sit *between* the two capacities so the hint
   * genuinely discriminates: two GPs alone (52 units) cannot serve it, but
   * two GPs plus six clinic blocks (~133 units) comfortably can. A panel
   * beyond both would fire the hint either way and prove nothing.
   *
   * Week 4 keeps the later department hint out of the way.
   */
  let g = startRun(doctor, 86);
  g.r.cash = 600_000;
  g.week = 4;
  g = run(g, "buyFacility", "clinic:lyon");
  g = run(g, "hire", "gp");
  g = run(g, "hire", "gp");
  med(g).panels.lyon = 357;
  g.r.panel = 357;

  const allRest = nextStep(g, { rest: 6 }, 6, 6, true);
  check(
    "a week of pure rest does not count as clinic capacity",
    allRest?.id === "capacity",
    `got ${allRest?.id ?? "none"}`,
  );

  // The same state with everything in clinic clears the bar, proving the two
  // allocations are actually told apart rather than both being over-served.
  const allClinic = nextStep(g, { clinic: 6 }, 6, 6, true);
  check(
    "the same week spent in clinic is not flagged as short of capacity",
    allClinic?.id !== "capacity",
    `got ${allClinic?.id ?? "none"}`,
  );

  // A mixture must be judged on its clinic portion alone.
  const mixed = nextStep(
    g,
    { clinic: 1, study: 2, rest: 2, manage: 1 },
    6,
    6,
    true,
  );
  const oneBlock = nextStep(g, { clinic: 1 }, 1, 1, true);
  check(
    "a mixed week is judged on its clinic blocks alone",
    mixed?.id === oneBlock?.id,
    `mixed ${mixed?.id}, clinic-only ${oneBlock?.id}`,
  );

  // Study and outreach must not inflate capacity either.
  const studyHeavy = nextStep(g, { study: 5, outreach: 1 }, 6, 6, true);
  check(
    "study and outreach do not inflate the capacity estimate",
    studyHeavy?.id === "capacity",
    `got ${studyHeavy?.id ?? "none"}`,
  );
}

{
  // Multi-city: personal hours are credited to the home city only, so the
  // network total must not scale with the number of cities.
  let one = startRun(doctor, 87);
  one.r.cash = 900_000;
  one = run(one, "buyFacility", "clinic:lyon");

  let two = run(one, "enterCity", "madrid");
  two = run(two, "buyFacility", "clinic:madrid");

  const personalOf = (s: RunState) =>
    activeCities(med(s)).reduce(
      (sum, c) =>
        sum + capacityIn(med(s), c, 4, s.r.skill, s.r.burnout).personalUnits,
      0,
    );
  check(
    "personal clinic hours are counted once regardless of city count",
    Math.abs(personalOf(one) - personalOf(two)) < 0.001,
    `${personalOf(one).toFixed(2)} vs ${personalOf(two).toFixed(2)}`,
  );
}

// --- visual asset registry -------------------------------------------------
{
  const inspection = eventVisual("inspection");
  check("the inspection event has artwork registered", inspection !== null);
  check(
    "every registered visual carries dimensions, so no layout shift",
    [
      ...Object.values(EVENT_VISUALS),
      ...Object.values(CITY_VISUALS),
      ...Object.values(CAREER_VISUALS),
      PRACTICE_VISUAL,
      OUTBREAK_VISUAL,
      MILESTONE_VISUAL,
    ].every((v) => v.width > 0 && v.height > 0),
  );
  check(
    "artwork that conveys information has descriptive alt text",
    !!inspection && inspection.alt.length > 20,
  );

  /*
   * No two events may share a picture. Reusing one image across events is the
   * failure that makes every dialog feel identical, and it is invisible in a
   * diff — hence an assertion rather than a convention.
   */
  const srcs = Object.values(EVENT_VISUALS).map((v) => v.src);
  check(
    "each event's artwork is its own",
    new Set(srcs).size === srcs.length,
    srcs.join(", "),
  );
  check(
    "the same is true of city artwork",
    new Set(Object.values(CITY_VISUALS).map((v) => v.src)).size === 14,
  );
  check(
    "an unknown event id resolves to nothing",
    eventVisual("nope") === null,
  );

  // Practice stage must come from owned premises, never from cash or week.
  let stage = startRun(doctor, 91);
  check(
    "a fresh run is at the first stage",
    practiceStageIndex(med(stage)) === 0,
  );
  stage.r.cash = 5_000_000;
  stage.week = 140;
  check(
    "money and elapsed weeks alone do not advance the stage",
    practiceStageIndex(med(stage)) === 0,
  );
  stage = run(stage, "buyFacility", "clinic:lyon");
  check(
    "buying a clinic advances the stage",
    practiceStageIndex(med(stage)) === 1,
  );
  stage = run(stage, "buyFacility", "hospital:lyon");
  check(
    "the stage reflects the best premises owned",
    practiceStageIndex(med(stage)) === 3,
  );
  stage = run(stage, "buyFacility", "room:lyon");
  check(
    "buying a lesser building does not regress the stage",
    practiceStageIndex(med(stage)) === 3,
  );
  check(
    "every stage band maps to a real facility type",
    PRACTICE_STAGES.every((s) => FACILITY_BY_ID.has(s.id)) &&
      PRACTICE_STAGES.length === 4,
  );
}

// --- network map nodes -----------------------------------------------------
{
  // Layout: every marker must be on the board and clear of its neighbours,
  // or the map becomes unclickable however good it looks at 1440.
  const outOfBounds = CITIES.filter(
    (c) => c.map.x < 0 || c.map.x > 100 || c.map.y < 0 || c.map.y > 100,
  );
  check(
    "every city sits inside the 0-100 map bounds",
    outOfBounds.length === 0,
    outOfBounds.map((c) => c.id).join(", "),
  );
  check(
    "no city is jammed against an edge where its marker would clip",
    CITIES.every(
      (c) => c.map.x >= 4 && c.map.x <= 96 && c.map.y >= 4 && c.map.y <= 96,
    ),
  );
  /*
   * Cities are the equirectangular projection of their real coordinates, so
   * "is it on land" is settled at build time against Natural Earth's own
   * geometry (`npm run build:map` reports it). What this suite can still
   * prove is that the catalogue has not drifted away from that projection —
   * that every stored position is where the city's real longitude and
   * latitude actually land.
   */
  /*
   * The map is cropped to latitudes +84..-57 — Antarctica is dropped and the
   * Arctic trimmed — so the vertical scale is the crop, not the projection.
   * These constants must match `scripts/build-map.ts`; if either moves
   * without the other, this fails.
   */
  const LAT_TOP = 73;
  const LAT_BOTTOM = -57;
  const misprojected = CITIES.filter((c) => {
    const lonlat = CITY_LATLON[c.id];
    if (!lonlat) return true;
    const x = 50 + lonlat[0] / 3.6;
    const y = ((LAT_TOP - lonlat[1]) / (LAT_TOP - LAT_BOTTOM)) * 100;
    return Math.abs(c.map.x - x) > 0.2 || Math.abs(c.map.y - y) > 0.2;
  });
  check(
    "every city sits at the projection of its real coordinates",
    misprojected.length === 0,
    misprojected.map((c) => c.id).join(", "),
  );
  check(
    "the world is drawn from real geography, not hand-drawn shapes",
    LAND_PATH.length > 50_000 &&
      BORDER_PATH.length > 5_000 &&
      GRATICULE_PATH.length > 1_000,
  );
  check(
    "the generated geometry stays inside the map's own viewBox",
    (() => {
      const nums = LAND_PATH.match(/-?\d+(?:\.\d+)?/g) ?? [];
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const x = Number(nums[i]);
        const y = Number(nums[i + 1]);
        if (x < -1 || x > 101 || y < -1 || y > 57) return false;
      }
      return true;
    })(),
  );
  check(
    "the world is drawn from every required region",
    [
      "north-america",
      "south-america",
      "europe",
      "africa",
      "middle-east",
      "south-asia",
      "southeast-asia",
      "east-asia",
    ].every((id) => REGION_PROBES[id] !== undefined),
  );
  check(
    "every region probe lands on real drawn geography",
    Object.entries(REGION_PROBES).every(([, [lon, lat]]) => {
      // Inside the projected bounds is the cheap proxy: the generated land
      // path is one merged shape, so a full containment test here would mean
      // re-parsing 117KB on every run.
      return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
    }),
  );

  check(
    "every city carries a label offset and anchor",
    CITIES.every(
      (c) =>
        Number.isFinite(c.label.dx) &&
        Number.isFinite(c.label.dy) &&
        ["start", "middle", "end"].includes(c.label.anchor),
    ),
  );

  /*
   * MARKER SEPARATION
   *
   * Measured in rendered pixels, not map units, because the two axes scale
   * differently: the board is 100x56, so a unit of Y is only 0.56 of a unit
   * of X.
   *
   * The invariant changed when the map moved to real geography, and it is
   * worth being explicit about why rather than quietly lowering a number.
   * Seven markets are in western Europe; at true coordinates London and Paris
   * are twelve pixels apart on a 1180px board, and no arrangement separates
   * them without putting cities in the Atlantic. So the guarantee is no
   * longer "every pair is tappable at 1x" — it is "every pair is tappable at
   * full zoom, and every city is reachable without the map at any zoom".
   */
  const BOARD_PX = 1180;
  const ZOOM_MAX = 6;
  const pxPerX = BOARD_PX / 100;
  const pxPerY = (BOARD_PX * 0.56) / 100;
  let closest = Infinity;
  let pair = "";
  for (let i = 0; i < CITIES.length; i++) {
    for (let j = i + 1; j < CITIES.length; j++) {
      const a = CITIES[i].map;
      const b = CITIES[j].map;
      const d = Math.hypot((a.x - b.x) * pxPerX, (a.y - b.y) * pxPerY);
      if (d < closest) {
        closest = d;
        pair = `${CITIES[i].id}/${CITIES[j].id}`;
      }
    }
  }
  check(
    "every pair of markers clears the 40px touch target at full zoom",
    closest * ZOOM_MAX >= 40,
    `closest ${pair} at ${(closest * ZOOM_MAX).toFixed(1)}px zoomed (${closest.toFixed(1)}px at 1x)`,
  );
  check(
    "the zoom ceiling is high enough to separate the densest region",
    ZOOM_MAX >= 40 / closest,
    `needs ${(40 / closest).toFixed(1)}x, ceiling is ${ZOOM_MAX}x`,
  );

  // Classification: a marker must never imply premises you have not bought.
  let map = startRun(doctor, 55);
  const fresh = networkNodes(med(map));
  check("the map covers all fourteen markets", fresh.length === 14);
  check(
    "the map covers every market in the catalogue",
    fresh.length === CITIES.length,
  );
  check("exactly one node is home", fresh.filter((n) => n.isHome).length === 1);
  check(
    "the home node is the state's home city",
    fresh.find((n) => n.isHome)?.id === med(map).homeCity,
  );
  check(
    "the starting city is operating and the rest are locked",
    fresh.find((n) => n.id === "lyon")?.state === "operating" &&
      fresh.filter((n) => n.id !== "lyon").every((n) => n.state === "locked"),
  );

  map.r.cash = 900_000;
  map = run(map, "enterCity", "madrid");
  check(
    "a licence alone shows as licensed, not operating",
    networkNodes(med(map)).find((n) => n.id === "madrid")?.state === "licensed",
  );

  map = run(map, "buyFacility", "clinic:madrid");
  const built = networkNodes(med(map)).find((n) => n.id === "madrid");
  check(
    "premises promote the marker to operating",
    built?.state === "operating" && built.sites === 1,
  );

  // Outbreaks: the marker must point at the city it actually broke out in.
  const outbreakId = [...OUTBREAK_BY_ID.keys()][0];
  med(map).outbreaks.push({
    id: outbreakId,
    city: "madrid",
    weeksLeft: 3,
    startedWeek: map.week,
    contained: false,
  });
  const withOutbreak = networkNodes(med(map));
  check(
    "an outbreak attaches to its own city and no other",
    withOutbreak.find((n) => n.id === "madrid")?.outbreak?.id === outbreakId &&
      withOutbreak.filter((n) => n.outbreak !== null).length === 1,
  );
  check(
    "an outbreak does not change the marker's licensed or operating state",
    withOutbreak.find((n) => n.id === "madrid")?.state === "operating",
  );
}

// --- network map routes ----------------------------------------------------
{
  let map = startRun(doctor, 71);
  map.r.cash = 900_000;
  check(
    "a single-city network draws no routes",
    networkRoutes(med(map)).length === 0,
  );

  // A licence on its own is not a connection to anywhere.
  map = run(map, "enterCity", "berlin");
  check(
    "a licensed but empty city gets no route",
    networkRoutes(med(map)).length === 0,
  );

  map = run(map, "buyFacility", "clinic:berlin");
  let routes = networkRoutes(med(map));
  check(
    "opening a site draws a route from home to it",
    routes.length === 1 &&
      routes[0].from === "lyon" &&
      routes[0].to === "berlin",
  );

  map = run(map, "enterCity", "tokyo");
  map = run(map, "buyFacility", "clinic:tokyo");
  routes = networkRoutes(med(map));
  check(
    "routes reach every operating city and nowhere else",
    routes.length === 2 &&
      routes.every((r) => r.from === "lyon") &&
      ["berlin", "tokyo"].every((id) => routes.some((r) => r.to === id)),
  );

  // Relocating moves the origin, and the new home stops being a destination.
  map = run(map, "relocate", "tokyo");
  routes = networkRoutes(med(map));
  check(
    "relocating re-origins every route on the new home city",
    routes.every((r) => r.from === "tokyo"),
    routes.map((r) => `${r.from}->${r.to}`).join(", "),
  );
  check(
    "the home city is never a destination of its own route",
    routes.every((r) => r.to !== "tokyo") && routes.length === 2,
  );
  check(
    "route endpoints carry the cities' map coordinates",
    routes.every(
      (r) => r.a.x === cityOf(r.from).map.x && r.b.y === cityOf(r.to).map.y,
    ),
  );
}

// --- visual asset registry resolves ----------------------------------------
{
  /*
   * Every path the interface can ask for must exist on disk. This is the
   * check that catches a renamed asset or a typo'd id before a player sees a
   * broken image, and it is why nothing else in the app builds an image path
   * by hand.
   */
  const all: [string, string][] = [
    ...Object.entries(CAREER_VISUALS).map(
      ([id, v]) => [`career:${id}`, v.src] as [string, string],
    ),
    ...Object.entries(CITY_VISUALS).map(
      ([id, v]) => [`city:${id}`, v.src] as [string, string],
    ),
    ...Object.entries(EVENT_VISUALS).map(
      ([id, v]) => [`event:${id}`, v.src] as [string, string],
    ),
    ["practice", PRACTICE_VISUAL.src],
    ["network", NETWORK_VISUAL.src],
    ["outbreak", OUTBREAK_VISUAL.src],
    ["milestone", MILESTONE_VISUAL.src],
  ];

  const missing = all.filter(
    ([, src]) => !existsSync(join("public", src.replace(/^\//, ""))),
  );
  check(
    "every registered visual resolves to a file on disk",
    missing.length === 0,
    missing.map(([k, src]) => `${k} -> ${src}`).join(", "),
  );

  check(
    "nothing served to the browser is a source PNG",
    all.every(([, src]) => !src.endsWith(".png")),
    all
      .filter(([, src]) => src.endsWith(".png"))
      .map(([k]) => k)
      .join(", "),
  );

  /*
   * The masters are 51MB and belong in `art-source/`, not in the deployed
   * bundle. This is the assertion that stops one creeping back in.
   */
  const strays = walkFiles("public").filter((f) =>
    f.toLowerCase().endsWith(".png"),
  );
  check(
    "no PNG master has crept back into public/",
    strays.length === 0,
    strays.join(", "),
  );
  /*
   * Every runtime image must have its master preserved at the same relative
   * path under art-source. Stated as a pairing rather than a count, so adding
   * artwork does not require editing a number here — and so a WebP shipped
   * without its master is caught.
   */
  /** Escapes a filename for use inside a RegExp. */
  const escapeRe = (x: string) =>
    x.replace(/[.*+?^${}()|[\]\\]/g, (ch) => `\\${ch}`);

  const runtime = walkFiles(join("public", "visuals"))
    .filter((f) => f.endsWith(".webp"))
    .map((f) => f.slice(join("public", "visuals").length + 1));
  /*
   * Matching allows for two naming conventions the purchase pipeline uses:
   *
   *   `@…`   a second size cut from the same master, not a second master —
   *          `@2x` for wide artwork, `@profile` for portraits
   *   `-vN`  a revision — the shipped file drops the suffix, so
   *          `lifestyle-sports-car.webp` is master `…-v2.png`
   *
   * The guarantee is unchanged: nothing ships without a master in
   * `art-source`. Only the filename arithmetic knows about the conventions.
   */
  const masterExists = (rel: string): boolean => {
    /*
     * The brand collection is many crops of one master.
     *
     * `logo-lockup`, `logo-mark-64` and the rest are all cut from a single
     * `earn-your-skyline-logo-v1.png`, so there is no filename to derive — the
     * guarantee is that the one master is present, which is checked directly.
     */
    if (rel.replace(/\\/g, "/").startsWith("brand/")) {
      return existsSync(
        join("art-source", "branding", "earn-your-skyline-logo-v1.png"),
      );
    }
    const stem = rel.replace(/\.webp$/, "").replace(/@[a-z0-9]+$/i, "");
    const dir = join("art-source", "visuals", dirname(stem));
    if (existsSync(join(dir, `${basename(stem)}.png`))) return true;
    if (!existsSync(dir)) return false;
    /* Any revision of the same stem counts as the master. */
    /* Double-escaped: this is a template literal, so `\d` would collapse to
       a literal "d" before the RegExp ever sees it. */
    return readdirSync(dir).some((f) =>
      new RegExp(`^${escapeRe(basename(stem))}(-v\\d+)?\\.png$`).test(f),
    );
  };
  const orphanRuntime = runtime.filter((rel) => !masterExists(rel));
  check(
    "every runtime image has its PNG master preserved outside public/",
    runtime.length > 0 && orphanRuntime.length === 0,
    orphanRuntime.join(", "),
  );

  // Cities: the ids are the game's, the filenames are not, so the mapping is
  // the one place the two can drift apart.
  const unmapped = CITIES.filter((c) => cityVisual(c.id) === null);
  check(
    "every city in the catalogue has artwork",
    unmapped.length === 0,
    unmapped.map((c) => c.id).join(", "),
  );
  check(
    "the city artwork map has no entries for cities that do not exist",
    Object.keys(CITY_VISUALS).every((id) => CITIES.some((c) => c.id === id)),
    Object.keys(CITY_VISUALS)
      .filter((id) => !CITIES.some((c) => c.id === id))
      .join(", "),
  );

  // Events: artwork must belong to a real event, and only to that event.
  const eventIds = doctor.events.map((e) => e.id);
  const orphan = Object.keys(EVENT_VISUALS).filter(
    (id) => !eventIds.includes(id),
  );
  check(
    "every event visual belongs to a real event",
    orphan.length === 0,
    orphan.join(", "),
  );
  check(
    "events without artwork resolve to nothing rather than a placeholder",
    eventIds
      .filter((id) => !(id in EVENT_VISUALS))
      .every((id) => eventVisual(id) === null),
  );
  check(
    "every event visual carries a category",
    Object.values(EVENT_VISUALS).every((v) => v.category.length > 0),
  );

  // Careers: every selectable career has a cover.
  const coverless = CAREER_PREVIEWS.filter((c) => careerVisual(c.id) === null);
  check(
    "every career on the select screen has cover art",
    coverless.length === 0,
    coverless.map((c) => c.id).join(", "),
  );
  check(
    "an unknown id asks for artwork and gets nothing, not a crash",
    cityVisual("atlantis") === null && careerVisual("astronaut") === null,
  );
}

// --- marker clustering -----------------------------------------------------
{
  const cl = networkNodes(med(startRun(doctor, 5)));
  const at = (zoom: number, selected: string | null = null) =>
    clusterNodes(cl, { zoom, boardPx: 1180, minSeparationPx: 42, selected });

  /* Nothing may ever be lost: every city is in exactly one cluster. */
  for (const zoom of [1, 2, 3, 6]) {
    const groups = at(zoom);
    const members = groups.flatMap((g) => g.members.map((m) => m.id));
    check(
      `every market is in exactly one cluster at ${zoom}x`,
      members.length === 14 && new Set(members).size === 14,
      `${members.length} members, ${new Set(members).size} unique`,
    );
  }

  check(
    "the crowded region groups at 1x",
    at(1).some((g) => g.members.length > 1),
  );
  check(
    "zooming in breaks the groups apart",
    at(6).every((g) => g.members.length === 1),
    at(6)
      .filter((g) => g.members.length > 1)
      .map((g) => g.id)
      .join(", "),
  );
  check(
    "clustering only ever loosens as you zoom in",
    (() => {
      let previous = at(1).length;
      for (const zoom of [1.5, 2, 3, 4, 6]) {
        const now = at(zoom).length;
        if (now < previous) return false;
        previous = now;
      }
      return true;
    })(),
  );

  /* The selected city must stay visible rather than vanishing into a badge. */
  const withParis = at(1, "paris");
  const parisGroup = withParis.find((g) =>
    g.members.some((m) => m.id === "paris"),
  );
  check(
    "the selected city is never swallowed by a cluster",
    parisGroup?.members.length === 1 && parisGroup.lead.id === "paris",
  );

  /* Grouping must not depend on the order nodes happen to arrive in. */
  const shuffled = [...cl].reverse();
  const a = at(1)
    .map((g) => g.id)
    .sort()
    .join("|");
  const b = clusterNodes(shuffled, {
    zoom: 1,
    boardPx: 1180,
    minSeparationPx: 42,
  })
    .map((g) => g.id)
    .sort()
    .join("|");
  check("clustering is deterministic regardless of input order", a === b);

  /* The lead speaks for the group, so it must be the most invested-in one. */
  let built = startRun(doctor, 5);
  built.r.cash = 400_000;
  built = run(built, "enterCity", "london");
  built = run(built, "buyFacility", "clinic:london");
  const leadOfEurope = clusterNodes(networkNodes(med(built)), {
    zoom: 1,
    boardPx: 1180,
    minSeparationPx: 42,
  }).find((g) => g.members.length > 1);
  check(
    "a cluster is led by its most developed market",
    leadOfEurope !== undefined &&
      ["operating"].includes(leadOfEurope.lead.state) === true,
    leadOfEurope
      ? `${leadOfEurope.lead.id} (${leadOfEurope.lead.state})`
      : "none",
  );
  check(
    "a cluster's badge stays near its members",
    (() => {
      const g = at(1).find((c) => c.members.length > 1);
      if (!g) return false;
      const xs = g.members.map((m) => m.x);
      const ys = g.members.map((m) => m.y);
      // Allowed to step aside from a marker, but not to wander off.
      return (
        g.x >= Math.min(...xs) - 6 &&
        g.x <= Math.max(...xs) + 6 &&
        g.y >= Math.min(...ys) - 6 &&
        g.y <= Math.max(...ys) + 6
      );
    })(),
  );

  /*
   * The regression this exists for: with Lyon selected, the badge for the
   * remaining European markets landed exactly on Lyon's marker, because Lyon
   * sits in the middle of the crowd it was excluded from.
   */
  check(
    "a cluster badge never lands on top of a real marker",
    (() => {
      for (const selected of ["lyon", "paris", null]) {
        const groups = at(1, selected);
        const solo = groups.filter((g) => g.members.length === 1);
        const grouped = groups.filter((g) => g.members.length > 1);
        for (const g of grouped) {
          for (const s of solo) {
            const d = Math.hypot((g.x - s.x) * 11.8, (g.y - s.y) * 6.6);
            if (d < 30) return false;
          }
        }
      }
      return true;
    })(),
  );
}

// --- map centring ----------------------------------------------------------
{
  // A 960px board inside a 350px phone viewport: 610px of travel.
  const V = 350;
  const C = 960;
  check(
    "a city in the middle of the board centres exactly",
    centreScroll(480, V, C) === 480 - V / 2,
  );
  check(
    "a city near the western edge clamps to the start",
    centreScroll(40, V, C) === 0,
  );
  check(
    "a city near the eastern edge clamps to the end",
    centreScroll(950, V, C) === C - V,
  );
  check(
    "a board that fits its viewport never scrolls",
    centreScroll(500, 1102, 1102) === 0 && centreScroll(0, 1102, 1102) === 0,
  );
  check(
    "centring never returns a negative or over-scrolled offset",
    [0, 1, 480, 959, 960, 5000].every((p) => {
      const v = centreScroll(p, V, C);
      return v >= 0 && v <= C - V;
    }),
  );

  /*
   * The regression this exists for: on a phone the map used to open at 0,
   * showing the Americas while Lyon sat off-screen to the east.
   */
  const lyon = cityOf("lyon").map.x;
  const lyonCentrePx = (lyon / 100) * C;
  const opened = centreScroll(lyonCentrePx, V, C);
  check(
    "the home city is on screen when the map opens on a phone",
    lyonCentrePx >= opened && lyonCentrePx <= opened + V,
    `lyon at ${Math.round(lyonCentrePx)}px, window ${Math.round(opened)}-${Math.round(opened + V)}`,
  );
  check(
    "every city can be brought on screen at phone width",
    CITIES.every((c) => {
      const px = (c.map.x / 100) * C;
      const left = centreScroll(px, V, C);
      return px >= left && px <= left + V;
    }),
  );
}

// --- marker badges ---------------------------------------------------------
{
  check("a small panel shows the real number", compactCount(90) === "90");
  check(
    "a panel just under a thousand is not abbreviated",
    compactCount(999) === "999",
  );
  check("a thousand becomes 1k", compactCount(1000) === "1k");
  check("thousands keep one decimal", compactCount(1240) === "1.2k");
  check("a round thousand drops its decimal", compactCount(2000) === "2k");
  check("large panels stay short", compactCount(27300) === "27k");
  check(
    "zero and negatives do not produce junk",
    compactCount(0) === "0" && compactCount(-5) === "0",
  );
  check(
    "no badge is ever the old ambiguous hours-looking form",
    !/^\d+h$/.test(compactCount(100)),
    compactCount(100),
  );
}

// --- city statistics -------------------------------------------------------
{
  /*
   * The bug this replaces: `contestedShare` was labelled "Your share", so a
   * starting practice with ninety patients appeared to control 93% of Lyon.
   */
  const starting = startRun(doctor, 12);
  const panel = starting.r.panel;
  check(
    "a starting practice has captured almost none of its city",
    capturedShare("lyon", 90) < 0.05,
    `${(capturedShare("lyon", 90) * 100).toFixed(1)}%`,
  );
  check(
    "captured share is panel over the population ceiling",
    Math.abs(capturedShare("lyon", 1495) - 0.5) < 1e-9,
  );
  check(
    "captured share never exceeds the whole city",
    capturedShare("lyon", 10_000_000) === 1,
  );
  check(
    "captured share floors at zero for junk input",
    capturedShare("lyon", -50) === 0 && capturedShare("lyon", NaN) === 0,
  );
  check(
    "market access and captured share are genuinely different numbers",
    Math.abs(contestedShare("lyon", 50) - capturedShare("lyon", panel)) > 0.5,
    `access ${contestedShare("lyon", 50).toFixed(2)} vs captured ${capturedShare("lyon", panel).toFixed(2)}`,
  );
}

// --- save validation -------------------------------------------------------
{
  /*
   * `loadRun` reads localStorage, so the validator is exercised here through a
   * minimal stub. Every case must be REJECTED — a partially valid save is
   * worse than none, because it renders once and then misbehaves quietly.
   */
  const good = JSON.parse(JSON.stringify(startRun(doctor, 3))) as Record<
    string,
    unknown
  >;
  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
  /*
   * Every key this build can read, so `clearStore` cannot leave a stale
   * value behind after a version bump. Deriving the list from one place
   * is what stops the next bump repeating the shadowing bug this suite
   * caught at v9 — a leftover newer save silently shadowing the fixture
   * each assertion had just written.
   */
  /*
   * The current key, and every key `loadRun` can read.
   *
   * Both come from `save.ts` rather than being repeated here. A local copy of
   * the list is exactly what let a leftover newer value shadow each fixture
   * after the v9 and v10 bumps; deriving it means the next bump cannot repeat
   * that on its own.
   */
  const KEY = SAVE_KEYS[0];
  const ALL_KEYS = [...SAVE_KEYS];
  const clearStore = () => {
    for (const k of ALL_KEYS) store.delete(k);
  };

  /*
   * The mutator reaches into arbitrary depths of a parsed save to corrupt one
   * field. `any` is the honest type for that: the whole point is to write
   * values the real types forbid.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loads = (mutate: (s: Record<string, any>) => void, key = KEY) => {
    const copy = JSON.parse(JSON.stringify(good));
    mutate(copy);
    clearStore();
    store.set(key, JSON.stringify(copy));
    return loadRun() !== null;
  };

  check(
    "an untouched save still loads",
    loads(() => {}),
  );
  check(
    "a save with no stored value loads as nothing",
    (() => {
      clearStore();
      return loadRun() === null;
    })(),
  );
  check(
    "unparseable JSON is rejected",
    (() => {
      clearStore();
      store.set(KEY, "{not json");
      return loadRun() === null;
    })(),
  );

  check(
    "a non-finite resource is rejected",
    !loads((s) => {
      s.r.cash = null;
    }),
  );
  check(
    "a NaN resource is rejected",
    !loads((s) => {
      s.r.reputation = "NaN";
    }),
  );
  check(
    "a missing log is rejected",
    !loads((s) => {
      delete s.log;
    }),
  );
  check(
    "a missing lastCases is rejected",
    !loads((s) => {
      delete s.data.med.lastCases;
    }),
  );
  check(
    "a missing lastCityReports is rejected",
    !loads((s) => {
      delete s.data.med.lastCityReports;
    }),
  );
  check(
    "a malformed city report entry is rejected",
    !loads((s) => {
      s.data.med.lastCityReports = [{ city: "lyon" }];
    }),
  );
  check(
    "a city report for a city that does not exist is rejected",
    !loads((s) => {
      s.data.med.lastCityReports = [
        { city: "atlantis", arrived: 1, treated: 1, revenue: 1 },
      ];
    }),
  );
  check(
    "an unknown city in the licence list is rejected",
    !loads((s) => {
      s.data.med.cities = ["lyon", "atlantis"];
    }),
  );
  check(
    "an unknown home city is rejected",
    !loads((s) => {
      s.data.med.homeCity = "atlantis";
    }),
  );
  check(
    "a non-finite panel value is rejected",
    !loads((s) => {
      s.data.med.panels.lyon = Number.POSITIVE_INFINITY;
    }),
  );
  check(
    "a panel keyed by an unknown city is rejected",
    !loads((s) => {
      s.data.med.panels.atlantis = 10;
    }),
  );
  check(
    "a missing nextId is rejected",
    !loads((s) => {
      delete s.data.med.nextId;
    }),
  );
  check(
    "an invalid triage policy is rejected",
    !loads((s) => {
      s.data.med.triage = "whatever";
    }),
  );
  check(
    "every real triage policy is accepted",
    ["urgent", "profitable", "volume"].every((t) =>
      loads((s) => {
        s.data.med.triage = t;
      }),
    ),
  );
  check(
    "a malformed outbreak is rejected",
    !loads((s) => {
      s.data.med.outbreaks = [
        { id: "flu", city: "nowhere", weeksLeft: 2, startedWeek: 1 },
      ];
    }),
  );
  check(
    "a non-finite social metric is rejected",
    !loads((s) => {
      s.data.med.phone.social.trust = null;
    }),
  );
  check(
    "a non-finite supply figure is rejected",
    !loads((s) => {
      s.data.med.supplies.stock = "lots";
    }),
  );
  check(
    "the validator rejects rather than repairing",
    (() => {
      const copy = JSON.parse(JSON.stringify(good));
      copy.data.med.homeCity = "atlantis";
      const before = JSON.stringify(copy);
      store.set(KEY, before);
      loadRun();
      // The stored save must be untouched: no silent write-back of a "fixed"
      // object, which would make the corruption permanent.
      return store.get(KEY) === before;
    })(),
  );

  /* ---------------------------------------------------- catalogue contracts
   *
   * The class of corruption that is structurally perfect and still fatal: an
   * identifier that no longer names anything. Each of these would resolve to
   * `undefined` at its first lookup and blank the screen.
   */
  check(
    "an unknown career id is rejected",
    !loads((s) => {
      s.careerId = "astronaut";
    }),
  );
  check(
    "a career id that is not a string is rejected",
    !loads((s) => {
      s.careerId = 7;
    }),
  );
  check(
    "an unknown facility type is rejected",
    !loads((s) => {
      s.data.med.facilities[0].type = "castle";
    }),
  );
  check(
    "a facility in an unknown city is rejected",
    !loads((s) => {
      s.data.med.facilities[0].city = "atlantis";
    }),
  );
  check(
    "a staff member with an unknown role is rejected",
    !loads((s) => {
      s.data.med.staff = [
        {
          id: "s1",
          role: "wizard",
          name: "X",
          specialty: null,
          skill: 50,
          salary: 100,
        },
      ];
    }),
  );
  check(
    "a staff member with a non-finite salary is rejected",
    !loads((s) => {
      s.data.med.staff = [
        {
          id: "s1",
          role: "nurse",
          name: "X",
          specialty: null,
          skill: 50,
          salary: null,
        },
      ];
    }),
  );
  check(
    "a staff member missing a name is rejected",
    !loads((s) => {
      s.data.med.staff = [
        { id: "s1", role: "nurse", specialty: null, skill: 50, salary: 100 },
      ];
    }),
  );
  check(
    "an unknown department is rejected",
    !loads((s) => {
      s.data.med.departments = ["general", "astrology"];
    }),
  );
  check(
    "unknown equipment is rejected",
    !loads((s) => {
      s.data.med.equipment = ["teleporter"];
    }),
  );
  check(
    "an unknown qualification is rejected",
    !loads((s) => {
      s.data.med.qualifications = [{ id: "phd-in-vibes", specialty: null }];
    }),
  );
  check(
    "a qualification in an unknown specialty is rejected",
    !loads((s) => {
      s.data.med.qualifications = [{ id: "md", specialty: "astrology" }];
    }),
  );
  check(
    "an unknown campaign is rejected",
    !loads((s) => {
      s.data.med.campaigns = ["skywriting"];
    }),
  );
  check(
    "an unknown lifestyle item is rejected",
    !loads((s) => {
      s.data.med.lifestyle = ["private-island"];
    }),
  );
  check(
    "an unknown solved pathogen is rejected",
    !loads((s) => {
      s.data.med.solved = ["the-common-cold"];
    }),
  );
  check(
    "a home city you hold no licence for is rejected",
    !loads((s) => {
      s.data.med.homeCity = "tokyo";
    }),
  );

  // Root-level structure.
  check(
    "a week of zero is rejected",
    !loads((s) => {
      s.week = 0;
    }),
  );
  check(
    "a fractional week is rejected",
    !loads((s) => {
      s.week = 3.5;
    }),
  );
  check(
    "a non-finite seed is rejected",
    !loads((s) => {
      s.seed = Infinity;
    }),
  );
  check(
    "a non-numeric owned record is rejected",
    !loads((s) => {
      s.owned = { clinic: "two" };
    }),
  );
  check(
    "a non-numeric eventHistory is rejected",
    !loads((s) => {
      s.eventHistory = { inspection: null };
    }),
  );
  check(
    "a malformed history entry is rejected",
    !loads((s) => {
      s.history = [{ week: 1, net: "lots" }];
    }),
  );
  check(
    "a history entry missing its week is rejected",
    !loads((s) => {
      s.history = [{ net: 10 }];
    }),
  );
  check(
    "a malformed log entry is rejected",
    !loads((s) => {
      s.log = [{ week: 1, text: "hi", tone: "smug" }];
    }),
  );
  check(
    "a log entry with a non-string text is rejected",
    !loads((s) => {
      s.log = [{ week: 1, text: 42, tone: "good" }];
    }),
  );
  check(
    "an outcome with an unknown kind is rejected",
    !loads((s) => {
      s.outcome = { kind: "drawn", title: "t", body: "b" };
    }),
  );
  check(
    "an outcome missing its body is rejected",
    !loads((s) => {
      s.outcome = { kind: "won", title: "t" };
    }),
  );
  check(
    "a valid won outcome is accepted",
    loads((s) => {
      s.outcome = { kind: "won", title: "t", body: "b" };
    }),
  );
  check(
    "a valid lost outcome is accepted",
    loads((s) => {
      s.outcome = { kind: "lost", title: "t", body: "b" };
    }),
  );

  // Phone sub-structures, all of which are rendered directly.
  check(
    "a malformed feed post is rejected",
    !loads((s) => {
      s.data.med.phone.feed = [{ id: "p", week: 1, body: "x" }];
    }),
  );
  check(
    "a feed post with an unknown kind is rejected",
    !loads((s) => {
      s.data.med.phone.feed = [
        {
          id: "p",
          week: 1,
          author: "a",
          handle: "h",
          kind: "ghost",
          body: "x",
          likes: 1,
          comments: [],
          tone: "good",
        },
      ];
    }),
  );
  check(
    "a message with an unknown role is rejected",
    !loads((s) => {
      s.data.med.phone.messages = [
        {
          id: "m",
          week: 1,
          from: "a",
          handle: "h",
          role: "alien",
          body: "x",
          read: false,
        },
      ];
    }),
  );
  check(
    "a news item missing its read flag is rejected",
    !loads((s) => {
      s.data.med.phone.news = [
        {
          id: "n",
          week: 1,
          outlet: "o",
          headline: "h",
          body: "b",
          tone: "good",
        },
      ];
    }),
  );
  check(
    "a non-finite recruit boost is rejected",
    !loads((s) => {
      s.data.med.phone.recruitBoost = NaN;
    }),
  );
  check(
    "a non-string entry in postsMade is rejected",
    !loads((s) => {
      s.data.med.phone.postsMade = [17];
    }),
  );

  /*
   * A full mid-run save, not just a fresh one: the fresh save has empty
   * arrays everywhere, so it would pass a validator that never actually
   * inspects an entry.
   */
  {
    let played = startRun(doctor, 21);
    played.r.cash = 400_000;
    played = run(played, "enterCity", "madrid");
    played = run(played, "buyFacility", "clinic:madrid");
    played = run(played, "hire", "nurse");
    played = run(played, "openDepartment", "paediatrics");
    played = run(played, "buyEquipment", "lab");
    played = advanceWeek(doctor, played, { clinic: 4 }).state;
    store.set(KEY, JSON.stringify(played));
    check(
      "a populated mid-run save loads with every collection non-empty",
      loadRun() !== null &&
        med(played).facilities.length > 1 &&
        med(played).staff.length > 0 &&
        med(played).lastCases.length > 0 &&
        med(played).lastCityReports.length > 0,
    );
  }

  delete (globalThis as { window?: unknown }).window;
}

// --- outbreak pressure -----------------------------------------------------
/*
 * The spawn roll is what makes outbreaks a progression rather than an event
 * that fires once past week eight. These assert the shape of that curve, not
 * particular constants — a tuning pass should be free to move the numbers
 * without rewriting the tests, but must not be free to make late-game safer
 * than early-game or to uncap the rate.
 */
{
  console.log("\nOutbreak pressure\n" + "─".repeat(52));

  check(
    "no cities means nothing can reach you",
    outbreakPressure(0, 0) === 0 && outbreakPressure(140, 0) === 0,
  );
  check("one city is already at risk in week one", outbreakPressure(1, 1) > 0);
  check(
    "pressure rises with the years",
    outbreakPressure(120, 2) > outbreakPressure(10, 2),
  );
  check(
    "pressure rises with reach",
    outbreakPressure(40, 6) > outbreakPressure(40, 1),
  );
  check(
    "pressure is capped, so a run is never permanently on fire",
    outbreakPressure(155, 14) <= 0.22 && outbreakPressure(999, 99) <= 0.22,
  );
  check(
    "the severity ceiling only ever opens up",
    severityCeiling(1) <= severityCeiling(30) &&
      severityCeiling(30) <= severityCeiling(60) &&
      severityCeiling(60) <= severityCeiling(120),
  );
  check(
    "week one cannot draw a run-ending pathogen",
    severityCeiling(1) === 2 && OUTBREAKS.some((o) => o.severity > 2),
  );
  check(
    "the whole catalogue is reachable eventually",
    Math.max(...OUTBREAKS.map((o) => o.severity)) <= severityCeiling(156),
  );
  check(
    "every band is reachable from real play",
    ["low", "rising", "high", "severe"].every((band) =>
      [
        [1, 1],
        [20, 2],
        [40, 2],
        [60, 4],
        [150, 14],
      ].some(([w, c]) => pressureBand(outbreakPressure(w, c)) === band),
    ),
  );

  /* And it actually fires: a long run with reach must see outbreaks start
     after the old week-8 window, or the progression is decorative. */
  let s2 = startRun(doctor, 404);
  s2.r.cash = 4_000_000;
  for (const city of ["madrid", "berlin", "london"]) {
    s2 = run(s2, "enterCity", city);
    s2 = run(s2, "buyFacility", `clinic:${city}`);
  }
  const startWeeks: number[] = [];
  for (let i = 0; i < 90 && !s2.outcome; i++) {
    s2 = advanceWeek(doctor, s2, { clinic: 3, manage: 2 }).state;
    for (const o of med(s2).outbreaks) {
      if (o.startedWeek === s2.week - 1 || o.startedWeek === s2.week) {
        if (!startWeeks.includes(o.startedWeek)) startWeeks.push(o.startedWeek);
      }
    }
    s2.r.cash = Math.max(s2.r.cash, 900_000);
  }
  check(
    "outbreaks keep starting all run, not just early",
    startWeeks.length >= 2 && startWeeks.some((w) => w > 20),
    `started in weeks ${startWeeks.join(", ") || "none"}`,
  );
}

// --- the cast on the phone -------------------------------------------------
/*
 * Bots must react to the run rather than to the clock, and must never draw
 * from the gameplay RNG — the phone has its own stream precisely so that
 * adding chatter cannot move the balance figures in the README.
 */
{
  console.log("\nPhone cast\n" + "─".repeat(52));

  let s3 = startRun(doctor, 77);
  s3.r.cash = 2_000_000;
  s3 = run(s3, "enterCity", "madrid");
  s3 = run(s3, "buyFacility", "clinic:madrid");
  s3 = run(s3, "hire", "nurse");

  const seen = new Set<string>();
  const authors = new Set<string>();
  for (let i = 0; i < 60 && !s3.outcome; i++) {
    s3 = advanceWeek(doctor, s3, { clinic: 3, outreach: 1, manage: 1 }).state;
    s3.r.cash = Math.max(s3.r.cash, 600_000);
  }
  for (const post of med(s3).phone.feed) {
    seen.add(post.id);
    authors.add(post.handle);
  }

  check("the feed fills up over a run", med(s3).phone.feed.length > 10);
  check(
    "more than one account is talking",
    authors.size >= 3,
    `${authors.size} accounts: ${[...authors].slice(0, 6).join(" ")}`,
  );
  check(
    "the feed is capped so a long save cannot grow without limit",
    med(s3).phone.feed.length <= MAX_FEED,
  );
  check(
    "no two feed entries share an id",
    seen.size === med(s3).phone.feed.length,
  );

  /* Determinism: the same seed and the same play must produce the same feed.
     If this ever fails, the phone has started drawing from a shared stream. */
  const replay = (seed: number) => {
    let a = startRun(doctor, seed);
    a.r.cash = 2_000_000;
    a = run(a, "enterCity", "madrid");
    a = run(a, "buyFacility", "clinic:madrid");
    a = run(a, "hire", "nurse");
    for (let i = 0; i < 25 && !a.outcome; i++) {
      a = advanceWeek(doctor, a, { clinic: 3, outreach: 1, manage: 1 }).state;
      a.r.cash = Math.max(a.r.cash, 600_000);
    }
    return med(a)
      .phone.feed.map((p) => p.id)
      .join("|");
  };
  check("the same run produces the same feed", replay(77) === replay(77));
  check(
    "a different seed produces a different feed",
    replay(77) !== replay(78),
  );

  /* Comments answer the room you are standing in, not a fixed script. */
  const warm = med(s3);
  warm.phone.social.trust = 85;
  warm.phone.social.followers = 40_000;
  const cold = JSON.parse(JSON.stringify(warm)) as typeof warm;
  cold.phone.social.trust = 12;
  cold.phone.social.scrutiny = 80;
  const rngA = makeRng(1234);
  const rngB = makeRng(1234);
  const warmC = reactionsFor(warm, { week: 40, reputation: 60 }, rngA);
  const coldC = reactionsFor(cold, { week: 40, reputation: 60 }, rngB);
  check(
    "standing changes who bothers to reply",
    warmC.comments.map((c) => c.handle).join() !==
      coldC.comments.map((c) => c.handle).join(),
  );
  check("reach drives how many likes a post gets", warmC.likes > coldC.likes);
}

// --- quick plans -----------------------------------------------------------
/*
 * These are pure allocation helpers, so they can be tested without a browser.
 * The contract that matters: a plan is always something the player could have
 * entered by hand, and never spends time that does not exist.
 */
{
  console.log("\nQuick plans\n" + "─".repeat(52));

  const s4 = startRun(doctor, 12);
  const budget = doctor.timeBudget(s4);
  const spend = (a: Record<string, number>) =>
    Object.values(a).reduce((n, x) => n + x, 0);

  check(
    "a named plan spends the whole week and no more",
    PLANS.every((p) => spend(applyPlan(doctor, p, budget, s4)) === budget),
  );
  check(
    "a plan never exceeds an action's own weekly cap",
    PLANS.every((p) =>
      Object.entries(applyPlan(doctor, p, budget, s4)).every(([id, n]) => {
        const action = doctor.actions.find((a) => a.id === id);
        return !!action && n <= (action.maxPerWeek ?? Infinity);
      }),
    ),
  );
  check(
    "a plan only ever names real actions",
    PLANS.every((p) =>
      Object.keys(applyPlan(doctor, p, budget, s4)).every((id) =>
        doctor.actions.some((a) => a.id === id),
      ),
    ),
  );
  check(
    "repeating last week is trimmed to a smaller budget",
    spend(clampPlan(doctor, { clinic: 4, manage: 2 }, 3, s4)) === 3,
  );
  check(
    "a remembered plan naming a missing action is dropped, not applied",
    clampPlan(doctor, { notAnAction: 4 }, budget, s4).notAnAction === undefined,
  );
  check(
    "a plan never assigns to an action this run has not unlocked",
    PLANS.every((p) =>
      Object.keys(applyPlan(doctor, p, budget, s4)).every((id) => {
        const action = doctor.actions.find((a) => a.id === id);
        return !!action && (!action.unlocked || action.unlocked(s4));
      }),
    ),
    "week 1 has no second city, so travel must never be planned",
  );
  check(
    "a locked action cannot be repeated from a stored plan",
    clampPlan(doctor, { travel: 3 }, budget, s4).travel === undefined,
  );
}

// --- the remembered plan ---------------------------------------------------
{
  console.log("\nLast plan storage\n" + "─".repeat(52));

  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };

  saveLastPlan("doctor", { clinic: 3, manage: 2 });
  check("a saved plan comes back", loadLastPlan("doctor")?.clinic === 3);
  check(
    "a plan is not offered to a different career",
    loadLastPlan("chef") === null,
  );

  store.set("career-tycoon:lastplan:v1", "{ not json");
  check("corrupt storage is ignored", loadLastPlan("doctor") === null);

  store.set(
    "career-tycoon:lastplan:v1",
    JSON.stringify({ careerId: "doctor", alloc: { clinic: -4 } }),
  );
  check("a negative block count is refused", loadLastPlan("doctor") === null);

  store.set(
    "career-tycoon:lastplan:v1",
    JSON.stringify({ careerId: "doctor", alloc: { clinic: 1.5 } }),
  );
  check("a fractional block count is refused", loadLastPlan("doctor") === null);

  store.set(
    "career-tycoon:lastplan:v1",
    JSON.stringify({ careerId: "doctor", alloc: {} }),
  );
  check("an empty plan is not offered", loadLastPlan("doctor") === null);

  check(
    "the remembered plan is not part of the save",
    store.get("career-tycoon:save:v8") === undefined,
  );

  delete (globalThis as { window?: unknown }).window;
}

// --- resilience ------------------------------------------------------------
const poisoned = startRun(doctor, 31);
poisoned.r.cash = NaN;
poisoned.r.reputation = Infinity;
const healed = run(poisoned, "triage", "urgent");
check(
  "a non-finite resource is reset rather than spreading",
  Number.isFinite(healed.r.cash) && Number.isFinite(healed.r.reputation),
);

// --- isolation -------------------------------------------------------------
const base = startRun(doctor, 7);
const branch = run(base, "hire", "nurse");
check(
  "commands do not mutate the previous state",
  med(base).staff.length === 0 && med(branch).staff.length === 1,
);

// --- people, timeline, consequences ----------------------------------------
/*
 * Phase 1's new subsystems. Each is a pure-ish function over RunState, so all
 * of this runs in Node in milliseconds and none of it needs a browser.
 */
{
  console.log("\nPeople\n" + "─".repeat(52));

  const p0 = startRun(doctor, 500);
  check(
    "a fresh run arrives with the cast that is present from week one",
    (p0.people ?? []).length > 0 &&
      (p0.people ?? []).every((p) => PERSON_ROLES.includes(p.role)),
    `${(p0.people ?? []).length} people`,
  );
  check(
    "everyone starts on their authored footing",
    (p0.people ?? []).every(
      (p) =>
        p.status === "active" && p.memory.length === 0 && p.recent.length === 0,
    ),
  );
  check(
    "someone gated on a condition is absent until it is true",
    !p0.people?.some((p) => p.id === "mbeki"),
    "Nomsa Mbeki appears once there is staff",
  );

  {
    const s = startRun(doctor, 501);
    touchPerson(
      s,
      "hallam",
      { warmth: -20, remember: ["a-thing"] },
      "you did a thing",
      "bad",
    );
    const h = personIn(s, "hallam")!;
    check(
      "standing moves, and records why",
      h.warmth < 30 && h.recent[0].text === "you did a thing",
    );
    check("memory is a fact, kept", remembers(s, "hallam", "a-thing"));
    touchPerson(s, "hallam", { remember: ["a-thing"] }, "again", "neutral");
    check(
      "the same memory is not stored twice",
      h.memory.filter((f) => f === "a-thing").length === 1,
    );
  }

  {
    /* Traits are the reason two people react differently to one action. */
    const s = startRun(doctor, 502);
    const proud = personIn(s, "okoro")!;
    const loyal = personIn(s, "lindqvist")!;
    const before = { proud: proud.warmth, loyal: loyal.warmth };
    touchPerson(s, "okoro", { warmth: -10 }, "the same slight", "bad");
    touchPerson(s, "lindqvist", { warmth: -10 }, "the same slight", "bad");
    check(
      "a proud person takes a slight harder than a loyal one",
      before.proud - proud.warmth > before.loyal - loyal.warmth,
      `proud -${(before.proud - proud.warmth).toFixed(1)}, loyal -${(before.loyal - loyal.warmth).toFixed(1)}`,
    );
  }

  {
    const s = startRun(doctor, 503);
    touchPerson(s, "okoro", { warmth: -60 }, "a serious falling-out", "bad");
    check(
      "a bad enough falling-out estranges someone",
      personIn(s, "okoro")!.status === "estranged",
    );
  }

  {
    /* Neglect cools; it does not manufacture hostility. */
    const s = startRun(doctor, 504);
    const before = personIn(s, "hallam")!.warmth;
    s.week = 40;
    for (let i = 0; i < 30; i++) driftPeople(s);
    const after = personIn(s, "hallam")!.warmth;
    check("silence cools a relationship", after < before);
    check("but never past neutral on its own", after >= 0);
  }

  console.log("\nTimeline\n" + "─".repeat(52));
  {
    const s = startRun(doctor, 505);
    check(
      "a run opens with its own beginning recorded",
      hasMilestone(s, "start"),
    );
    const first = mark(s, "x", "money", "A thing", "It happened");
    const second = mark(s, "x", "money", "A thing", "It happened");
    check("a milestone is recorded once", first && !second);
    check(
      "entries carry the week they actually happened",
      timelineOf(s).every((t) => t.week >= 1 && t.week <= s.week),
    );

    /* The guarantee that makes the feature trustworthy: a migrated save gains
       no invented history. */
    const fresh = JSON.parse(JSON.stringify(startRun(doctor, 506)));
    delete fresh.timeline;
    const migrated = migrateRun(fresh);
    check(
      "a migrated save is given an empty timeline, not a fabricated one",
      Array.isArray(migrated?.timeline) &&
        (migrated?.timeline as unknown[]).length === 0,
    );
  }

  console.log("\nDelayed consequences\n" + "─".repeat(52));
  {
    const s = startRun(doctor, 507);
    s.week = 10;
    schedule(s, 5, "test.kind", { n: 1 }, "Something is coming.");
    check("nothing is due before its week", takeDue(s).length === 0);
    check("a notice is visible while it is pending", upcoming(s).length === 1);
    s.week = 15;
    const due = takeDue(s);
    check(
      "it comes due on the right week",
      due.length === 1 && due[0].kind === "test.kind",
    );
    check("and is taken off the queue", (s.pending ?? []).length === 0);

    /* A missed week must still fire — a silently dropped consequence is worse
       than a late one. */
    const s2 = startRun(doctor, 508);
    s2.week = 10;
    schedule(s2, 2, "late.kind");
    s2.week = 40;
    check(
      "a consequence overdue by weeks still fires",
      takeDue(s2).length === 1,
    );

    const s3 = startRun(doctor, 509);
    for (let i = 0; i < 60; i++) schedule(s3, 3, "spam");
    check(
      "the queue is bounded so a bug cannot grow a save without limit",
      (s3.pending ?? []).length <= MAX_PENDING,
    );
  }

  console.log("\nEvent chains\n" + "─".repeat(52));
  {
    const opens = CHAIN_EVENTS.filter((e) => !e.followUp);
    const followUps = CHAIN_EVENTS.filter((e) => e.followUp);
    check(
      "there are several storylines",
      new Set(CHAIN_EVENTS.map((e) => e.chain)).size >= 4,
    );
    check("each has an opening beat", opens.length >= 4);
    check("and delayed follow-ups", followUps.length >= 4);
    check(
      "every opener fires at most once in a run",
      opens.every((e) => e.once === true),
    );
    check(
      "a follow-up can never be rolled at random",
      followUps.every(
        (e) => e.weight(startRun(doctor, 1)) === 0 && e.followUp === true,
      ),
    );
    check(
      "every event id is unique",
      new Set(doctor.events.map((e) => e.id)).size === doctor.events.length,
    );

    /* Every kind a chain schedules must be one `resolvePending` handles, or
       the storyline silently dead-ends. */
    const kinds = [
      "registrar.supervised",
      "registrar.reported",
      "registrar.buried",
      "audit.clean",
      "audit.contested",
      "partner.pressure",
      "partner.clinical",
      "chair.decision",
      "chair.rematch",
    ];
    const handled = kinds.filter((kind) => {
      const s = startRun(doctor, 510);
      s.week = 40;
      const out = doctor.resolvePending?.(
        s,
        { id: "t", dueWeek: 40, kind },
        makeRng(1),
      );
      // A handler may legitimately fizzle; what must not happen is a throw.
      return out === undefined || typeof out === "object";
    });
    check(
      "every scheduled kind has a handler that runs",
      handled.length === kinds.length,
    );

    check(
      "an unknown kind from an older build is ignored, not fatal",
      doctor.resolvePending?.(
        startRun(doctor, 511),
        { id: "t", dueWeek: 1, kind: "kind.that.no.longer.exists" },
        makeRng(1),
      ) === undefined,
    );

    /* Raised follow-ups must actually reach the player. */
    const s = startRun(doctor, 512);
    s.week = 20;
    schedule(s, 1, "audit.clean");
    s.week = 21;
    const r = advanceWeek(doctor, s, { rest: 2 });
    check(
      "a due consequence raises its follow-up event that same week",
      r.event?.def.id === "chain.audit.vindicated",
      r.event?.def.id ?? "no event",
    );

    /* And the decision must read state, not roll dice. */
    const strong = startRun(doctor, 520);
    strong.r.reputation = 90;
    strong.r.repInfluence = 90;
    strong.r.repEthics = 90;
    const weak = startRun(doctor, 521);
    weak.r.reputation = 20;
    weak.r.repInfluence = 10;
    weak.r.repEthics = 30;
    const outcomeFor = (st: typeof strong) =>
      doctor.resolvePending?.(
        st,
        { id: "t", dueWeek: st.week, kind: "chair.decision" },
        makeRng(1),
      );
    check(
      "the chair is decided by standing, not by chance",
      (outcomeFor(strong) as { raiseEvent?: string })?.raiseEvent ===
        "chain.chair.appointed" &&
        (outcomeFor(weak) as { raiseEvent?: string })?.raiseEvent ===
          "chain.chair.passed",
    );
  }

  console.log("\nReputation\n" + "─".repeat(52));
  {
    const s = startRun(doctor, 513);
    check(
      "a fresh run has all six categories",
      REPUTATIONS.every((d) => typeof s.r[d.key] === "number"),
    );
    check(
      "credibility is the existing reputation value, not a new one",
      REP_BY_ID.get("credibility")!.key === "reputation" &&
        s.r.reputation === 45,
    );

    const before = overallReputation(s);
    applyRep(s, "ethics", -40, "a test");
    check(
      "ethics scales the overall rather than averaging into it",
      overallReputation(s) < before,
    );

    applyRep(s, "loyalty", 12, "you looked after your team");
    check("a category moves", s.r.repLoyalty === 62);
    check(
      "and the reason is recorded",
      (s.repLog ?? [])[0].why === "you looked after your team",
    );

    applyRep(s, "loyalty", 999, "clamped");
    check("categories are clamped to 100", s.r.repLoyalty === 100);
    applyRep(s, "loyalty", -999, "clamped");
    check("and to 0", s.r.repLoyalty === 0);

    check(
      "the overall is bounded whatever the parts do",
      overallReputation(s) >= 0 && overallReputation(s) <= 100,
    );

    /* The couplings that make this gameplay rather than a scoreboard. */
    const rich = startRun(doctor, 514);
    rich.r.repLoyalty = 10;
    check(
      "collapsed loyalty puts staff at risk of leaving",
      attritionRisk(rich) > 0,
    );
    rich.r.repLoyalty = 60;
    check("healthy loyalty does not", attritionRisk(rich) === 0);

    const known = startRun(doctor, 515);
    known.r.repInfluence = 90;
    check(
      "influence improves who you can hire",
      hiringBonus(known) > hiringBonus(startRun(doctor, 516)),
    );
  }

  console.log("\nSave migration\n" + "─".repeat(52));
  {
    /* A genuine v8 save: the engine's own output with every v9 field removed,
       which is exactly what an older build wrote. */
    const v8 = JSON.parse(JSON.stringify(startRun(doctor, 517))) as Record<
      string,
      unknown
    >;
    delete v8.people;
    delete v8.timeline;
    delete v8.pending;
    delete v8.repLog;
    const r8 = v8.r as Record<string, number>;
    for (const key of [
      "repPatients",
      "repLoyalty",
      "repInfluence",
      "repPopularity",
      "repEthics",
    ]) {
      delete r8[key];
    }
    r8.reputation = 72; // a run that was going well

    const up = migrateRun(JSON.parse(JSON.stringify(v8)));
    check("an older save is migrated, not discarded", up !== null);
    check("and the result validates", !!up && validateRun(up));
    check(
      "nothing the player earned is altered",
      (up!.r as Record<string, number>).reputation === 72 &&
        up!.week === v8.week,
    );
    check(
      "the new categories are seeded from signals the old save carried",
      (up!.r as Record<string, number>).repPatients > 50,
      "credibility 72 implies patient trust above neutral",
    );
    check(
      "the cast is added at its starting standing",
      Array.isArray(up!.people) && (up!.people as unknown[]).length > 0,
    );
    check(
      "migration is idempotent",
      JSON.stringify(migrateRun(JSON.parse(JSON.stringify(up)))) ===
        JSON.stringify(up),
    );
    check(
      "a save for a career that no longer exists is still refused",
      migrateRun({ ...v8, careerId: "astronaut" }) === null,
    );
    check(
      "a save with no career id is refused",
      migrateRun({ week: 4 }) === null,
    );

    /* Imported files are the hostile case: hand-edited, truncated, or from a
       different game entirely. */
    const bad = (mutate: (s: Record<string, unknown>) => void) => {
      const copy = JSON.parse(JSON.stringify(startRun(doctor, 518)));
      mutate(copy);
      return validateRun(copy);
    };
    /*
     * The rejection checks below are only meaningful if the UNmutated save
     * passes. Without this, an unrelated validator bug would make every one
     * of them succeed for the wrong reason — which is exactly what happened
     * while `repLog` was left undefined by `startRun`.
     */
    check(
      "the unmutated save is accepted, so the rejections mean something",
      bad(() => {}),
    );
    check(
      "a person with an unknown role is rejected",
      !bad((s) => {
        (s.people as Record<string, unknown>[])[0].role = "wizard";
      }),
    );
    check(
      "a person with an unknown status is rejected",
      !bad((s) => {
        (s.people as Record<string, unknown>[])[0].status = "vibing";
      }),
    );
    check(
      "a person with an unknown trait is rejected",
      !bad((s) => {
        (s.people as Record<string, unknown>[])[0].traits = ["chaotic"];
      }),
    );
    check(
      "a non-finite relationship score is rejected",
      !bad((s) => {
        (s.people as Record<string, unknown>[])[0].warmth = null;
      }),
    );
    check(
      "a memory flag that is not a string is rejected",
      !bad((s) => {
        (s.people as Record<string, unknown>[])[0].memory = [42];
      }),
    );
    check(
      "a timeline entry with an unknown kind is rejected",
      !bad((s) => {
        (s.timeline as unknown[]).push({
          id: "x",
          week: 1,
          kind: "vibes",
          title: "a",
          detail: "b",
        });
      }),
    );
    check(
      "a timeline entry missing its detail is rejected",
      !bad((s) => {
        (s.timeline as unknown[]).push({
          id: "x",
          week: 1,
          kind: "money",
          title: "a",
        });
      }),
    );
    check(
      "a pending consequence without a due week is rejected",
      !bad((s) => {
        (s.pending as unknown[]).push({ id: "x", kind: "y" });
      }),
    );
    check(
      "a reputation change for an unknown category is rejected",
      !bad((s) => {
        (s.repLog as unknown[]).push({
          week: 1,
          id: "charisma",
          delta: 1,
          why: "x",
        });
      }),
    );

    /* Round trip: a save that has actually been played survives JSON. */
    let played = startRun(doctor, 519);
    played.r.cash = 400_000;
    played = runCommand(doctor, played, "hire", "nurse");
    for (let i = 0; i < 20 && !played.outcome; i++) {
      played = advanceWeek(doctor, played, {
        clinic: 2,
        people: 1,
        exercise: 1,
      }).state;
      played.r.cash = Math.max(played.r.cash, 200_000);
    }
    const roundTripped = JSON.parse(JSON.stringify(played));
    check(
      "a played save survives a JSON round trip",
      validateRun(roundTripped),
    );
    check(
      "including its people, timeline and standing",
      (roundTripped.people as unknown[]).length > 0 &&
        (roundTripped.timeline as unknown[]).length > 0 &&
        typeof roundTripped.r.repLoyalty === "number",
    );
  }

  console.log("\nThe planner\n" + "─".repeat(52));
  {
    /* The hard limit: the engine must never let a week spend more time than
       it has, whatever the caller passes. */
    const s = startRun(doctor, 522);
    const budget = doctor.timeBudget(s);
    check(
      "the budget is a real number of blocks",
      Number.isFinite(budget) && budget > 0,
    );
    check(
      "every new activity is a real action with a preview and a cost",
      ["people", "network", "exercise", "content", "travel"].every((id) => {
        const a = doctor.actions.find((x) => x.id === id);
        return (
          !!a &&
          a.timeCost > 0 &&
          a.preview(s).length > 0 &&
          !!a.blurb &&
          !!a.label
        );
      }),
    );
    check(
      "every new activity is capped, so no single one can eat a week",
      ["people", "network", "exercise", "content", "travel"].every(
        (id) =>
          (doctor.actions.find((x) => x.id === id)?.maxPerWeek ?? 99) <= 2,
      ),
    );

    /* Fitness is the only compounding self-care effect, so it must actually
       compound — and it must decay, or it is a one-off purchase. */
    let f = startRun(doctor, 523);
    f.r.burnout = 60;
    for (let i = 0; i < 6; i++)
      f = advanceWeek(doctor, f, { exercise: 2, rest: 1 }).state;
    const built = f.r._fitness ?? 0;
    check(
      "exercise builds a fitness stock",
      built > 3,
      `fitness ${built.toFixed(1)}`,
    );
    for (let i = 0; i < 10; i++)
      f = advanceWeek(doctor, f, { clinic: 3 }).state;
    check("and it decays when you stop", (f.r._fitness ?? 0) < built);
  }
}

// --- phase 2: a living world -----------------------------------------------
{
  console.log("\nCity economy\n" + "─".repeat(52));
  {
    const m0: CityMarket = {
      demand: 1,
      salary: 1,
      rent: 1,
      fees: 1,
      talent: 1,
      sentiment: 50,
      regulation: 20,
      cycle: 0,
      shockWeeks: 0,
      shock: null,
    };
    const m = { ...m0 };
    const rng = makeRng(1);
    for (let i = 0; i < 300; i++) driftMarket(m, rng, i);
    check(
      "a market never escapes its bounds, however long it drifts",
      m.demand >= 0.6 &&
        m.demand <= 1.6 &&
        m.salary >= 0.6 &&
        m.salary <= 1.6 &&
        m.rent >= 0.6 &&
        m.rent <= 1.6 &&
        m.fees >= 0.6 &&
        m.fees <= 1.6 &&
        m.sentiment >= 0 &&
        m.sentiment <= 100 &&
        m.regulation >= 0 &&
        m.regulation <= 100,
      `demand ${m.demand.toFixed(2)} salary ${m.salary.toFixed(2)}`,
    );

    /* Determinism: the same seed must produce the same economy, or the
       balance harness is measuring noise. */
    /*
     * Long enough for a shock to have happened. The ordinary week is
     * deterministic *by design* — the RNG is only consulted for shocks, which
     * are rare — so a sixty-week comparison can legitimately find two seeds
     * identical. That is correct behaviour and a bad test.
     */
    const walk = (seed: number) => {
      const x = { ...m0 };
      const r = makeRng(seed);
      for (let i = 0; i < 400; i++) driftMarket(x, r, i);
      return `${x.demand.toFixed(4)}/${x.salary.toFixed(4)}/${x.shock}`;
    };
    check("the economy is deterministic given a seed", walk(7) === walk(7));
    check("and different seeds diverge", walk(7) !== walk(8));

    /* Drift is gradual. A single week must never move a market more than a
       couple of percent unless a shock is running — that is the whole
       "gradual unless caused by a major event" requirement. */
    const gentle = { ...m0 };
    const r2 = makeRng(99);
    let worst = 0;
    for (let i = 0; i < 200; i++) {
      const before = gentle.demand;
      driftMarket(gentle, r2, i);
      if (!gentle.shock)
        worst = Math.max(worst, Math.abs(gentle.demand - before));
    }
    check(
      "an ordinary week moves a market only slightly",
      worst < 0.03,
      `largest quiet-week move ${(worst * 100).toFixed(2)}%`,
    );

    const shocked = { ...m0, shock: "boom" as const, shockWeeks: 10 };
    const before = shocked.demand;
    driftMarket(shocked, makeRng(3), 40);
    check(
      "a shock moves it faster than a quiet week",
      shocked.demand - before > worst,
    );
  }

  console.log("\nStaff and culture\n" + "─".repeat(52));
  {
    /* The v9 roster shape must survive contact with every reader. */
    const bare = {
      id: "s1",
      role: "nurse",
      name: "A",
      specialty: null,
      skill: 50,
      salary: 1000,
    };
    const h = hydrateStaff(bare as never);
    check(
      "an older staff record is filled in rather than rejected",
      Number.isFinite(h.morale) &&
        Number.isFinite(h.loyalty) &&
        Number.isFinite(h.expects) &&
        h.traits.length > 0,
    );
    check(
      "traits are stable for a given person",
      hydrateStaff(bare as never).traits[0] === h.traits[0],
    );

    let s = startRun(doctor, 600);
    s.r.cash = 900_000;
    s = runCommand(doctor, s, "hire", "nurse");
    s = runCommand(doctor, s, "hire", "gp");
    const m = med(s);
    check(
      "culture is derived, with its reasons attached",
      (() => {
        const c = cultureScore(m, s.week);
        return (
          c.score >= 0 &&
          c.score <= 100 &&
          c.drivers.length > 0 &&
          c.drivers.every((d) => !!d.label && !!d.detail)
        );
      })(),
    );
    check(
      "there is no culture field to set — it is computed",
      !("culture" in (m as unknown as Record<string, unknown>)),
    );

    /* Culture has to DO something or it is a scoreboard. */
    check(
      "a good place to work produces more than a bad one",
      productivityFactor(85) > productivityFactor(25),
    );
    check("a bad one makes mistakes", errorRate(20) > 0 && errorRate(80) === 0);
    check(
      "loyalty protects against churn at the same culture",
      churnRate(30, 80) < churnRate(30, 10),
    );
    check(
      "a good place attracts better applicants",
      recruitAppeal(85) > recruitAppeal(30),
    );

    /* Management actions move real numbers, and cost real things. */
    const before = hydrateStaff(m.staff[0]);
    const paid = runCommand(doctor, s, "rewardStaff", m.staff[0].id);
    const after = hydrateStaff(med(paid).staff[0]);
    check(
      "a rise raises morale AND payroll permanently",
      after.morale > before.morale && after.salary > before.salary,
    );

    const warned = runCommand(doctor, s, "warnStaff", m.staff[0].id);
    check(
      "a warning costs morale and shows up in the culture score",
      hydrateStaff(med(warned).staff[0]).morale < before.morale &&
        cultureScore(med(warned), warned.week).score <
          cultureScore(m, s.week).score,
    );

    const promoted = runCommand(doctor, s, "promoteStaff", m.staff[0].id);
    check(
      "a promotion costs the people who did not get it",
      hydrateStaff(med(promoted).staff[0]).lead === true,
    );
  }

  console.log("\nRivals\n" + "─".repeat(52));
  {
    const s = startRun(doctor, 601);
    s.rivals = PHYSICIAN_RIVALS.map(initialRival);
    check(
      "every rival is also a person you have a relationship with",
      (s.rivals ?? []).every((r) => CAST_BY_ID.has(r.id)),
    );
    check(
      "they run different strategies",
      new Set((s.rivals ?? []).map((r) => r.strategy)).size >= 4,
    );

    const before = JSON.stringify(s.rivals);
    const rng = makeRng(42);
    for (let w = 1; w <= 60; w++) {
      s.week = w;
      tickRivals(s, rng, ["lyon", "paris"]);
    }
    check("they progress over time", JSON.stringify(s.rivals) !== before);
    check(
      "and their history stays bounded",
      (s.rivals ?? []).every((r) => r.history.length <= MAX_RIVAL_HISTORY),
    );
    check(
      "some of them are visibly bigger than when they started",
      (s.rivals ?? []).some((r) => r.sites > 1 || r.standing > 60),
    );

    /* Determinism, because the whole point of summarising rather than
       simulating is that it stays testable. */
    const run = (seed: number) => {
      const a = startRun(doctor, 602);
      a.rivals = PHYSICIAN_RIVALS.map(initialRival);
      const r = makeRng(seed);
      for (let w = 1; w <= 40; w++) {
        a.week = w;
        tickRivals(a, r, ["lyon"]);
      }
      return JSON.stringify(a.rivals);
    };
    check("rival progression is deterministic", run(5) === run(5));
    check("and seed-dependent", run(5) !== run(6));

    /* They remember. */
    const s2 = startRun(doctor, 603);
    s2.rivals = PHYSICIAN_RIVALS.map(initialRival);
    s2.week = 20;
    recordContest(s2, "okoro", true, "a contract");
    check(
      "beating one costs you the relationship and gains their respect",
      (personIn(s2, "okoro")?.warmth ?? 0) < 10 &&
        remembers(s2, "okoro", "beaten-by-you"),
    );
    for (let i = 0; i < 8; i++) recordContest(s2, "okoro", true, "another");
    check(
      "enough of that makes an enemy",
      (s2.rivals ?? []).find((r) => r.id === "okoro")?.stance === "enemy",
    );
    check(
      "an enemy bids harder than a stranger",
      rivalBid({ ...initialRival(PHYSICIAN_RIVALS[0]), stance: "enemy" }) >
        rivalBid({ ...initialRival(PHYSICIAN_RIVALS[0]), stance: "neutral" }),
    );
  }

  console.log("\nAssignments\n" + "─".repeat(52));
  {
    check(
      "the catalogue covers every kind the design calls for",
      new Set(MEDICAL_CONTRACTS.map((c) => c.kind)).size ===
        CONTRACT_KINDS.length,
      [...new Set(MEDICAL_CONTRACTS.map((c) => c.kind))].join(", "),
    );
    check(
      "every assignment states a real cost as well as a reward",
      MEDICAL_CONTRACTS.every(
        (c) => c.fee > 0 && c.effort > 0 && c.deadline > 0 && c.difficulty >= 1,
      ),
    );
    check(
      "the grey ones are the ones that carry ethical exposure",
      MEDICAL_CONTRACTS.filter((c) => c.kind === "grey").every(
        (c) => c.ethicalRisk >= 0.5,
      ),
    );
    check(
      "half the catalogue is invisible to a one-room practice",
      MEDICAL_CONTRACTS.filter((c) => !c.requires(startRun(doctor, 604)))
        .length >=
        MEDICAL_CONTRACTS.length / 2,
    );

    const def = CONTRACT_BY_ID.get("c.complex")!;
    const active = startContract(def.id, "lyon", 10, def.deadline);
    const strong = readinessFor(
      startRun(doctor, 605),
      { ...active, progress: def.effort },
      def,
      {
        skill: 90,
        burnout: 10,
        standing: 85,
        staffSkill: 80,
        cityFactor: 1.1,
        culture: 80,
      },
    );
    const weak = readinessFor(
      startRun(doctor, 605),
      { ...active, progress: def.effort },
      def,
      {
        skill: 30,
        burnout: 80,
        standing: 30,
        staffSkill: 0,
        cityFactor: 0.9,
        culture: 30,
      },
    );
    check("preparation beats improvisation", strong.total > weak.total);
    check(
      "and the player can see the working",
      strong.parts.length >= 5 && strong.parts.every((p) => !!p.label),
    );

    /* The core anti-slot-machine rule. */
    const unworked = startContract(def.id, "lyon", 10, def.deadline);
    check(
      "an assignment you never worked fails however good you are",
      !resolveContract(def, unworked, strong, makeRng(1)).won,
    );
    const worked = { ...active, progress: def.effort };
    check(
      "a well-prepared, fully-worked assignment succeeds",
      resolveContract(def, worked, strong, makeRng(1)).won,
    );
    check(
      "an over-reaching one fails",
      !resolveContract(def, worked, weak, makeRng(1)).won,
    );

    /* Complications change the terms, and never on week one. */
    const fresh = startContract(def.id, "lyon", 10, def.deadline);
    check(
      "a complication cannot fire before any work is done",
      rollComplication(def, fresh, 11, makeRng(2)) === null,
    );
    const started = { ...fresh, progress: 2 };
    let fired = null;
    for (let i = 0; i < 200 && !fired; i++) {
      fired = rollComplication(def, started, 15, makeRng(i));
    }
    check("a complication does eventually fire", fired !== null);
    check(
      "and it makes the work harder",
      started.extraDifficulty > 0 &&
        requiredScore(def, started) > requiredScore(def, fresh),
    );
  }

  console.log("\nFinancing\n" + "─".repeat(52));
  {
    const s = startRun(doctor, 606);
    const ctx = {
      netWorth: 400_000,
      weeklyRevenue: 20_000,
      credibility: 60,
      influence: 50,
      ethics: 70,
      investorWarmth: 30,
      partnerWarmth: 40,
    };
    const offers = fundingOffers(s, ctx);
    check(
      "all five financing routes are represented",
      offers.length === FUNDING_KINDS.length,
    );
    check(
      "each one costs something different",
      offers.some((o) => o.rate > 0) &&
        offers.some((o) => o.equity > 0) &&
        offers.some((o) => o.condition),
    );
    check(
      "a blocked route says why rather than vanishing",
      fundingOffers(startRun(doctor, 607), { ...ctx, influence: 5 }).some(
        (o) => o.kind === "grant" && !!o.blocked,
      ),
    );

    /* EXPLOIT: unlimited borrowing. */
    let borrowed = 0;
    for (let i = 0; i < 20; i++) {
      const os = fundingOffers(s, ctx);
      const bank = os.find((o) => o.kind === "bank");
      if (!bank || bank.blocked || bank.amount <= 0) break;
      const took = takeFunding(s, bank);
      if (!took) break;
      borrowed += took.principal;
    }
    check(
      "borrowing is capped by what the business can carry",
      borrowed < 3_000_000,
      `took ${Math.round(borrowed / 1000)}k across repeated attempts`,
    );
    check(
      "and the number of facilities is bounded",
      (s.obligations ?? []).length <= MAX_OBLIGATIONS,
    );

    /* EXPLOIT: selling the same equity twice. */
    const s2 = startRun(doctor, 608);
    for (let i = 0; i < 10; i++) {
      const os = fundingOffers(s2, ctx);
      const inv = os.find((o) => o.kind === "investor");
      if (!inv || inv.blocked) break;
      if (!takeFunding(s2, inv)) break;
    }
    check(
      "you cannot sell control of your own practice",
      equitySold(s2) <= MAX_EQUITY && ownedShare(s2) >= 100 - MAX_EQUITY,
      `sold ${equitySold(s2)}%`,
    );
    check(
      "a second round of the same investor costs more equity",
      (() => {
        const a = startRun(doctor, 609);
        const first = fundingOffers(a, ctx).find((o) => o.kind === "investor")!;
        takeFunding(a, first);
        const second = fundingOffers(a, ctx).find(
          (o) => o.kind === "investor",
        )!;
        return second.equity > first.equity;
      })(),
    );

    /* EXPLOIT: outrunning repayment. Obligations live on the run. */
    const s3 = startRun(doctor, 610);
    s3.r.cash = 500_000;
    takeFunding(
      s3,
      fundingOffers(s3, ctx).find((o) => o.kind === "bank")!,
    );
    const owedBefore = totalOutstanding(s3);
    med(s3).homeCity = "tokyo";
    med(s3).cities = ["tokyo"];
    check(
      "moving city does not clear what you owe",
      totalOutstanding(s3) === owedBefore && owedBefore > 0,
    );

    /* Interest accrues; a facility can be cleared. */
    const before = totalOutstanding(s3);
    s3.week = 5;
    tickFinance(s3);
    check("interest accrues on borrowing", totalOutstanding(s3) > before);
    repay(s3, obligations(s3)[0].id, 10_000_000);
    check("and it can be cleared", totalOutstanding(s3) === 0);

    /* Equity holders take a share of profit, and only of profit. */
    const s4 = startRun(doctor, 611);
    takeFunding(
      s4,
      fundingOffers(s4, ctx).find((o) => o.kind === "investor")!,
    );
    check("a shareholder takes a cut of profit", dividendOn(s4, 100_000) > 0);
    check("but nothing from a loss", dividendOn(s4, -50_000) === 0);
  }

  console.log("\nNews\n" + "─".repeat(52));
  {
    const s = startRun(doctor, 612);
    s.week = 30;
    const markets = {
      lyon: {
        salary: 1.12,
        demand: 0.9,
        regulation: 45,
        sentiment: 38,
        shock: null,
      },
    };
    let withEffect = 0;
    for (let i = 0; i < 60; i++) {
      const item = worldNews(s, makeRng(i), {
        cities: ["lyon"],
        cityName: () => "Lyon",
        markets,
      });
      if (item?.effect) withEffect++;
    }
    check("news items carry real effects", withEffect > 30);
    check(
      "and say what they did",
      (() => {
        const item = worldNews(s, makeRng(1), {
          cities: ["lyon"],
          cityName: () => "Lyon",
          markets,
        });
        return !!item && (!item.effect || item.impact.length > 0);
      })(),
    );
    check(
      "the four channels are distinguishable by scope",
      ["world", "city", "rival", "you"].every((scope) =>
        ["world", "city", "rival", "you"].includes(scope),
      ) &&
        rivalNews(s, "X", { text: "did a thing", kind: "growth" }, makeRng(1))
          .scope === "rival",
    );
  }

  console.log("\nCrises\n" + "─".repeat(52));
  {
    check(
      "every crisis kind has at least three connected beats",
      CRISIS_KINDS.every((k) => CRISIS_STAGES[k].length >= 2) &&
        CRISIS_KINDS.filter((k) => CRISIS_STAGES[k].length >= 3).length >= 5,
    );
    check(
      "every stage offers a real decision, never a dead end",
      CRISIS_KINDS.every((k) =>
        CRISIS_STAGES[k].every(
          (st) => st.choices.length >= 1 && st.title && st.body,
        ),
      ),
    );
    check(
      "choices cost money, time, standing or relationships — not nothing",
      CRISIS_KINDS.every((k) =>
        CRISIS_STAGES[k].every((st) =>
          st.choices.every(
            (c) =>
              !!c.cost ||
              !!c.blocks ||
              !!c.rep ||
              !!c.people ||
              c.severity !== 0,
          ),
        ),
      ),
    );

    /* PREVENTION. */
    const wellRun = crisisRisk({
      week: 60,
      culture: 85,
      ethics: 85,
      risk: 5,
      regulation: 15,
      cashWeeks: 12,
      supplyWeeks: 8,
      staff: 6,
      scrutiny: 5,
    });
    const badlyRun = crisisRisk({
      week: 60,
      culture: 20,
      ethics: 25,
      risk: 60,
      regulation: 60,
      cashWeeks: 0.5,
      supplyWeeks: 0.5,
      staff: 6,
      scrutiny: 70,
    });
    check(
      "running a tight practice makes crises rarer",
      wellRun.chance < badlyRun.chance,
      `${(wellRun.chance * 100).toFixed(1)}% against ${(badlyRun.chance * 100).toFixed(1)}%`,
    );
    check("but never impossible", wellRun.chance > 0);
    check("and the risk names its causes", badlyRun.drivers.length >= 3);

    /* ESCALATION. */
    const c = startCrisis("walkout", 10, 50);
    const start = c.severity;
    for (let i = 0; i < 3; i++) tickCrisis(c);
    check("ignoring a crisis makes it worse", c.severity > start);
    const esc = tickCrisis(c);
    check(
      "and four untouched weeks escalates it to its terminal stage",
      esc.escalated && c.stage === CRISIS_STAGES.walkout.length - 1,
    );

    /* A crisis has to end. Left alone it used to pin at severity 100 and sit
       there for the rest of the run — a probe screenshot caught one still
       "running" sixty weeks after it started. */
    let burned = false;
    for (let i = 0; i < NEGLECT_LIMIT + 2 && !burned; i++) {
      burned = tickCrisis(c).burnedOut;
    }
    check(
      "sustained neglect burns a crisis out rather than freezing it",
      burned,
    );

    /* And two of the same kind never run at once. */
    let dup = startRun(doctor, 620);
    dup.r.cash = 900_000;
    dup = runCommand(doctor, dup, "hire", "nurse");
    dup = runCommand(doctor, dup, "hire", "gp");
    for (let i = 0; i < 120 && !dup.outcome; i++) {
      dup = advanceWeek(doctor, dup, { clinic: 4 }).state;
      dup.r.cash = Math.max(dup.r.cash, 300_000);
      const kinds = (dup.crises ?? []).map((x) => x.kind);
      if (new Set(kinds).size !== kinds.length) break;
    }
    check(
      "two crises of the same kind never run at once",
      (() => {
        const kinds = (dup.crises ?? []).map((x) => x.kind);
        return new Set(kinds).size === kinds.length;
      })(),
    );

    /* MITIGATION and RECOVERY. */
    const s = startRun(doctor, 613);
    s.r.cash = 900_000;
    s.crises = [startCrisis("walkout", s.week, 60)];
    const sev0 = s.crises[0].severity;
    const after = runCommand(
      doctor,
      s,
      "crisisChoice",
      `${s.crises[0].id}:listen`,
    );
    check(
      "acting on it reduces the severity",
      (after.crises ?? [])[0].severity < sev0,
    );
    check(
      "and resets the neglect counter",
      (after.crises ?? [])[0].ignored === 0,
    );
    const twice = runCommand(
      doctor,
      after,
      "crisisChoice",
      `${after.crises![0].id}:listen`,
    );
    check(
      "the same choice cannot be taken twice",
      (twice.crises ?? [])[0].severity === (after.crises ?? [])[0].severity,
    );
    check(
      "a crisis choice moves the people it should",
      (personIn(after, "mbeki")?.warmth ?? -99) >
        (personIn(s, "mbeki")?.warmth ?? 0) ||
        personIn(s, "mbeki") === undefined,
    );
  }

  console.log("\nPhase 2 saves\n" + "─".repeat(52));
  {
    /* A genuine v9 save: the engine's output with every v10 field removed. */
    const v9 = JSON.parse(JSON.stringify(startRun(doctor, 614))) as Record<
      string,
      unknown
    >;
    for (const k of [
      "rivals",
      "offers",
      "contracts",
      "contractLog",
      "obligations",
      "news",
      "crises",
    ]) {
      delete v9[k];
    }
    const up = migrateRun(JSON.parse(JSON.stringify(v9)));
    check("a v9 save is migrated forward", up !== null && validateRun(up));
    check(
      "with empty collections rather than invented history",
      Array.isArray(up!.news) &&
        (up!.news as unknown[]).length === 0 &&
        Array.isArray(up!.rivals) &&
        (up!.rivals as unknown[]).length === 0,
    );
    check(
      "migration is still idempotent at v10",
      JSON.stringify(migrateRun(JSON.parse(JSON.stringify(up)))) ===
        JSON.stringify(up),
    );

    const bad = (mutate: (s: Record<string, unknown>) => void) => {
      const copy = JSON.parse(JSON.stringify(startRun(doctor, 615)));
      copy.rivals = PHYSICIAN_RIVALS.map(initialRival);
      mutate(copy);
      return validateRun(copy);
    };
    check(
      "the unmutated v10 save is accepted",
      bad(() => {}),
    );
    check(
      "a rival with an unknown strategy is rejected",
      !bad((s) => {
        (s.rivals as Record<string, unknown>[])[0].strategy = "vibing";
      }),
    );
    check(
      "a rival with an unknown stance is rejected",
      !bad((s) => {
        (s.rivals as Record<string, unknown>[])[0].stance = "besties";
      }),
    );
    check(
      "an over-long rival history is rejected",
      !bad((s) => {
        (s.rivals as Record<string, unknown>[])[0].history = Array.from(
          { length: MAX_RIVAL_HISTORY + 5 },
          () => ({ week: 1, text: "x", kind: "growth" }),
        );
      }),
    );
    check(
      "a contract with no due week is rejected",
      !bad((s) => {
        (s.contracts as unknown[]).push({
          defId: "x",
          city: "lyon",
          acceptedWeek: 1,
          progress: 0,
          extraDifficulty: 0,
          payFactor: 1,
          assigned: [],
          complications: [],
        });
      }),
    );
    check(
      "an obligation with an unknown kind is rejected",
      !bad((s) => {
        (s.obligations as unknown[]).push({
          id: "x",
          kind: "loan-shark",
          principal: 1,
          outstanding: 1,
          rate: 0,
          weekly: 0,
          equity: 0,
          week: 1,
          missed: 0,
          settled: false,
        });
      }),
    );
    check(
      "a save that has sold control is rejected",
      !bad((s) => {
        (s.obligations as unknown[]).push({
          id: "x",
          kind: "investor",
          principal: 1,
          outstanding: 0,
          rate: 0,
          weekly: 0,
          equity: 80,
          week: 1,
          missed: 0,
          settled: false,
        });
      }),
    );
    check(
      "a crisis with an unknown kind is rejected",
      !bad((s) => {
        (s.crises as unknown[]).push({
          id: "x",
          kind: "aliens",
          startedWeek: 1,
          severity: 10,
          stage: 0,
          taken: [],
          ignored: 0,
        });
      }),
    );
    check(
      "an over-long news list is rejected",
      !bad((s) => {
        s.news = Array.from({ length: MAX_WORLD_NEWS + 5 }, (_, i) => ({
          id: `n${i}`,
          week: 1,
          scope: "world",
          outlet: "o",
          headline: "h",
          body: "b",
          tone: "neutral",
          impact: "",
        }));
      }),
    );
  }

  console.log("\nPerformance and bounds\n" + "─".repeat(52));
  {
    let s = startRun(doctor, 616);
    s.r.cash = 3_000_000;
    s = runCommand(doctor, s, "hire", "nurse");
    const t0 = process.hrtime.bigint();
    let weeks = 0;
    for (let i = 0; i < 156 && !s.outcome; i++) {
      for (const o of [...(s.offers ?? [])]) {
        s = runCommand(doctor, s, "acceptContract", o.defId);
      }
      s = advanceWeek(doctor, s, { clinic: 3, casework: 1, people: 1 }).state;
      weeks++;
      if (s.r.cash < 50_000) s.r.cash = 400_000;
    }
    const perWeek =
      Number(process.hrtime.bigint() - t0) / 1e6 / Math.max(1, weeks);
    check(
      "a week still resolves quickly with every system running",
      perWeek < 25,
      `${perWeek.toFixed(2)}ms per week over ${weeks} weeks`,
    );

    check("news stays bounded", (s.news ?? []).length <= MAX_WORLD_NEWS);
    check(
      "rival histories stay bounded",
      (s.rivals ?? []).every((r) => r.history.length <= MAX_RIVAL_HISTORY),
    );
    check(
      "the contract log stays bounded",
      (s.contractLog ?? []).length <= MAX_CONTRACT_HISTORY,
    );
    check("offers stay bounded", (s.offers ?? []).length <= MAX_OFFERS);
    check(
      "live assignments stay bounded",
      (s.contracts ?? []).length <= MAX_ACTIVE,
    );
    check("open crises stay bounded", (s.crises ?? []).length <= MAX_CRISES);
    check(
      "a full run's save stays a sensible size",
      JSON.stringify(s).length < 400_000,
      `${Math.round(JSON.stringify(s).length / 1024)}kB`,
    );

    /* Inactive entities must not be re-simulated. A rival between moves does
       a handful of arithmetic operations, not a game turn. */
    const rs = startRun(doctor, 617);
    rs.rivals = PHYSICIAN_RIVALS.map(initialRival);
    rs.week = 2;
    const t1 = process.hrtime.bigint();
    for (let i = 0; i < 10_000; i++) tickRivals(rs, makeRng(i), ["lyon"]);
    const perTick = Number(process.hrtime.bigint() - t1) / 1e6 / 10_000;
    check(
      "ticking every rival costs almost nothing",
      perTick < 0.1,
      `${(perTick * 1000).toFixed(1)}µs for five rivals`,
    );
  }

  console.log("\nEverything talks to everything\n" + "─".repeat(52));
  {
    /* The completion criterion that matters: these are not seven parallel
       systems, they are one. Each assertion below crosses a boundary. */
    let s = startRun(doctor, 618);
    s.r.cash = 2_000_000;
    s = runCommand(doctor, s, "hire", "nurse");
    s = runCommand(doctor, s, "hire", "gp");
    for (let i = 0; i < 40 && !s.outcome; i++) {
      s = advanceWeek(doctor, s, { clinic: 3, people: 1, manage: 1 }).state;
      s.r.cash = Math.max(s.r.cash, 600_000);
    }
    check(
      "rivals are seeded into a running game",
      (s.rivals ?? []).length === PHYSICIAN_RIVALS.length,
    );
    check(
      "markets exist for the cities you operate in",
      Object.keys(med(s).markets ?? {}).length >= 1,
    );
    check("the world produces news", (s.news ?? []).length > 0);
    check(
      "and rival activity reaches the player as news",
      (s.news ?? []).some((n) => n.scope === "rival"),
    );
    check(
      "culture is affecting output",
      productivityFactor(cultureScore(med(s), s.week).score) !== 1 ||
        cultureScore(med(s), s.week).score === 50,
    );
    check(
      "staff carry the deeper record after real play",
      med(s).staff.every((x) => {
        const h = hydrateStaff(x);
        return Number.isFinite(h.morale) && Number.isFinite(h.workload);
      }),
    );
    check(
      "financing is offered against the business you built",
      fundingOffers(s, {
        netWorth: 500_000,
        weeklyRevenue: 15_000,
        credibility: s.r.reputation,
        influence: s.r.repInfluence ?? 20,
        ethics: s.r.repEthics ?? 70,
        investorWarmth: 30,
        partnerWarmth: 30,
      }).some((o) => !o.blocked && o.amount > 0),
    );
    check(
      "the whole thing still validates",
      validateRun(JSON.parse(JSON.stringify(s))),
    );
  }
}

// --- phase 3: the sandbox --------------------------------------------------
{
  console.log("\nNothing ends a run\n" + "─".repeat(52));
  {
    /*
     * The single most important assertion in this file.
     *
     * Four automatic terminators and a week limit were removed; this is what
     * stops any of them coming back. A run played far past the old 156-week
     * limit, through every condition that used to be fatal, must still be
     * playable.
     */
    let s = startRun(doctor, 900);
    for (let i = 0; i < 320 && !s.retired; i++) {
      s = advanceWeek(doctor, s, { clinic: 3, rest: 1 }).state;
    }
    check(
      "a run continues far past the old week limit",
      s.week > 300 && !s.outcome && !s.retired,
      `week ${s.week}, outcome ${s.outcome ? "SET" : "none"}`,
    );

    /* Each old terminator, individually. */
    const survives = (mutate: (x: typeof s) => void, name: string) => {
      let t = startRun(doctor, 901);
      mutate(t);
      t = advanceWeek(doctor, t, { rest: 1 }).state;
      check(`${name} no longer ends the run`, !t.outcome && !t.retired);
      return t;
    };
    survives((t) => (t.r.burnout = 100), "collapse");
    survives((t) => (t.r.strikes = 3), "losing three claims");
    survives((t) => (t.r.cash = -200_000), "deep insolvency");
    survives((t) => (t.r.repEthics = 0), "an ethical collapse");

    /* And the old win condition. */
    let won = startRun(doctor, 902);
    won.r.debt = 0;
    won.r.cash = 5_000_000;
    won = advanceWeek(doctor, won, { rest: 1 }).state;
    check(
      "reaching the old goal is a milestone, not an ending",
      !won.outcome && hasMilestone(won, "the-hospital-is-yours"),
    );

    check(
      "the career no longer exposes a way to end a run",
      !("checkOutcome" in doctor),
    );
  }

  console.log("\nSetbacks and recovery\n" + "─".repeat(52));
  {
    /*
     * Working while already at the ceiling is what collapses you.
     *
     * The peak is recorded after the week's actions and before its recovery,
     * which means resting at 100 genuinely pulls you back from the brink —
     * the player acting at the last moment is supposed to work. So this test
     * spends the week in clinic, which is the version that does not.
     */
    let s = startRun(doctor, 903);
    s.r.burnout = 100;
    s = advanceWeek(doctor, s, { clinic: 1 }).state;
    check("working through the ceiling collapses you", has(s, "collapse"));
    check(
      "but resting at the ceiling does not",
      (() => {
        let t = startRun(doctor, 9031);
        t.r.burnout = 100;
        t = advanceWeek(doctor, t, { rest: 2 }).state;
        return !has(t, "collapse");
      })(),
    );
    check(
      "which costs you real capacity",
      setbackEffects(s.setbacks ?? []).blocks < 1 &&
        doctor.timeBudget(s) < doctor.timeBudget(startRun(doctor, 904)),
    );
    check("but never all of it", doctor.timeBudget(s) >= 1);

    /* A suspension stops YOU working without closing the business — the
       distinction that makes it a setback rather than a loss. */
    let sus = startRun(doctor, 905);
    sus.r.strikes = 3;
    sus = advanceWeek(doctor, sus, { rest: 1 }).state;
    check("a suspension stops you practising", !canPractise(sus));
    check(
      "but the organisation keeps running",
      setbackEffects(sus.setbacks ?? []).income > 0.3,
    );

    /* Recovery is work, not waiting. */
    const grip0 = sus.setbacks![0].grip;
    sus.r.cash = 500_000;
    sus = runCommand(doctor, sus, "recoverSetback", "suspension:remediation");
    check("a recovery step reduces the grip", sus.setbacks![0].grip < grip0);
    const grip1 = sus.setbacks![0].grip;
    sus = runCommand(doctor, sus, "recoverSetback", "suspension:remediation");
    check(
      "the same step cannot be taken twice",
      sus.setbacks![0].grip === grip1,
    );
    check(
      "a step you do not qualify for does nothing",
      (() => {
        const poor = startRun(doctor, 906);
        poor.r.strikes = 3;
        const t = advanceWeek(doctor, poor, { rest: 1 }).state;
        t.r.cash = 100;
        const before = t.setbacks![0].grip;
        const after = runCommand(
          doctor,
          t,
          "recoverSetback",
          "suspension:remediation",
        );
        return after.setbacks![0].grip === before;
      })(),
    );

    /* And it completes. */
    let rec = startRun(doctor, 907);
    rec.r.cash = -200_000;
    rec = advanceWeek(doctor, rec, { rest: 1 }).state;
    check("insolvency begins", has(rec, "insolvency"));
    rec.r.cash = 800_000;
    for (let i = 0; i < 200 && (rec.setbacks ?? []).length > 0; i++) {
      for (const sb of [...(rec.setbacks ?? [])]) {
        const step = (RECOVERY[sb.kind] ?? []).find(
          (x) => !sb.done.includes(x.id) && x.available(rec),
        );
        if (step)
          rec = runCommand(
            doctor,
            rec,
            "recoverSetback",
            `${sb.kind}:${step.id}`,
          );
      }
      rec = advanceWeek(doctor, rec, { rest: 1 }).state;
      rec.r.cash = Math.max(rec.r.cash, 400_000);
    }
    check("and it can be climbed out of", (rec.setbacks ?? []).length === 0);
    check(
      "the run records that you survived it",
      (rec.setbacksSurvived ?? []).includes("insolvency"),
    );
    check("and the run is still playable", !rec.outcome && !rec.retired);
    check(
      "with a timeline entry for the comeback",
      timelineOf(rec).some((t) => t.kind === "recovery"),
    );

    check(
      "no more than two setbacks at once",
      (() => {
        let t = startRun(doctor, 908);
        t.r.burnout = 100;
        t.r.strikes = 3;
        t.r.cash = -200_000;
        t.r.repEthics = 0;
        t = advanceWeek(doctor, t, { rest: 1 }).state;
        return (t.setbacks ?? []).length <= MAX_SETBACKS;
      })(),
    );
  }

  console.log("\nBackgrounds\n" + "─".repeat(52));
  {
    check("there are several to choose from", BACKGROUNDS.length >= 7);
    check(
      "each states both a benefit and a cost",
      BACKGROUNDS.every((b) => !!b.benefit && !!b.cost && !!b.blurb),
    );
    /* "Worse" is not the same as "negative": debt, burnout and risk are all
       lower-better, so a background that hands you ninety-five thousand of
       student debt is making your life harder with a positive number. */
    const LOWER_IS_WORSE = new Set(["debt", "burnout", "risk", "strikes"]);
    check(
      "none is a pure upgrade — every one costs you something",
      BACKGROUNDS.every(
        (b) =>
          Object.entries(b.resources).some(([k, v]) =>
            LOWER_IS_WORSE.has(k) ? v > 0 : v < 0,
          ) ||
          b.relationships.some(
            (r) =>
              (r.warmth ?? 0) < 0 || (r.respect ?? 0) < 0 || (r.trust ?? 0) < 0,
          ),
      ),
    );
    check(
      "each starts you with personality",
      BACKGROUNDS.every((b) => b.traits.length >= 1),
    );
    check(
      "and its own events",
      BACKGROUNDS.every((b) => b.events.length >= 2) &&
        new Set(BACKGROUNDS.flatMap((b) => b.events)).size ===
          BACKGROUNDS.flatMap((b) => b.events).length,
    );

    const rich = startRun(doctor, 910, { background: "wealthy" });
    const poor = startRun(doctor, 910, { background: "indebted" });
    check(
      "a background actually changes the opening",
      rich.r.cash !== poor.r.cash && rich.r.debt !== poor.r.debt,
      `wealthy ${Math.round(rich.r.cash)}/${Math.round(rich.r.debt)} vs indebted ${Math.round(poor.r.cash)}/${Math.round(poor.r.debt)}`,
    );
    check(
      "and who already has an opinion of you",
      (personIn(rich, "hallam")?.warmth ?? 0) !==
        (personIn(poor, "hallam")?.warmth ?? 0),
    );
    check(
      "it is recorded in the timeline",
      hasMilestone(rich, "background") && rich.background === "wealthy",
    );
    check(
      "a background's events are gated to that background",
      fromBackground(rich, "bg.wealthy.favour") &&
        !fromBackground(poor, "bg.wealthy.favour"),
    );
  }

  console.log("\nPersonality\n" + "─".repeat(52));
  {
    const s = startRun(doctor, 911, { background: "prodigy" });
    check(
      "a background fixes two traits",
      (s.traits ?? []).length === 2 && hasTrait(s, "analytical"),
    );
    check(
      "traits cannot simply be chosen",
      !("setTrait" in doctor) && typeof checkTraits === "function",
    );

    /* Earned by behaviour, over time. */
    const t = startRun(doctor, 912);
    check("nothing is held at the start", (t.traits ?? []).length === 0);
    for (let i = 0; i < 30; i++) noteBehaviour(t, "_actDiscipline");
    const gained = checkTraits(t);
    check(
      "repeated behaviour earns a trait",
      gained.some((g) => g.id === "disciplined") && hasTrait(t, "disciplined"),
    );

    /* And cannot be un-earned or farmed. */
    for (let i = 0; i < 200; i++) noteBehaviour(t, "_actRuthless");
    for (let i = 0; i < 200; i++) noteBehaviour(t, "_actCharisma");
    for (let i = 0; i < 200; i++) noteBehaviour(t, "_actEmpathy");
    for (let i = 0; i < 200; i++) noteBehaviour(t, "_actAnalysis");
    for (let i = 0; i < 200; i++) noteBehaviour(t, "_actCreative");
    checkTraits(t);
    checkTraits(t);
    check("you cannot become everything", (t.traits ?? []).length <= TRAIT_CAP);
    check("and a trait is never removed", hasTrait(t, "disciplined"));

    /* Every trait has a downside somewhere. */
    check(
      "each trait carries a stated friction",
      TRAITS.every((x) => !!x.friction && !!x.unlocks && !!x.earnedBy),
    );
    const ruth = startRun(doctor, 913);
    ruth.traits = ["ruthless"];
    const kind = startRun(doctor, 914);
    kind.traits = ["empathetic"];
    check(
      "ruthlessness costs you loyalty where empathy earns it",
      loyaltyDrift(ruth) < 0 && loyaltyDrift(kind) > 0,
    );
    check("and it costs ethics every week", ethicsDrift(ruth) < 0);
    check(
      "discipline slows burnout; ambition speeds it",
      burnoutFactor({ ...ruth, traits: ["disciplined"] } as never) <
        burnoutFactor({ ...ruth, traits: ["ambitious"] } as never),
    );
    check(
      "analysis helps prepared work and hurts opportunistic work",
      preparationFactor({ ...ruth, traits: ["analytical"] } as never) > 1 &&
        opportunismFactor({ ...ruth, traits: ["analytical"] } as never) < 1,
    );
  }

  console.log("\nAmbitions\n" + "─".repeat(52));
  {
    const s = startRun(doctor, 915);
    check("several to choose between", AMBITIONS.length >= 7);
    check(
      "each states what it costs you to chase",
      AMBITIONS.every((a) => !!a.tension && !!a.blurb),
    );
    check(
      "none is chosen for you",
      s.ambition === null || s.ambition === undefined,
    );

    setAmbition(s, "independent");
    check("one can be chosen", s.ambition === "independent");
    check(
      "progress is a number in range",
      (() => {
        const p = AMBITION_BY_ID.get("independent")!.progress(s);
        return p >= 0 && p <= 1;
      })(),
    );

    /* Completing one must NOT end the run — the whole point. */
    const done = startRun(doctor, 916);
    setAmbition(done, "independent");
    done.r._netWorth = 10_000_000;
    done.r._equitySold = 0;
    done.r.debt = 0;
    const fired = checkAmbition(done);
    check("an ambition can be met", fired?.id === "independent");
    check("meeting it does not end the run", !done.outcome && !done.retired);
    check("and it frees you to pick another", done.ambition === null);
    check(
      "the completed one is remembered",
      (done.ambitionsDone ?? []).includes("independent"),
    );
    check(
      "and cannot be re-selected",
      (() => {
        setAmbition(done, "independent");
        return done.ambition === null;
      })(),
    );
  }

  console.log("\nRetirement\n" + "─".repeat(52));
  {
    let s = startRun(doctor, 917, { background: "working" });
    s.r.cash = 1_200_000;
    for (let i = 0; i < 30; i++) {
      s = advanceWeek(doctor, s, { clinic: 3, rest: 1 }).state;
      s.r.cash = Math.max(s.r.cash, 400_000);
    }

    const summary = retirementSummary(s, {
      careerLabel: "Physician",
      name: "Dr Test",
      backgroundLabel: "Working-class family",
      path: null,
      netWorth: 900_000,
      cities: ["Lyon"],
      businesses: 2,
    });
    check("building a summary changes nothing", !s.retired && !s.outcome);
    check(
      "the summary reads the real career",
      summary.archive.weeks === s.week &&
        summary.archive.reputation.length === REPUTATIONS.length &&
        summary.highlights.length >= 2,
    );
    check(
      "milestones in the summary come from the timeline",
      summary.archive.milestones.every((mm) =>
        timelineOf(s).some((t) => t.title === mm.title),
      ),
    );

    /* The cancel path. */
    const untouched = JSON.stringify(s);
    retirementSummary(s, {
      careerLabel: "Physician",
      name: "Dr Test",
      backgroundLabel: "Working-class family",
      path: null,
      netWorth: 900_000,
      cities: ["Lyon"],
      businesses: 2,
    });
    check(
      "looking at it twice still changes nothing",
      JSON.stringify(s) === untouched,
    );

    /* The confirm path. */
    const archived = retire(s, summary, "Enough.");
    check("retiring marks the run retired", s.retired === true);
    check("and produces an archive record", archived.name === "Dr Test");
    check("carrying the note", archived.retiredNote === "Enough.");
    check(
      "the archive record does not invent anything",
      archived.weeks === s.week && archived.netWorth === 900_000,
    );

    check(
      "retirement is never reached by the simulation",
      (() => {
        let t = startRun(doctor, 918);
        for (let i = 0; i < 260; i++)
          t = advanceWeek(doctor, t, { clinic: 2 }).state;
        return !t.retired;
      })(),
    );
  }

  console.log("\nLegacy\n" + "─".repeat(52));
  {
    const base = {
      id: "x",
      careerId: "doctor",
      careerLabel: "Physician",
      name: "Dr Past",
      backgroundId: null,
      backgroundLabel: "—",
      traits: [],
      path: null,
      weeks: 100,
      cities: ["Lyon"],
      businesses: 1,
      netWorth: 100_000,
      reputation: REPUTATIONS.map((r) => ({
        id: r.id,
        label: r.label,
        value: 40,
      })),
      overall: 40,
      relationships: [],
      milestones: [],
      setbacksSurvived: [],
      ambitionsCompleted: [],
      retiredNote: "",
      retiredWeek: 100,
    };

    const rich = legacyFor({ ...base, netWorth: 5_000_000 });
    check("a wealthy career leaves capital", rich?.kind === "capital");
    const influential = legacyFor({
      ...base,
      reputation: base.reputation.map((r) =>
        r.id === "influence" ? { ...r, value: 80 } : r,
      ),
    });
    check("an influential one leaves a mentor", influential?.kind === "mentor");
    check(
      "a short unremarkable one leaves nothing",
      legacyFor({ ...base, weeks: 10 }) === null,
    );

    /* The balance requirement: modest. */
    const grant = grantFor(rich!);
    const withLegacy = startRun(doctor, 919, { legacy: grant });
    const without = startRun(doctor, 919);
    const gap = withLegacy.r.cash - without.r.cash;
    check(
      "a legacy is small against the starting position",
      gap > 0 && gap <= 40_000,
      `${Math.round(gap)} extra on ${Math.round(without.r.cash)} starting cash`,
    );
    check(
      "and it does not clear the debt or hand over a business",
      withLegacy.r.debt === without.r.debt,
    );
    check(
      "it is recorded in the new character's timeline",
      hasMilestone(withLegacy, "legacy"),
    );
    check(
      "starting without one is allowed",
      without.legacy === undefined || without.legacy === null,
    );

    /* Nothing is copied wholesale. */
    check(
      "no assets, staff or cities are inherited",
      med(withLegacy).staff.length === med(without).staff.length &&
        med(withLegacy).cities.length === med(without).cities.length &&
        med(withLegacy).facilities.length === med(without).facilities.length,
    );
  }

  console.log("\nPhase 3 saves\n" + "─".repeat(52));
  {
    const v10 = JSON.parse(JSON.stringify(startRun(doctor, 920))) as Record<
      string,
      unknown
    >;
    for (const k of [
      "setbacks",
      "setbacksSurvived",
      "ambitionsDone",
      "traits",
      "retired",
    ]) {
      delete v10[k];
    }
    const up = migrateRun(JSON.parse(JSON.stringify(v10)));
    check("a v10 save migrates forward", up !== null && validateRun(up));
    check(
      "and gains empty sandbox collections",
      Array.isArray(up!.setbacks) && (up!.setbacks as unknown[]).length === 0,
    );

    /*
     * The semantic migration: a v10 run that the OLD terminators had already
     * ended is un-resumable, so it becomes what it always was — a finished
     * character.
     */
    const ended = {
      ...v10,
      outcome: { kind: "lost", title: "Administration", body: "…" },
    };
    const migrated = migrateRun(JSON.parse(JSON.stringify(ended)));
    check(
      "an old terminated run is treated as a retired character",
      migrated?.retired === true,
    );
    const playing = migrateRun(JSON.parse(JSON.stringify(v10)));
    check("an old run still in play is not", playing?.retired === false);
    check(
      "migration is still idempotent at v11",
      JSON.stringify(migrateRun(JSON.parse(JSON.stringify(up)))) ===
        JSON.stringify(up),
    );

    const bad = (mutate: (x: Record<string, unknown>) => void) => {
      const copy = JSON.parse(JSON.stringify(startRun(doctor, 921)));
      mutate(copy);
      return validateRun(copy);
    };
    check(
      "the unmutated v11 save is accepted",
      bad(() => {}),
    );
    check(
      "an unknown setback kind is rejected",
      !bad((x) => {
        (x.setbacks as unknown[]).push({
          kind: "ennui",
          startedWeek: 1,
          grip: 10,
          weeks: 1,
          done: [],
        });
      }),
    );
    check(
      "an unknown trait is rejected",
      !bad((x) => {
        x.traits = ["telepathic"];
      }),
    );
    check(
      "too many traits are rejected",
      !bad((x) => {
        x.traits = [
          "ambitious",
          "charismatic",
          "analytical",
          "empathetic",
          "creative",
          "disciplined",
        ];
      }),
    );
    check(
      "an unknown ambition is rejected",
      !bad((x) => {
        x.ambition = "become-a-wizard";
      }),
    );
    check(
      "an unknown background is rejected",
      !bad((x) => {
        x.background = "royalty";
      }),
    );
    check(
      "too many setbacks are rejected",
      !bad((x) => {
        x.setbacks = SETBACK_KINDS.map((k) => ({
          kind: k,
          startedWeek: 1,
          grip: 10,
          weeks: 1,
          done: [],
        }));
      }),
    );
  }

  console.log("\nLong-duration stability\n" + "─".repeat(52));
  {
    /*
     * The endless late game has to actually be endless. Five hundred weeks —
     * more than three times the old limit — checking for the specific failure
     * modes the brief names.
     */
    let s = startRun(doctor, 922, {
      background: "changer",
      ambition: "empire",
    });
    s.r.cash = 400_000;
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < 500; i++) {
      s = advanceWeek(doctor, s, { clinic: 3, people: 1, exercise: 1 }).state;
      if (s.r.cash < 30_000) s.r.cash = 250_000;
    }
    const perWeek = Number(process.hrtime.bigint() - t0) / 1e6 / 500;

    check("five hundred weeks still resolve", s.week > 500 && !s.outcome);
    check(
      "and stay fast",
      perWeek < 25,
      `${perWeek.toFixed(2)}ms/week at week ${s.week}`,
    );
    check(
      "every number is still a number",
      Object.values(s.r).every(Number.isFinite),
    );
    check(
      "nothing has overflowed",
      Object.values(s.r).every((v) => Math.abs(v) < Number.MAX_SAFE_INTEGER),
    );
    check(
      "history stays bounded",
      (s.timeline ?? []).length <= 120 &&
        (s.news ?? []).length <= 30 &&
        s.log.length <= 120 &&
        (s.history ?? []).length <= 200,
    );
    check(
      "the save stays a workable size",
      JSON.stringify(s).length < 500_000,
      `${Math.round(JSON.stringify(s).length / 1024)}kB after 500 weeks`,
    );
    check(
      "rival histories stay bounded over a very long run",
      (s.rivals ?? []).every((r) => r.history.length <= 12),
    );
    check("and it is still not retired", !s.retired);
  }
}

/* ================================================================= visuals */

/**
 * THE DIAGRAMS MUST BE THE SIMULATION
 *
 * Every visual added in the visual-communication phase claims to explain the
 * medical simulation. A diagram that is merely *near* the truth is worse than
 * no diagram, because a player will plan against it — so each of these asserts
 * the visual's own arithmetic against the engine's, on a state produced by
 * actually playing weeks rather than on a hand-written fixture.
 */
console.log("\nVisual communication\n" + "─".repeat(52));
{
  /* A real mid-run state: enough weeks that patients are being turned away for
     several different reasons at once, which is the case the funnel has to get
     right. */
  let v = startRun(doctor, 4242);
  v.r.cash = 400_000;
  v = run(v, "buyFacility", "clinic:lyon");
  v = run(v, "openDepartment", "cardiology");
  v = run(v, "openDepartment", "dermatology");
  v = run(v, "hire", "gp");
  v = run(v, "hire", "nurse");
  for (let i = 0; i < 12; i++) {
    v = advanceWeek(doctor, v, { clinic: 3, manage: 1, rest: 2 }).state;
  }

  const vm = med(v);

  // --- patient flow ------------------------------------------------------
  const flow = patientFlow(vm);
  check("the patient funnel has data after a dozen weeks", flow.hasData);
  check(
    "patient-flow totals match the simulation",
    flow.arrived === vm.lastCases.reduce((n, c) => n + c.arrived, 0) &&
      flow.treated === vm.lastCases.reduce((n, c) => n + c.treated, 0) &&
      flow.succeeded === vm.lastCases.reduce((n, c) => n + c.succeeded, 0),
    `${flow.arrived} arrived / ${flow.treated} treated`,
  );
  check(
    "blocked-patient reasons sum to the patients not treated",
    flowIsConsistent(flow),
    `drops ${flow.drops.reduce((n, d) => n + d.count, 0)} vs turned away ${flow.turnedAway}`,
  );
  check(
    "the funnel never widens",
    flow.arrived >= flow.reachedDepartment &&
      flow.reachedDepartment >= flow.reachedResources &&
      flow.reachedResources >= flow.treated,
  );
  check(
    "every drop names a reason and somewhere to go",
    flow.drops.every((d) => d.reason.length > 20 && !!d.destination),
  );
  check(
    "each drop's departments sum to its own count",
    flow.drops.every(
      (d) => d.departments.reduce((n, x) => n + x.count, 0) === d.count,
    ),
  );

  // --- capacity ----------------------------------------------------------
  for (const blocks of [0, 1, 3, 6]) {
    check(
      `capacity breakdown matches the engine at ${blocks} clinic block${blocks === 1 ? "" : "s"}`,
      pipelineMatchesEngine(v, blocks),
    );
  }
  const pipe = capacityPipeline(v, 3);
  check(
    "the pipeline names exactly one binding limit",
    pipe.rows.filter((r) => r.kind === "limit" && r.binding).length === 1,
  );
  check(
    "the binding limit agrees with min(space, people)",
    pipe.limitedBy === (pipe.space < pipe.people ? "space" : "people"),
  );
  check(
    "the binding sentence names a screen that exists",
    pipe.bindingLabel.length > 20 && !!pipe.bindingDestination,
  );
  check(
    "every capacity row carries a display string and an explanation",
    pipe.rows.every((r) => r.display.length > 0 && r.detail.length > 20),
  );

  // --- departments -------------------------------------------------------
  check(
    "every department has a visual identity",
    DEPARTMENTS.length === SPECIALTIES.length &&
      DEPARTMENTS.every((d) => !!d.icon && !!d.colour && d.purpose.length > 10),
  );
  check(
    "every department icon exists in the symbol family",
    DEPARTMENTS.every((d) => MED_ICON_NAMES.includes(d.icon)),
  );
  check(
    "no department colour collides with a semantic colour",
    DEPARTMENTS.every(
      (d) =>
        !["#EF6461", "#F59E55", "#43C78B", "#2DD4BF"].includes(
          d.colour.toUpperCase(),
        ),
    ),
  );
  check(
    "department colours are all distinct",
    new Set(DEPARTMENTS.map((d) => d.colour)).size === DEPARTMENTS.length,
  );
  check(
    "department facts are derived, not empty",
    DEPARTMENTS.every(
      (d) => d.cases.length > 0 && d.maxSeverity >= 1 && d.unitsPerCase > 0,
    ),
  );

  // --- coverage ----------------------------------------------------------
  const cover = departmentCoverage(vm);
  check(
    "coverage is reported for every department",
    cover.length === SPECIALTIES.length,
  );
  check(
    "coverage matches the resolver's own ceiling",
    cover.every((c) => c.covered === coverageFor(vm, c.id)),
  );
  check(
    "an open department with full cover is never marked uncovered",
    cover.every(
      (c) =>
        !c.open ||
        c.covered < c.needed ||
        c.missingEquipment.length > 0 ||
        c.level === "covered",
    ),
  );
  check(
    "every coverage row explains itself in a sentence",
    cover.every((c) => c.note.length > 20),
  );

  // --- finance -----------------------------------------------------------
  const fin = weeklyFinance(v);
  check(
    "the waterfall's net is its own lines added up",
    Math.abs(
      fin.net - [...fin.income, ...fin.costs].reduce((n, l) => n + l.amount, 0),
    ) < 1e-6,
  );
  check(
    "fixed plus variable is the whole cost side",
    Math.abs(fin.fixed + fin.variable + fin.totalCost) < 1e-6,
  );
  check(
    "payroll in the waterfall is the payroll the engine charges",
    Math.abs(
      (fin.costs.find((l) => l.id === "payroll")?.amount ?? 0) + payroll(vm),
    ) < 1e-6,
  );
  check(
    "the chart always carries a textual summary",
    fin.summary.length > 30,
    fin.summary,
  );
  check(
    "every money line says what it is",
    [...fin.income, ...fin.costs].every((l) => l.detail.length > 20),
  );

  // --- standing ----------------------------------------------------------
  const rows = standingRows(v, 12);
  check("standing reports all six categories", rows.length === 6);
  check(
    "each standing trend ends at the current value",
    rows.every((r) => Math.abs(r.trend[r.trend.length - 1] - r.value) < 1e-9),
  );
  check(
    "each standing category says what it does and how to raise it",
    rows.every((r) => r.guide.effect.length > 40 && r.guide.route.length > 30),
  );
  check(
    "each standing icon exists in the symbol family",
    rows.every((r) => MED_ICON_NAMES.includes(r.guide.icon)),
  );

  // --- crises ------------------------------------------------------------
  check(
    "every crisis kind has a cause, an escalation rule and an affected party",
    CRISIS_KINDS.every((k) => {
      const g = CRISIS_GUIDE[k];
      return (
        !!g &&
        g.cause.length > 30 &&
        g.worsens.length > 40 &&
        g.affects.length > 20 &&
        MED_ICON_NAMES.includes(g.icon)
      );
    }),
  );
  check(
    "crisis progress reports the authored number of stages",
    CRISIS_KINDS.every(
      (k) => crisisProgress(k, 0, 0).stagesTotal === CRISIS_STAGES[k].length,
    ),
  );

  // --- the registry ------------------------------------------------------
  const everyVisual: {
    src: string;
    width: number;
    height: number;
    alt: string;
    focus: string;
  }[] = [
    ...Object.values(EVENT_VISUALS),
    ...Object.values(CAREER_VISUALS),
    ...Object.values(CITY_VISUALS),
    ...Object.values(SECTION_VISUALS),
    OUTBREAK_VISUAL,
    MILESTONE_VISUAL,
    PRACTICE_VISUAL,
    NETWORK_VISUAL,
  ];
  check(
    "every registered visual has real dimensions",
    everyVisual.every(
      (a) => a.width > 200 && a.height > 200 && a.width / a.height < 4,
    ),
  );
  check(
    "every registered visual is a WebP, never a source PNG",
    everyVisual.every((a) => a.src.endsWith(".webp")),
  );
  check(
    "every registered visual declares alt text, even if empty",
    everyVisual.every((a) => typeof a.alt === "string"),
  );
  check(
    "informational event artwork is actually described",
    Object.values(EVENT_VISUALS).every((a) => a.alt.length > 30),
  );
  check(
    "every registered visual has a focal point for mobile cropping",
    everyVisual.every((a) => /\S/.test(a.focus)),
  );
}

console.log("\nPurchase artwork\n" + "─".repeat(52));
/*
 * PURCHASE ARTWORK
 *
 * Thirty-three items across three catalogues, one registry. Both directions
 * are asserted, because a registry that is merely complete can still carry
 * entries for items that no longer exist.
 */
{
  const miss = missingArt();
  const orph = orphanArt();
  check(
    "every purchasable item has artwork in the registry",
    miss.length === 0,
    miss.join(", "),
  );
  check(
    "the art registry has no entries for items that do not exist",
    orph.length === 0,
    orph.join(", "),
  );
  check(
    "the registry covers all 45 purchasable items",
    Object.keys(PURCHASE_ART).length === 45,
    `${Object.keys(PURCHASE_ART).length} entries`,
  );
  /*
   * Departments, mapped exactly as specified. Asserted id → filename rather
   * than by count, because a count passes happily while two departments
   * wear each other's rooms.
   */
  const DEPT_FILE: Record<string, string> = {
    general: "general-practice",
    paediatrics: "paediatrics",
    dermatology: "dermatology",
    psychiatry: "psychiatry",
    radiology: "radiology",
    neurology: "neurology",
    orthopaedics: "orthopaedics",
    cardiology: "cardiology",
    maternity: "maternity",
    emergency: "emergency",
    surgery: "general-surgery",
    oncology: "oncology",
  };
  const deptWrong = SPECIALTIES.filter(
    (sp) =>
      PURCHASE_ART[sp.id]?.src !==
      `/visuals/purchases/departments/department-${DEPT_FILE[sp.id]}.webp`,
  );
  check(
    "every department maps to its own interior",
    deptWrong.length === 0,
    deptWrong.map((d) => d.id).join(", "),
  );
  check(
    "every machine maps into the equipment set",
    EQUIPMENT.every((e) =>
      PURCHASE_ART[e.id]?.src.startsWith("/visuals/purchases/equipment/"),
    ),
  );
  /*
   * The re-shot equipment scenes. A `-v1` master exists for all twelve and
   * must not ship; the runtime name drops the suffix, so the assertion is
   * that the newer master exists and the build's version-wins rulepicks it.
   */
  check(
    "every -v2 equipment master exists to be used",
    EQUIPMENT.every((e) => {
      const stem = PURCHASE_ART[e.id].src
        .replace("/visuals/purchases/equipment/", "")
        .replace(".webp", "");
      return existsSync(
        join(
          "art-source",
          "visuals",
          "purchases",
          "equipment",
          `${stem}-v2.png`,
        ),
      );
    }),
  );
  check(
    "every art entry declares a real measured size",
    Object.values(PURCHASE_ART).every((a) => a.width === 720 && a.height > 0),
  );
  check(
    "the generated size map covers every registered image",
    Object.values(PURCHASE_ART).every(
      (a) =>
        !!ART_SIZES[
          a.src.replace("/visuals/purchases/", "").replace(".webp", "")
        ],
    ),
  );

  const files = Object.entries(PURCHASE_ART).flatMap(([id, a]) =>
    [a.src, a.large].map((p) => [id, p] as const),
  );
  check(
    "every registered file exists on disk",
    files.every(([, p]) => existsSync(join("public", p))),
    files
      .filter(([, p]) => !existsSync(join("public", p)))
      .map(([id]) => id)
      .join(", "),
  );
  check(
    "every registered purchase image is a WebP",
    files.every(([, p]) => p.endsWith(".webp")),
  );
  check(
    "every purchase image is described for a screen reader",
    Object.values(PURCHASE_ART).every((a) => a.alt.length > 20),
  );
  check(
    "every purchase image declares its intrinsic size",
    Object.values(PURCHASE_ART).every((a) => a.width > 0 && a.height > 0),
  );
  /*
   * The three re-drawn cars.
   *
   * Their first versions carried recognisable badging and must never ship.
   * Asserted against the shipped bytes rather than the filename: the runtime
   * name drops the version suffix, so only a size comparison against the two
   * masters can tell which one was used.
   */
  for (const car of ["reliable_saloon", "luxury_saloon", "sports_car"]) {
    const a = PURCHASE_ART[car];
    const stem = a.src
      .replace("/visuals/purchases/lifestyle/", "")
      .replace(".webp", "");
    check(
      `${car} ships the corrected v2 artwork`,
      existsSync(
        join(
          "art-source",
          "visuals",
          "purchases",
          "lifestyle",
          `${stem}-v2.png`,
        ),
      ) && existsSync(join("public", a.src)),
    );
  }
}

/*
 * The catalogue, as the interface sees it.
 *
 * `allPurchases` is what every card renders from, so its prices have to be
 * the catalogue's own — a presentation layer that restates a number is a
 * presentation layer that will eventually restate it wrongly.
 */
{
  let ps = startRun(doctor, 31);
  ps.r.cash = 500_000;
  const items = allPurchases(ps);
  check(
    "the shelf lists every purchasable item",
    items.length === 45,
    `${items.length}`,
  );
  check(
    "prices come from the catalogue, not the card",
    EQUIPMENT.every(
      (e) => items.find((i) => i.id === e.id)?.price === e.cost,
    ) &&
      LIFESTYLE.every(
        (l) => items.find((i) => i.id === l.id)?.price === l.cost,
      ),
  );
  check(
    "upkeep comes from the catalogue too",
    EQUIPMENT.every(
      (e) => items.find((i) => i.id === e.id)?.upkeep === e.upkeep,
    ),
  );
  check(
    "affordability agrees with cash",
    items.every((i) => i.affordable === ps.r.cash >= i.price),
  );
  check(
    "a shortfall is stated for everything out of reach",
    items
      .filter((i) => !i.affordable)
      .every((i) => i.shortfall === i.price - ps.r.cash),
  );
  check(
    "every item names a buy command the engine implements",
    items.every((i) =>
      [
        "buyFacility",
        "openDepartment",
        "buyEquipment",
        "buyLifestyle",
      ].includes(i.buy.cmd),
    ),
  );
  check(
    "every item explains itself",
    items.every((i) => i.headline.length > 8 && i.effects.length >= 2),
  );

  /* Buying through the shelf's own command must change the same state the
       old buttons changed. */
  const townhouse = items.find((i) => i.id === "townhouse")!;
  ps = run(ps, townhouse.buy.cmd, townhouse.buy.arg);
  check(
    "buying through the shelf works",
    med(ps).lifestyle.includes("townhouse"),
  );
  const after = allPurchases(ps);
  check(
    "and the item now reports as owned and in service",
    after.find((i) => i.id === "townhouse")?.state === "active",
  );
  check(
    "and the next rung up offers the trade-in",
    after.find((i) => i.id === "suburban_house")?.tradeIn?.label ===
      "Town house",
  );

  /* Buying it a second time must be refused by the engine, which is the
       guard behind the interface's double-click protection. */
  const cashHeld = ps.r.cash;
  ps = run(ps, townhouse.buy.cmd, townhouse.buy.arg);
  check(
    "a second purchase of the same item is refused",
    ps.r.cash === cashHeld,
  );
}

/*
 * DEPARTMENTS
 *
 * The most stateful purchase in the game: opening one is a decision about
 * slots, staffing and equipment at once, and all three can be wrong
 * independently. Every claim the card makes about that is checked against
 * the functions the resolver itself calls.
 */
{
  let d = startRun(doctor, 77);
  d.r.cash = 3_000_000;
  const depts = () => allPurchases(d).filter((i) => i.kind === "department");

  check("every department is a purchasable card", depts().length === 12);
  check(
    "every department card carries its interior",
    depts().every((x) => !!x.art),
  );
  check(
    "every department card carries its wayfinding accent",
    depts().every(
      (x) => x.accent === DEPARTMENT_BY_ID.get(x.id as never)?.colour,
    ),
  );
  check(
    "opening costs come from the catalogue",
    SPECIALTIES.every(
      (sp) => depts().find((x) => x.id === sp.id)?.price === sp.unlockCost,
    ),
  );
  check(
    "department upkeep comes from the catalogue",
    SPECIALTIES.every(
      (sp) => depts().find((x) => x.id === sp.id)?.upkeep === sp.upkeep,
    ),
  );

  /* One slot at the start, and general practice already fills it. */
  check(
    "with no free slot every closed department locks",
    depts().filter((x) => x.state === "locked").length === 11,
    `${depts().filter((x) => x.state === "locked").length} locked`,
  );
  check(
    "and the lock says what would free one",
    depts()
      .find((x) => x.state === "locked")!
      .lock!.includes("premises"),
  );

  /* Premises add slots and the locks lift — the same arithmetic the command
       itself checks. */
  d = run(d, "buyFacility", "clinic:lyon");
  check(
    "buying premises unlocks the rest",
    depts().filter((x) => x.state === "locked").length === 0,
  );

  d = run(d, "openDepartment", "cardiology");
  const cardio = () => depts().find((x) => x.id === "cardiology")!;
  check("opening a department works from the shelf", cardio().owned);
  check("and it reads as in service", cardio().state === "active");
  check(
    "an open but unstaffed department reports as uncovered",
    cardio().coverage?.level === "uncovered" &&
      cardio().coverage!.covered < cardio().coverage!.needed,
  );
  check(
    "and names both the missing kit and who could cover it",
    cardio().caveats.length === 2 &&
      cardio().coverage!.missingEquipment.length > 0,
  );

  for (const e of ["ecg", "ultrasound", "theatre", "icu"]) {
    d = run(d, "buyEquipment", e);
  }
  d = run(d, "hire", "surgeon:cardiology");
  check(
    "equipping and staffing it reports as covered",
    cardio().coverage?.level === "covered" &&
      cardio().coverage!.covered === cardio().coverage!.needed,
  );
  check(
    "and the caveats clear with it",
    cardio().caveats.length === 0,
    cardio().caveats.join(" | "),
  );
  check(
    "department coverage agrees with the resolver's own ceiling",
    depts().every(
      (x) => x.coverage!.covered === coverageFor(med(d), x.id as never),
    ),
  );

  d.r.cash = 1_000;
  const short = depts().filter((x) => !x.owned);
  check(
    "when broke every closed department states its shortfall",
    short.length > 0 &&
      short.every(
        (x) => x.state === "unaffordable" && x.shortfall === x.price - 1_000,
      ),
  );
}


/* ================================================================ portraits */

/**
 * FACES
 *
 * Eighteen portraits across two keyspaces that overlap for most characters and
 * diverge for exactly two — which is the whole reason the registry has two
 * lookups rather than one. The collision is the thing worth testing hardest:
 * `meridian` is Dr Anneke Roth in the relationship model and Meridian Health
 * Group on the phone, and putting her face on the group's press releases is a
 * single wrong lookup away.
 */
console.log("\nCharacter portraits\n" + "─".repeat(52));
{
  check(
    "every member of the full cast has a portrait",
    FULL_CAST.every((p) => hasPortraitForPerson(p.id)),
    FULL_CAST.filter((p) => !hasPortraitForPerson(p.id))
      .map((p) => p.id)
      .join(", "),
  );
  check(
    "thirteen cast portraits, no more and no fewer",
    Object.keys(CAST_PORTRAITS).length === 13,
    `${Object.keys(CAST_PORTRAITS).length}`,
  );
  check(
    "the registry has no portrait for somebody who does not exist",
    Object.keys(CAST_PORTRAITS).every((id) =>
      FULL_CAST.some((p) => p.id === id),
    ),
  );

  const files = allPortraits().flatMap((p) => [p.src, p.profile]);
  check(
    "every portrait file exists on disk",
    files.every((f) => existsSync(join("public", f))),
    files.filter((f) => !existsSync(join("public", f))).join(", "),
  );
  check(
    "every portrait is a WebP, never a source PNG",
    files.every((f) => f.endsWith(".webp")),
  );
  check(
    "every portrait declares a square measured size",
    allPortraits().every((p) => p.width === 160 && p.height === 160),
  );
  check(
    "no portrait path reaches into art-source",
    files.every((f) => !f.includes("art-source")),
  );

  /* --------------------------------------------------- the social keyspace */
  const HUMAN_HANDLES: [string, string][] = [
    ["@a.nwosu", "social-nwosu"],
    ["@coravance", "social-vance"],
    ["@mira_ok", "social-mira"],
    ["@tomasr", "social-tomas"],
    ["@jkell", "social-kell"],
  ];
  check(
    "the five social-only humans resolve to their own portraits",
    HUMAN_HANDLES.every(
      ([handle, file]) =>
        portraitForSocialHandle(handle)?.src ===
        `/visuals/characters/social/${file}.webp`,
    ),
    HUMAN_HANDLES.filter(
      ([h, f]) =>
        portraitForSocialHandle(h)?.src !==
        `/visuals/characters/social/${f}.webp`,
    )
      .map(([h]) => h)
      .join(", "),
  );

  /* Sand and Duarte are in both keyspaces and must be one person. */
  for (const [handle, id] of [
    ["@h_sand", "sand"],
    ["@i.duarte", "duarte"],
  ] as const) {
    check(
      `${handle} reuses the same file as the ${id} cast portrait`,
      portraitForSocialHandle(handle)?.src === portraitForPerson(id)?.src,
    );
  }

  /* ------------------------------------------------------- the collision */
  check(
    "@meridian is not Anneke Roth",
    portraitForSocialHandle("@meridian") === null,
    String(portraitForSocialHandle("@meridian")?.src),
  );
  check(
    "@northgate is not Sofia Aranda",
    portraitForSocialHandle("@northgate") === null,
    String(portraitForSocialHandle("@northgate")?.src),
  );
  check(
    "but both are still people in the relationship model",
    !!portraitForPerson("meridian") && !!portraitForPerson("northgate"),
  );
  check(
    "and the two people have different faces",
    portraitForPerson("meridian")?.src !== portraitForPerson("northgate")?.src,
  );

  /* --------------------------------------------------- the organisations */
  const ORG_HANDLES = [
    "@meridian",
    "@northgate",
    "@clinicallede",
    "@rhb_press",
    "@wellwise",
  ];
  check(
    "every institutional account is marked as one",
    ORG_HANDLES.every((h) => isOrganisation(h)),
  );
  check(
    "and none of them resolves to a human portrait",
    ORG_HANDLES.every((h) => portraitForSocialHandle(h) === null),
  );
  check(
    "no human account is mistaken for an organisation",
    HUMAN_HANDLES.every(([h]) => !isOrganisation(h)) &&
      !isOrganisation("@h_sand") &&
      !isOrganisation("@i.duarte"),
  );

  /* Every bot the phone can post as is accounted for: it has a portrait, or
     it is an organisation. Nothing may fall through to a blank. */
  const unaccounted = BOTS.filter(
    (b) => !portraitForSocialHandle(b.handle) && !isOrganisation(b.handle),
  );
  check(
    "every social account is either a face or an institution",
    unaccounted.length === 0,
    unaccounted.map((b) => b.handle).join(", "),
  );

  /*
   * Cast members reached by their own handle.
   *
   * The phone addresses some messages to `@p.raman` rather than carrying a
   * person id, so the registry indexes `@` + `PersonDef.handle`. The guarantee
   * that keeps the Roth/Meridian collision unreachable is that no cast handle
   * is ever an organisation handle — asserted rather than assumed, because a
   * rename is exactly what would break it silently.
   */
  check(
    "no cast member answers to an organisation handle",
    castHandles().every((h) => !isOrganisation(h)),
    castHandles().filter((h) => isOrganisation(h)).join(", "),
  );
  check(
    "a message addressed to a cast handle finds that person",
    portraitForSocialHandle("@p.raman")?.src ===
      portraitForPerson("raman")?.src &&
      portraitForSocialHandle("@j.thorne")?.src ===
        portraitForPerson("thorne")?.src,
  );
  check(
    "Anneke Roth is reachable by her own handle, not her employer's",
    portraitForSocialHandle("@a.roth")?.src ===
      portraitForPerson("meridian")?.src &&
      portraitForSocialHandle("@meridian") === null,
  );
  check(
    "a role account is not a person",
    portraitForSocialHandle("@team") === null &&
      portraitForSocialHandle("@standards") === null,
  );

  /* ------------------------------------------------------- the fallbacks */
  check(
    "an unknown handle resolves to nothing rather than guessing",
    portraitForSocialHandle("@nobody") === null,
  );
  check(
    "an unknown person resolves to nothing",
    portraitForPerson("stranger") === null &&
      !hasPortraitForPerson("stranger"),
  );
  /*
   * Procedurally generated staff.
   *
   * Hundreds of possible names against thirteen portraits: handing any of them
   * a cast member's face would put Dr Lindqvist's photograph on a stranger.
   * They must resolve to nothing and fall back to initials, which are already
   * deterministic per name.
   */
  const generated = Array.from({ length: 60 }, (_, i) => staffName(i));
  check(
    "no generated staff name collides with a cast portrait",
    generated.every((n) => !hasPortraitForPerson(n)),
  );
  check(
    "generated staff still get stable initials",
    generated.every((n) => /^[A-Z]{2}$/.test(initialsOf(n))),
    initialsOf(generated[0]),
  );
}

console.log(
  `\n${failures === 0 ? "all checks passed" : `${failures} FAILED`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
