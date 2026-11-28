"use client";

import type { CareerDef, RunState } from "@/lib/game/types";
import type { Allocation } from "@/lib/game/engine";
import type { Alert } from "@/lib/ui/alerts";
import type { Step } from "@/lib/ui/guidance";
import type { ScreenId } from "@/lib/ui/navigation";
import { money } from "@/lib/game/format";
import { med } from "@/lib/game/careers/doctor";
import { Meters } from "../Meters";
import { topAlerts } from "@/lib/ui/alerts";
import { NeedsYou } from "./NeedsYou";
import { Fold } from "../ui/Fold";
import { StatusStrip } from "./StatusStrip";
import { OverviewHero } from "./OverviewHero";
import { PlanPicker } from "./PlanPicker";
import { CommitBar } from "./CommitBar";
import { TrendCard } from "./TrendCard";
import Image from "next/image";
import { mentorFor } from "@/lib/ui/mentors";

/**
 * The screen that answers "what do I do this week?".
 *
 * Order is deliberate and matches urgency: what is on fire, what to do about
 * it, what the goal is, then the week itself, then the commit. Supporting
 * detail (vitals, trend, notes) sits below the fold on mobile and beside the
 * loop on desktop.
 */
/**
 * The running record, in each career's own words.
 *
 * Presentation only: the log itself is engine-level and identical everywhere.
 */
const LOG_HEADING: Record<string, string> = {
  doctor: "Case notes",
  chef: "The service book",
  lawyer: "Attendance notes",
};

/* The forecast fills its row on a wide screen whatever the career sends: a
   fixed four columns left a 5-tile forecast with three empty cells. On a
   phone it is two columns, and an odd last tile spans both. */
const LG_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-3",
};

