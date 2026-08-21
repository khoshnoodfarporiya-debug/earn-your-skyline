"use client";

import type { RunState } from "@/lib/game/types";
import { money } from "@/lib/game/format";
import { venture } from "@/lib/game/careers/founder";
import {
  ROUNDS,
  ROUND_BY_ID,
  STARTUP_ROLES,
  STARTUP_ROLE_BY_ID,
  burnOf,
  churnRate,
  defaultAlive,
  dilutionFor,
  organicUsers,
  payroll,
  revenueOf,
  roundAmount,
  roundBlocker,
  rolePrice,
  runwayLabel,
  runwayOf,
  stakeOf,
  startupCityOf,
  valuationOf,
} from "@/lib/game/careers/startup";

/**
 * THE FOUNDER'S SCREEN
 *
 * One screen, because the career has exactly one question in it — how many
 * weeks are left, and what are you spending them on — and splitting that
 * across tabs would hide the arithmetic that makes it a decision.
 *
 * The order is deliberate: runway first, because everything else is a way of
 * changing it; then where the customers come from and go; then the team, whose
 * salaries are the reason the runway is what it is; then the round, which is
 * the only way to buy more of it.
 */
export function FounderScreens({
  state,
  onCommand,
}: {
  state: RunState;
  onCommand: (cmd: string, arg: string) => void;
}) {
  const v = venture(state);
  const city = startupCityOf(v);
  const burn = burnOf(v);
  const revenue = revenueOf(v);
  const weeks = runwayOf(state.r.cash, v);
  const alive = defaultAlive(v);
  const churn = churnRate(v);
  const organic = organicUsers(v);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------- the clock */}
      <section
        aria-labelledby="runway-h"
        className={`rounded-lg border p-4 ${
          alive
            ? "border-good/50 bg-good-tint"
            : weeks < 6
              ? "border-alarm/50 bg-alarm-tint"
              : "border-rule bg-card"
        }`}
      >
        <h2 id="runway-h" className="text-sm font-semibold text-ink">
          Runway
        </h2>
        <p
          className={`num mt-1 text-3xl leading-none ${
            alive ? "text-good" : weeks < 6 ? "text-alarm" : "text-ink"
          }`}
        >
          {runwayLabel(state.r.cash, v)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          {alive
            ? "Revenue covers burn. Nothing is running out any more — this is what the whole run was for."
            : `${money(burn)} goes out a week and ${money(revenue)} comes in, so ${money(burn - revenue)} of your ${money(state.r.cash)} disappears every Monday.`}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rule-soft pt-3 sm:grid-cols-4">
          <Stat label="Burn" value={`${money(burn)}/wk`} tone="bad" />
          <Stat
            label="Revenue"
            value={`${money(revenue)}/wk`}
            tone={revenue > 0 ? "good" : undefined}
          />
          <Stat label="Customers" value={Math.round(v.users).toLocaleString("en-US")} />
          <Stat label="You own" value={`${v.equity.toFixed(1)}%`} />
        </dl>
      </section>

      {/* --------------------------------------------------- who comes and goes */}
      <section
        aria-labelledby="growth-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="growth-h" className="text-sm font-semibold text-ink">
          Where the customers come from
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          Selling wins people this week. Building keeps the ones you have, which
          is the only thing that compounds.
        </p>

        <ul className="mt-3 space-y-2 text-xs">
          <Flow
            label="Arrive on their own"
            value={organic >= 1 ? `+${Math.round(organic)}` : "Nobody yet"}
            note={
              organic >= 1
                ? `Brand is at ${Math.round(v.brand)} and decays 6% a week.`
                : `Brand is only at ${Math.round(v.brand)}. Marketing is what turns it into arrivals.`
            }
            tone="good"
          />
          <Flow
            label="Leave"
            value={
              v.users * churn >= 1
                ? `−${Math.round(v.users * churn)}`
                : "Nobody to lose"
            }
            note={`${(churn * 100).toFixed(1)}% a week. Falls as the product improves.`}
            tone="bad"
          />
        </ul>

        <div className="mt-3 border-t border-rule-soft pt-3">
          <div className="flex items-center gap-2">
            <span className="sign shrink-0 text-[10.5px] text-ink-faint">
              Product
            </span>
            <span
              role="meter"
              aria-valuenow={Math.round(v.product)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="How finished the product is"
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-rule-soft"
            >
              <span
                className="block h-full rounded-full bg-clinical transition-[width] duration-500"
                style={{ width: `${Math.max(2, Math.min(100, v.product))}%` }}
              />
            </span>
            <span className="num shrink-0 text-[11.5px] text-ink-soft">
              {Math.round(v.product)}
            </span>
          </div>

          {/* Price is a real lever and a real risk: put it up and the least
              committed leave on the spot. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-soft">
              {money(v.price)} per customer, per month
            </span>
            <button
              type="button"
              onClick={() => onCommand("setPrice", String(v.price + 4))}
              className="rounded-form border border-rule px-2.5 py-1 text-xs text-ink transition hover:border-clinical hover:text-clinical"
            >
              Raise to {money(v.price + 4)}
            </button>
            <button
              type="button"
              disabled={v.price <= 4}
              onClick={() => onCommand("setPrice", String(Math.max(4, v.price - 4)))}
              className="rounded-form border border-rule px-2.5 py-1 text-xs text-ink transition enabled:hover:border-clinical enabled:hover:text-clinical disabled:cursor-not-allowed disabled:opacity-45"
            >
              Drop to {money(Math.max(4, v.price - 4))}
            </button>
            <span className="text-xs text-ink-faint">
              Putting it up loses the least committed straight away.
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ the team */}
      <section
        aria-labelledby="team-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="team-h" className="text-sm font-semibold text-ink">
          The team
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          {v.team.length === 0
            ? "Just you. Everything the company does this week, you do."
            : `${v.team.length} on the payroll, ${money(payroll(v))} a week. Every one of them shortens the runway that pays them.`}
        </p>

        {v.team.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {v.team.map((h) => {
              const role = STARTUP_ROLE_BY_ID.get(h.role);
              return (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-rule-soft px-3 py-2 text-xs"
                >
                  <span>
                    <span className="font-medium text-ink">{h.name}</span>
                    <span className="text-ink-faint"> · {role?.label}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="num text-ink-faint">
                      {money(h.salary)}/wk
                    </span>
                    <button
                      type="button"
                      onClick={() => onCommand("letGo", h.id)}
                      className="rounded border border-rule-soft px-2 py-0.5 text-ink-faint transition hover:border-alarm hover:text-alarm"
                    >
                      Let go
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <ul className="mt-3 grid gap-1.5 border-t border-rule-soft pt-3">
          {STARTUP_ROLES.map((r) => {
            const { salary, hireCost } = rolePrice(v, r);
            /* The honest cost of a hire is not the fee — it is the weeks. */
            const after = runwayOf(state.r.cash - hireCost, {
              ...v,
              team: [
                ...v.team,
                { id: "x", name: "x", role: r.id, salary, since: 0 },
              ],
            });
            const cost = Number.isFinite(weeks) && Number.isFinite(after)
              ? Math.max(0, Math.floor(weeks) - Math.floor(after))
              : 0;
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
                    onClick={() => onCommand("hireVenture", r.id)}
                    className="rounded-form border border-rule px-3 py-1.5 text-ink transition enabled:hover:border-clinical enabled:hover:text-clinical disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Take them on
                  </button>
                  <span className="text-ink-faint">
                    {tooDear
                      ? `Costs ${money(hireCost)} and you have ${money(state.r.cash)}.`
                      : Number.isFinite(weeks) && cost > 0
                        ? `Costs you about ${cost} week${cost === 1 ? "" : "s"} of runway.`
                        : "Adds to the burn every week from now on."}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------------------------------------------------------- the money */}
      <section
        aria-labelledby="raise-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="raise-h" className="text-sm font-semibold text-ink">
          Raising
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          {valuationOf(v) > 0
            ? `The company is worth about ${money(valuationOf(v))}, and your share of it ${money(stakeOf(v))}.`
            : "Nothing has put a price on the company yet — the first round is what does that."}{" "}
          Money buys weeks; it costs a piece of that share, permanently.
        </p>

        {v.pitchRound ? (
          <RaiseInProgress state={state} onCommand={onCommand} />
        ) : (
          <ul className="mt-3 space-y-2">
            {ROUNDS.map((r) => {
              const blocked = roundBlocker(v, r);
              return (
                <li
                  key={r.id}
                  className="rounded border border-rule-soft px-3 py-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-ink">{r.label}</span>
                    <span className="num text-ink-faint">
                      {money(roundAmount(v, r))} for about {dilutionFor(v, r)}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-ink-faint">{r.blurb}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={blocked !== null}
                      onClick={() => onCommand("startRaise", r.id)}
                      className="rounded-form border border-rule px-3 py-1.5 text-ink transition enabled:hover:border-clinical enabled:hover:text-clinical disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Go out and raise it
                    </button>
                    <span className="text-ink-faint">
                      {blocked ??
                        `About ${r.effort} weeks of pitching in ${city.name}.`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/** The round you are currently out raising. */
function RaiseInProgress({
  state,
  onCommand,
}: {
  state: RunState;
  onCommand: (cmd: string, arg: string) => void;
}) {
  const v = venture(state);
  const round = v.pitchRound ? ROUND_BY_ID.get(v.pitchRound) : undefined;
  if (!round) return null;
  const dilution = dilutionFor(v, round);
  const blocked = roundBlocker(v, round);

  return (
    <div className="mt-3 rounded border border-clinical/40 bg-clinical-tint px-3 py-3 text-xs">
      <p className="font-medium text-ink">Out raising the {round.label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span
          role="meter"
          aria-valuenow={Math.round(v.pitch)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress toward the ${round.label}`}
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-rule-soft"
        >
          <span
            className="block h-full rounded-full bg-clinical transition-[width] duration-500"
            style={{ width: `${Math.max(2, Math.min(100, v.pitch))}%` }}
          />
        </span>
        <span className="num shrink-0 text-ink-soft">
          {Math.round(v.pitch)}%
        </span>
      </div>
      <p className="mt-2 text-ink-soft">
        {money(roundAmount(v, round))} when it closes, for {dilution}% of the
        company — you would keep{" "}
        {(v.equity * (1 - dilution / 100)).toFixed(1)}%. Spend blocks on
        pitching to move this.
      </p>
      {blocked && (
        <p className="mt-2 text-caution">
          Careful: {blocked.toLowerCase()} If that is still true when it closes,
          the round falls through in diligence.
        </p>
      )}
      <button
        type="button"
        onClick={() => onCommand("stopRaise", "")}
        className="mt-2 rounded border border-rule-soft px-2.5 py-1 text-ink-faint transition hover:border-alarm hover:text-alarm"
      >
        Stop raising
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div>
      <dt className="sign text-[10.5px] leading-none text-ink-faint">{label}</dt>
      <dd
        className={`num mt-1 text-[13.5px] leading-none ${
          tone === "bad"
            ? "text-alarm"
            : tone === "good"
              ? "text-good"
              : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Flow({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "good" | "bad";
}) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span className="text-ink">{label}</span>
      <span className={`num ${tone === "good" ? "text-good" : "text-alarm"}`}>
        {value} a week
      </span>
      <span className="w-full text-ink-faint">{note}</span>
    </li>
  );
}
