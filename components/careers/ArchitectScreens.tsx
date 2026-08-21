"use client";

import type { RunState } from "@/lib/game/types";
import { money } from "@/lib/game/format";
import { studio } from "@/lib/game/careers/architect";
import {
  KIND_BY_ID,
  PROJECT_KINDS,
  STAGES,
  STUDIO_ROLES,
  STUDIO_ROLE_BY_ID,
  competitionOdds,
  entryFee,
  feeFor,
  overallProgress,
  revisionRisk,
  rolePayStudio,
  stageOf,
  stageProgress,
  stageWeeks,
  studioCityOf,
  studioWages,
  workOnTheBoards,
} from "@/lib/game/careers/studio";

/**
 * THE PRACTICE SCREEN
 *
 * A commission is a thing you have to be able to see the *shape* of: which
 * stage it is in, how much of the fee is already yours, and how likely the
 * client is to send it backwards this week. All three are on every card,
 * because the decision the career is about — draw, or go and see them — is
 * unanswerable without the third one.
 */
export function ArchitectScreens({
  state,
  onCommand,
}: {
  state: RunState;
  onCommand: (cmd: string, arg: string) => void;
}) {
  const a = studio(state);
  const city = studioCityOf(a);
  const live = a.commissions.filter((c) => !c.done);
  const built = a.commissions.filter((c) => c.done);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- on the boards */}
      <section
        aria-labelledby="boards-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="boards-h" className="text-sm font-semibold text-ink">
          On the boards in {city.name}
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          {money(workOnTheBoards(a))} of fee still to earn. Every stage you
          finish is banked for good — and every client who has not seen you can
          send the building back a stage.
        </p>

        {live.length === 0 ? (
          <p className="mt-3 rounded border border-dashed border-rule px-3 py-4 text-center text-xs text-ink-faint">
            Nothing on the boards. Court work until somebody offers you
            something.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {live.map((c) => {
              const kind = KIND_BY_ID.get(c.kind);
              const stage = stageOf(c);
              const risk = revisionRisk(a, c, state.week);
              const need = kind ? stageWeeks(kind, stage) : 0;
              const focused = (a.focus ?? live[0]?.id) === c.id;
              const seen = Math.max(0, state.week - c.lastSeen);
              return (
                <li
                  key={c.id}
                  className={`rounded border p-3 text-xs ${
                    focused ? "border-clinical bg-clinical-tint" : "border-rule-soft"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-ink">{kind?.label}</span>
                    <span className="num text-ink-faint">
                      {money(c.paid)} of {kind ? money(feeFor(a, kind)) : "—"}{" "}
                      banked
                    </span>
                  </div>
                  <p className="text-ink-faint">for {c.client}</p>

                  {/* Which stage, and how far through it. */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="sign shrink-0 text-[10.5px] text-ink-faint">
                      {stage.label}
                    </span>
                    <span
                      role="meter"
                      aria-valuenow={Math.round(stageProgress(c) * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${stage.label} progress`}
                      className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-rule-soft"
                    >
                      <span
                        className="block h-full rounded-full bg-clinical transition-[width] duration-500"
                        style={{
                          width: `${Math.max(2, stageProgress(c) * 100)}%`,
                        }}
                      />
                    </span>
                    <span className="num shrink-0 text-[11.5px] text-ink-soft">
                      {c.progress.toFixed(1)}/{need}
                    </span>
                  </div>

                  {/* The five stages, so being sent back is legible. */}
                  <ol className="mt-2 flex gap-1" aria-label="Stages">
                    {STAGES.map((st, i) => (
                      <li
                        key={st.id}
                        title={st.label}
                        className={`h-1 flex-1 rounded-full ${
                          i < c.stage
                            ? "bg-good"
                            : i === c.stage
                              ? "bg-clinical"
                              : "bg-rule-soft"
                        }`}
                      />
                    ))}
                  </ol>

                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className={
                        risk > 0.2
                          ? "text-alarm"
                          : risk > 0.08
                            ? "text-caution"
                            : "text-good"
                      }
                    >
                      {(risk * 100).toFixed(0)}% chance they change the brief
                    </span>
                    <span className="text-ink-faint">
                      Last seen {seen === 0 ? "this week" : `${seen} weeks ago`}
                    </span>
                    {c.revisions > 0 && (
                      <span className="text-caution">
                        Redrawn {c.revisions}×
                      </span>
                    )}
                    <span className="text-ink-faint">
                      {Math.round(overallProgress(a, c) * 100)}% of the fee
                      earned
                    </span>
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {!focused && (
                      <button
                        type="button"
                        onClick={() => onCommand("focusCommission", c.id)}
                        className="rounded border border-rule px-2.5 py-1 text-ink hover:border-clinical"
                      >
                        Put this on the board
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onCommand("resignCommission", c.id)}
                      className="rounded border border-rule-soft px-2.5 py-1 text-ink-faint hover:border-alarm hover:text-alarm"
                    >
                      Resign the job
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* --------------------------------------------------------- offers */}
      <section
        aria-labelledby="offers-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="offers-h" className="text-sm font-semibold text-ink">
          Offered to you
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          What a practice is asked for depends on what it has already built.
          Offers left on the table go elsewhere.
        </p>
        {a.offers.length === 0 ? (
          <p className="mt-3 rounded border border-dashed border-rule px-3 py-4 text-center text-xs text-ink-faint">
            Nothing offered. Spend a week courting work.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {a.offers.map((o) => {
              const kind = KIND_BY_ID.get(o.kind);
              return (
                <li
                  key={o.id}
                  className="rounded border border-rule-soft px-3 py-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-ink">{kind?.label}</span>
                    <span className="num text-ink-faint">
                      {kind ? money(feeFor(a, kind)) : ""}
                    </span>
                  </div>
                  <p className="text-ink-faint">
                    {o.client} · {kind?.blurb}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onCommand("takeCommission", o.id)}
                      className="rounded border border-rule px-2.5 py-1 text-ink hover:border-clinical"
                    >
                      Take it on
                    </button>
                    <button
                      type="button"
                      onClick={() => onCommand("declineCommission", o.id)}
                      className="rounded border border-rule-soft px-2.5 py-1 text-ink-faint hover:border-alarm hover:text-alarm"
                    >
                      Turn it down
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* --------------------------------------------------- competitions */}
      <section
        aria-labelledby="comp-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="comp-h" className="text-sm font-semibold text-ink">
          Competitions
        </h2>
        {a.competition ? (
          <>
            <p className="mt-1 text-xs text-ink-faint">
              {KIND_BY_ID.get(a.competition.kind)?.label}, judged in week{" "}
              {a.competition.judgedWeek}, against {a.competition.entrants}{" "}
              practices. Unpaid until it is won, and usually not then.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="sign shrink-0 text-[10.5px] text-ink-faint">
                Odds
              </span>
              <span
                role="meter"
                aria-valuenow={Math.round(
                  competitionOdds(a.competition, state.r.reputation) * 100,
                )}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Chance of winning the competition"
                className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-rule-soft"
              >
                <span
                  className="block h-full rounded-full bg-gold transition-[width] duration-500"
                  style={{
                    width: `${Math.max(
                      2,
                      competitionOdds(a.competition, state.r.reputation) * 100,
                    )}%`,
                  }}
                />
              </span>
              <span className="num shrink-0 text-ink-soft">
                {Math.round(
                  competitionOdds(a.competition, state.r.reputation) * 100,
                )}
                %
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {a.competition.effort.toFixed(1)} weeks of drawing in. More work
              is better odds.
            </p>
            <button
              type="button"
              onClick={() => onCommand("withdrawCompetition", "")}
              className="mt-2 rounded border border-rule-soft px-2.5 py-1 text-xs text-ink-faint hover:border-alarm hover:text-alarm"
            >
              Withdraw
            </button>
          </>
        ) : (
          <>
            <p className="mt-1 text-xs text-ink-faint">
              Months of unpaid work for a building nobody has promised you. It
              is also the only way a museum is ever yours.
            </p>
            <ul className="mt-3 grid gap-1.5">
              {PROJECT_KINDS.filter((k) => k.prestige >= 9).map((k) => {
                const cost = entryFee(a, k);
                const tooDear = state.r.cash < cost;
                return (
                  <li
                    key={k.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-rule-soft px-3 py-2 text-xs"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-ink">
                        {k.label}
                      </span>
                      <span className="block text-ink-faint">
                        {money(feeFor(a, k))} of work · entry {money(cost)}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={tooDear}
                      onClick={() => onCommand("enterCompetition", k.id)}
                      className="shrink-0 rounded border border-rule px-2.5 py-1 text-ink enabled:hover:border-clinical disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Enter
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {/* -------------------------------------------------------- the studio */}
      <section
        aria-labelledby="studio-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="studio-h" className="text-sm font-semibold text-ink">
          The studio
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          {a.team.length === 0
            ? "Just you and a board. Everything drawn this week, you drew."
            : `${a.team.length} in the studio, ${money(studioWages(a))} a week. They draw whatever is on the board.`}
        </p>

        {a.team.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {a.team.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-rule-soft px-3 py-2 text-xs"
              >
                <span>
                  <span className="font-medium text-ink">{h.name}</span>
                  <span className="text-ink-faint">
                    {" "}
                    · {STUDIO_ROLE_BY_ID.get(h.role)?.label}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="num text-ink-faint">
                    {money(h.salary)}/wk
                  </span>
                  <button
                    type="button"
                    onClick={() => onCommand("letGoStudio", h.id)}
                    className="rounded border border-rule-soft px-2 py-0.5 text-ink-faint hover:border-alarm hover:text-alarm"
                  >
                    Let go
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <ul className="mt-3 grid gap-1.5 border-t border-rule-soft pt-3">
          {STUDIO_ROLES.map((r) => {
            const { salary, hireCost } = rolePayStudio(a, r);
            const tooDear = state.r.cash < hireCost;
            return (
              <li
                key={r.id}
                className="rounded border border-rule-soft px-3 py-2.5 text-xs"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-ink">{r.label}</span>
                  <span className="num text-ink-faint">
                    {money(salary)}/wk · {money(hireCost)} to hire
                  </span>
                </div>
                <p className="mt-0.5 text-ink-faint">{r.blurb}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={tooDear}
                    onClick={() => onCommand("hireStudio", r.id)}
                    className="rounded-form border border-rule px-3 py-1.5 text-ink enabled:hover:border-clinical disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Take them on
                  </button>
                  <span className="text-ink-faint">
                    {tooDear
                      ? `Costs ${money(hireCost)} and you have ${money(state.r.cash)}.`
                      : r.id === "associate"
                        ? "Sees clients for you, which cuts every brief-change risk."
                        : `Draws ${r.output} week${r.output === 1 ? "" : "s"} a week, on whatever is on the board.`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------ the portfolio */}
      {built.length > 0 && (
        <section
          aria-labelledby="built-h"
          className="rounded-lg border border-rule bg-card p-4"
        >
          <h2 id="built-h" className="text-sm font-semibold text-ink">
            Built
          </h2>
          <ul className="mt-2 space-y-1">
            {built.map((c) => {
              const kind = KIND_BY_ID.get(c.kind);
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 text-xs"
                >
                  <span className="text-ink">{kind?.label}</span>
                  <span className="text-ink-faint">
                    {c.client} · {money(c.paid)}
                    {c.revisions > 0 ? ` · redrawn ${c.revisions}×` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