export function Overview({
  career,
  state,
  alloc,
  budget,
  spent,
  briefing,
  alerts,
  step,
  onAllocate,
  lastWeek,
  onCommit,
  onNavigate,
  onDismissStep,
  onPayLoan,
}: {
  career: CareerDef;
  state: RunState;
  alloc: Allocation;
  budget: number;
  spent: number;
  briefing: ReturnType<CareerDef["briefing"]>;
  alerts: Alert[];
  step: Step | null;
  onAllocate: (updater: (prev: Allocation) => Allocation) => void;
  /** Last week's committed plan, for the one-tap repeat. */
  lastWeek: Allocation | null;
  onCommit: () => void;
  onNavigate: (screen: ScreenId) => void;
  onDismissStep: (id: string) => void;
  onPayLoan: () => void;
}) {
  const objective = career.objective(state);
  const score = career.scoreboard(state);
  const meterDef = career.resources.find((r) => r.display === "meter");
  const firstMeter = meterDef
    ? `${meterDef.label} ${Math.round(state.r[meterDef.id] ?? 0)}`
    : undefined;
  const m = state.careerId === "doctor" ? med(state) : null;
  const mentor = mentorFor(state.careerId);
  /**
   * One figure for the sticky bar. A warning outranks everything — if the
   * forecast says something is about to go wrong, that is what should be
   * under your thumb. Otherwise show capacity, which is the number the whole
   * career turns on.
   */
  const headline =
    briefing.find((b) => b.tone === "bad") ??
    briefing.find((b) => /capacity/i.test(b.label)) ??
    briefing[0];

  // Share of last week's arrivals actually treated, read off the live
  // caseload rather than stored — it only ever describes the latest week.
  const arrived = m?.lastCases.reduce((n, c) => n + c.arrived, 0) ?? 0;
  const treatedShare =
    m && arrived > 0
      ? Math.round(
          (m.lastCases.reduce((n, c) => n + c.treated, 0) / arrived) * 100,
        )
      : undefined;

  return (
    /*
     * The reading order is the decision order: what you have built, the three
     * numbers that constrain the week, what needs you, then the week itself
     * and what committing it will do. The goal's paragraph, the loan and the
     * recent weeks fold into one card of rows below it (iPhone Week
     * prototype, Nov 2026): on a phone the screen went from about 4.5 screens
     * to about 2, and the plan starts on the first one.
     *
     * Spacing carries the grouping rather than borders — `space-y-5` between
     * major blocks, tighter inside them — which is what lets the nested card
     * outlines come out.
     */
    <div className="stack">
      <OverviewHero career={career} state={state} />

      <StatusStrip state={state} goal={objective.progress} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_336px]">
        <div className="min-w-0 stack">
          {/* One primary recommendation and at most one secondary. Everything
              else stays reachable through the section badges — see
              `topAlerts`. Inside the left column rather than above the grid,
              so the pinned commit card beside it starts level with them
              instead of a screen further down. */}
          <NeedsYou
            alerts={topAlerts(alerts)}
            remaining={Math.max(0, alerts.length - topAlerts(alerts).length)}
            step={step}
            onNavigate={onNavigate}
            onDismissStep={onDismissStep}
          />

          {/* ------------------------------------------------- the week */}
          {/* The week arrives planned; the steppers are one tap further. */}
          <section aria-label="Your week" data-tour="plan" className="form overflow-hidden">
            <PlanPicker
              career={career}
              state={state}
              alloc={alloc}
              budget={budget}
              spent={spent}
              lastWeek={lastWeek}
              onAllocate={onAllocate}
            />
          </section>

          {/* --------------------------------------- forecast and commit */}
          <section className="form">
            <h2 className="form-head sign px-4 py-2.5 text-[11.5px] text-ink-soft">
              If you commit this week
            </h2>
            {/*
             * A tinted grid rather than a grid of bordered cards. The old
             * version drew a hairline around every figure, which turned the
             * forecast into a spreadsheet; the numbers separate perfectly
             * well on background alone.
             */}
            <div className={`grid grid-cols-2 gap-px bg-rule-soft ${LG_COLS[briefing.length] ?? "lg:grid-cols-3"}`}>
              {briefing.map((b) => (
                <div
                  key={b.label}
                  className={`px-4 py-3.5 odd:last:col-span-2 lg:odd:last:col-span-1 ${
                    b.tone === "bad"
                      ? "bg-alarm-tint"
                      : b.tone === "good"
                        ? "bg-good-tint"
                        : "bg-card"
                  }`}
                >
                  <p className="sign text-[11.5px] text-ink-faint">{b.label}</p>
                  <p
                    className={`num mt-1 text-[21px] font-semibold leading-tight tracking-tight ${
                      b.tone === "good"
                        ? "text-good"
                        : b.tone === "bad"
                          ? "text-alarm"
                          : "text-ink"
                    }`}
                  >
                    {b.value}
                  </p>
                  {b.note && (
                    <p className="mt-1 text-[13px] leading-snug text-ink-soft">
                      {b.note}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* The commit itself is not here: on desktop it is pinned at the
                top of the right column (below), on mobile in the CommitBar. */}
          </section>

          {/* ------------------------------------------------ more, folded */}
          <section aria-label="More this week" className="form overflow-hidden">
            <Fold label="The goal" hint={`${Math.round(objective.progress * 100)}%`} hintClass="text-clinical">
              <p className="text-[14.5px] leading-relaxed text-ink">
                {objective.text}
              </p>
              <div
                className="gauge mt-2.5"
                style={{
                  ["--fill" as string]: `${Math.max(0, Math.min(1, objective.progress)) * 100}%`,
                }}
                role="progressbar"
                aria-label="Objective progress"
                aria-valuenow={Math.round(objective.progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
              <p className="num mt-2 text-[12px] text-ink-faint">
                {score.label} {score.value} · {score.sub}
              </p>
            </Fold>

            {state.r.debt > 0 && (
              <Fold
                /* The career's own word for what it owes: a Chef's is a
                   fit-out loan, not student debt. */
                label={
                  career.resources.find((r) => r.id === "debt")?.label ??
                  "Outstanding loan"
                }
                hint={money(state.r.debt)}
              >
                <p className="num text-[13.5px] text-ink-soft">
                  {money(state.r.debt)} outstanding. Paying it down early
                  saves interest and moves the goal.
                </p>
                <button
                  onClick={onPayLoan}
                  disabled={state.r.cash < 1_000}
                  className="btn btn-secondary mt-3"
                >
                  Pay {money(Math.min(10_000, state.r.debt, state.r.cash))}
                </button>
              </Fold>
            )}

            <Fold label="Recent weeks">
              <div className="-mx-4 -mb-4">
                <TrendCard history={state.history} treatedShare={treatedShare} bare />
              </div>
            </Fold>

            {/* The mentor's three cards, all at once, to reread whenever.
                Opening it changes nothing about the plan. */}
            {mentor && (
              <Fold label={`Advice from ${mentor.name}`}>
                <div className="flex gap-3.5">
                  <Image
                    src={mentor.portrait}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full border border-rule object-cover"
                  />
                  <ol className="min-w-0 space-y-2 text-[14px] leading-relaxed text-ink">
                    {mentor.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ol>
                </div>
              </Fold>
            )}
          </section>
        </div>

        {/* ------------------------------------------------ supporting
            Secondary by construction: on desktop it sits beside the week, on
            mobile it falls below it, so the decision always comes first. */}
        <div className="scroll-thin min-w-0 stack lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          {/*
           * THE COMMIT, PINNED (desktop).
           *
           * It used to sit at the foot of the forecast card, about 2,300px
           * down a Chef's Week screen at 1280px — below the planner, the
           * objective and the forecast — while every Work screen already kept
           * it pinned in a rail and phones pin a CommitBar. It now leads this
           * column, with the two numbers needed to decide whether to press
           * it, and the whole column is pinned under the sticky status strip
           * (scrolling on its own if it is taller than the window), the same
           * way the Work screens' rail is. Pinning only the card let the
           * meters slide up underneath it. Mobile keeps the CommitBar.
           */}
          <section
            aria-label="Commit the week"
            className="form hidden p-3 lg:block"
          >
            <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
              <p className="sign flex items-center gap-2 text-[11.5px] text-ink-faint">
                {/* The week as dots, lit while a block is still free — the
                    same picture as the phone's commit bar. */}
                {budget > 0 && budget <= 12 && (
                  <span aria-hidden className="flex gap-[4px]">
                    {Array.from({ length: budget }, (_, i) => (
                      <span
                        key={i}
                        className={`time-dot h-2 w-2 rounded-full ${i < budget - spent ? "bg-clinical" : "bg-rule"}`}
                      />
                    ))}
                  </span>
                )}
                {budget - spent === 0
                  ? "Week planned"
                  : `${budget - spent} of ${budget} blocks free`}
              </p>
              {headline && (
                <p
                  className={`num truncate text-[14px] font-semibold ${
                    headline.tone === "good"
                      ? "text-good"
                      : headline.tone === "bad"
                        ? "text-alarm"
                        : "text-ink"
                  }`}
                  title={headline.label}
                >
                  {headline.value}
                </p>
              )}
            </div>
            <button
              onClick={onCommit}
              data-tour="commit"
              disabled={spent === 0}
              className="btn btn-primary btn-lg w-full"
            >
              {spent === 0
                ? "Assign your time first"
                : spent < budget
                  ? `Commit week — ${budget - spent} block${budget - spent === 1 ? "" : "s"} unused`
                  : "Commit week"}
            </button>
          </section>

          {/* Folded on a phone, where it was 670px between the week and the
              rest; open from 1024px, where it sits beside the week. The
              closed row still names the first meter and its value. */}
          <section className="form overflow-hidden">
            <Fold label="Observations" hint={firstMeter} openOnDesktop>
              <div className="-mx-4 -mb-4">
                <Meters career={career} state={state} bare />
              </div>
            </Fold>
          </section>

          {m && (
            <section className="form">
              <h2 className="form-head sign px-4 py-2.5 text-[11.5px] text-ink-soft">
                The practice
              </h2>
              <div className="grid grid-cols-3 gap-px bg-rule-soft">
                {[
                  ["Sites", m.facilities.length, "cities" as ScreenId],
                  ["Depts", m.departments.length, "build" as ScreenId],
                  ["Staff", m.staff.length, "staff" as ScreenId],
                ].map(([label, value, dest]) => (
                  <button
                    key={label as string}
                    onClick={() => onNavigate(dest as ScreenId)}
                    className="bg-card px-3 py-3 text-left transition hover:bg-clinical-tint"
                  >
                    <p className="sign text-[11.5px] text-ink-faint">
                      {label as string}
                    </p>
                    <p className="num mt-0.5 text-[19px] font-semibold">
                      {value as number}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Folded like the rows beside the week: a long record that is
              there when wanted. The newest entry's week is on the closed row. */}
          <section className="form overflow-hidden">
            <Fold
              label={LOG_HEADING[state.careerId] ?? "What has happened"}
              hint={state.log[0] ? `Week ${state.log[0].week}` : undefined}
            >
            <div className="-mx-4 -mb-4">
            {state.log.length === 0 ? (
              <p className="px-4 py-4 text-[14px] text-ink-soft">
                Nothing has happened yet.
              </p>
            ) : (
              <ol className="scroll-thin max-h-72 overflow-y-auto">
                {state.log.slice(0, 25).map((entry, i) => (
                  <li
                    key={i}
                    className="spine flex gap-3 border-b border-rule-soft px-4 py-2.5 text-[13.5px] leading-relaxed last:border-0"
                    style={{
                      ["--dept" as string]:
                        entry.tone === "bad"
                          ? "#FF6B6B"
                          : entry.tone === "good"
                            ? "#4ADE80"
                            : "#26375A",
                    }}
                  >
                    <span className="num shrink-0 text-ink-faint">
                      w{entry.week}
                    </span>
                    <span className="text-ink-soft">{entry.text}</span>
                  </li>
                ))}
              </ol>
            )}
            </div>
            </Fold>
          </section>
        </div>
      </div>

      <CommitBar
        spent={spent}
        budget={budget}
        headline={headline}
        onCommit={onCommit}
      />
    </div>
  );
}
