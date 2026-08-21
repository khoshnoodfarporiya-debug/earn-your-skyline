"use client";

import type { RunState } from "@/lib/game/types";
import { money } from "@/lib/game/format";
import { workshop } from "@/lib/game/careers/engineer";
import {
  buildableKinds,
  certWeeksFor,
  confidenceOf,
  designNeeded,
  designProgress,
  estimateOf,
  faultCost,
  kindOf,
  nextStepFor,
  recallCost,
  revenueOf,
  surfaceChance,
  workshopCityOf,
  workshopRevenue,
} from "@/lib/game/careers/workshop";

/**
 * THE WORKSHOP SCREEN
 *
 * The hard part of this career's UI is what it must NOT show.
 *
 * `latent` — the true number of faults — is never rendered anywhere on this
 * page. Everything the player sees about defects comes from `estimateOf`,
 * which is a range, and from `confidenceOf`, which says how much that range
 * is worth. A build that printed the real number would delete the career.
 *
 * So the design leans into the uncertainty rather than hiding it: the
 * estimate is a *band* drawn against the certifier's tolerance, and the
 * decision — ship it, or spend another fortnight — is made by looking at how
 * much of the band sits the wrong side of that line.
 */
export function EngineerScreens({
  state,
  onCommand,
}: {
  state: RunState;
  onCommand: (cmd: string, arg: string) => void;
}) {
  const w = workshop(state);
  const city = workshopCityOf(w);
  const live = w.products.filter((p) => p.stage !== "withdrawn");

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- the bench */}
      <section
        aria-labelledby="bench-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="bench-h" className="text-sm font-semibold text-ink">
          The bench in {city.name}
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          {money(workshopRevenue(w))} a week coming in.{" "}
          {w.faultsInField === 0
            ? "Nothing has failed at a customer yet."
            : `${w.faultsInField} fault${w.faultsInField === 1 ? " has" : "s have"} reached a customer.`}{" "}
          The certifier here accepts up to {city.certTolerance} faults and takes{" "}
          {certWeeksFor(w)} weeks.
        </p>

        {live.length === 0 ? (
          <p className="mt-3 rounded border border-dashed border-rule px-3 py-4 text-center text-xs text-ink-faint">
            Nothing on the bench. Start something below.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {live.map((p) => {
              const kind = kindOf(p);
              if (!kind) return null;
              const est = estimateOf(p);
              const focused = (w.focus ?? live[0]?.id) === p.id;
              const designed = p.design >= designNeeded(kind);
              const tolerance = city.certTolerance;
              return (
                <li
                  key={p.id}
                  className={`rounded border p-3 text-xs ${
                    focused ? "border-clinical bg-clinical-tint" : "border-rule-soft"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-ink">
                      {p.name} — {kind.label.toLowerCase()}
                    </span>
                    <span className="sign text-[11px] text-ink-faint">
                      {p.stage === "shipped"
                        ? `On sale · ${money(revenueOf(w, p))}/wk`
                        : p.stage}
                    </span>
                  </div>
                  <p className="mt-0.5 text-ink-faint">{nextStepFor(w, p)}</p>

                  {/* Design, when there is still designing to do. */}
                  {p.stage !== "shipped" && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="sign shrink-0 text-[10.5px] text-ink-faint">
                        Design
                      </span>
                      <span
                        role="meter"
                        aria-valuenow={Math.round(designProgress(p) * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${p.name} design progress`}
                        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-rule-soft"
                      >
                        <span
                          className="block h-full rounded-full bg-clinical transition-[width] duration-500"
                          style={{
                            width: `${Math.max(2, designProgress(p) * 100)}%`,
                          }}
                        />
                      </span>
                      <span className="num shrink-0 text-[11.5px] text-ink-soft">
                        {p.design}/{designNeeded(kind)}
                      </span>
                    </div>
                  )}

                  {/*
                    THE ESTIMATE.
                    A band, drawn against the certifier's line. This is the
                    only thing the player is ever told about the faults, and
                    the whole decision is made by looking at it.
                  */}
                  <div className="mt-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="sign text-[10.5px] text-ink-faint">
                        Faults in it, estimated
                      </span>
                      <span
                        className={`num text-[12px] ${
                          est.high <= tolerance
                            ? "text-good"
                            : est.low > tolerance
                              ? "text-alarm"
                              : "text-caution"
                        }`}
                      >
                        {est.low}–{est.high} · {confidenceOf(p)}% confident
                      </span>
                    </div>
                    <Band low={est.low} high={est.high} tolerance={tolerance} />
                    <p className="mt-1 text-[11.5px] text-ink-faint">
                      {est.high <= tolerance
                        ? "Comfortably inside what the certifier will accept."
                        : est.low > tolerance
                          ? "Almost certainly too many. More testing, or it will be refused."
                          : "It might pass and it might not. Testing narrows this."}
                    </p>
                  </div>

                  {p.stage === "shipped" && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span
                        className={
                          surfaceChance(p) > 0.25
                            ? "text-alarm"
                            : surfaceChance(p) > 0.1
                              ? "text-caution"
                              : "text-good"
                        }
                      >
                        {Math.round(surfaceChance(p) * 100)}% chance one
                        surfaces this week
                      </span>
                      <span className="text-ink-faint">
                        {money(faultCost(w, p))} each
                      </span>
                      <span className="text-ink-faint">
                        {Math.round(p.reach * 100)}% of the market
                      </span>
                      {p.surfaced > 0 && (
                        <span className="text-alarm">
                          {p.surfaced} outstanding
                        </span>
                      )}
                    </p>
                  )}

                  {/* What can be done with it now. */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!focused && (
                      <button
                        type="button"
                        onClick={() => onCommand("focusProduct", p.id)}
                        className="rounded border border-rule px-2.5 py-1 text-ink hover:border-clinical"
                      >
                        Put this on the bench
                      </button>
                    )}
                    {p.stage === "design" && designed && (
                      <button
                        type="button"
                        onClick={() => onCommand("beginTesting", p.id)}
                        className="rounded border border-rule px-2.5 py-1 text-ink hover:border-clinical"
                      >
                        Move it to the test rig
                      </button>
                    )}
                    {(p.stage === "testing" ||
                      (p.stage === "design" && designed)) && (
                      <button
                        type="button"
                        disabled={state.r.cash < kind.certCost}
                        onClick={() =>
                          onCommand("submitForCertification", p.id)
                        }
                        className="rounded border border-rule px-2.5 py-1 text-ink enabled:hover:border-clinical disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Submit for certification · {money(kind.certCost)}
                      </button>
                    )}
                    {p.stage === "shipped" && (
                      <button
                        type="button"
                        onClick={() => onCommand("recallProduct", p.id)}
                        className="rounded border border-rule-soft px-2.5 py-1 text-caution hover:border-alarm hover:text-alarm"
                      >
                        Recall it · {money(recallCost(w, p))}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onCommand("withdrawProduct", p.id)}
                      className="rounded border border-rule-soft px-2.5 py-1 text-ink-faint hover:border-alarm hover:text-alarm"
                    >
                      Drop it
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------- start something */}
      <section
        aria-labelledby="start-h"
        className="rounded-lg border border-rule bg-card p-4"
      >
        <h2 id="start-h" className="text-sm font-semibold text-ink">
          Start something new
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          The more it is worth building, the more of it there is to get wrong.
          Every week at the bench puts faults in that only testing takes out.
        </p>
        <ul className="mt-3 grid gap-1.5">
          {buildableKinds(100).map((k) => {
            const locked = state.r.skill < k.needsSkill;
            return (
              <li
                key={k.id}
                className="rounded border border-rule-soft px-3 py-2.5 text-xs"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-ink">{k.label}</span>
                  <span className="num text-ink-faint">
                    {money(
                      Math.round(k.revenue * workshopCityOf(w).revenueIndex),
                    )}
                    /wk at full market
                  </span>
                </div>
                <p className="mt-0.5 text-ink-faint">{k.blurb}</p>
                <p className="mt-1 text-ink-faint">
                  {k.designWeeks} weeks to design · certification{" "}
                  {money(k.certCost)} · a fault in the field costs about{" "}
                  {money(Math.round(k.faultCost * workshopCityOf(w).scrutiny))}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onCommand("startProduct", k.id)}
                    className="rounded-form border border-rule px-3 py-1.5 text-ink enabled:hover:border-clinical disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Start it
                  </button>
                  {locked && (
                    <span className="text-ink-faint">
                      Needs craft {k.needsSkill}; yours is{" "}
                      {Math.round(state.r.skill)}.
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/**
 * The estimate, drawn.
 *
 * A bar showing where the band sits against the certifier's tolerance. The
 * scale is fixed at twice the tolerance or the top of the band, whichever is
 * larger, so a wildly untested product visibly runs off the end rather than
 * being quietly rescaled into looking reasonable.
 */
function Band({
  low,
  high,
  tolerance,
}: {
  low: number;
  high: number;
  tolerance: number;
}) {
  const scale = Math.max(tolerance * 2, high, 1);
  const pct = (n: number) => `${Math.min(100, (n / scale) * 100)}%`;
  return (
    <div
      className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-rule-soft"
      role="img"
      aria-label={`Estimated between ${low} and ${high} faults, against a tolerance of ${tolerance}`}
    >
      {/* everything the certifier accepts */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-good/20"
        style={{ width: pct(tolerance) }}
      />
      {/* the band itself */}
      <span
        aria-hidden
        className={`absolute inset-y-0 rounded-full ${
          high <= tolerance ? "bg-good" : low > tolerance ? "bg-alarm" : "bg-caution"
        }`}
        style={{ left: pct(low), width: pct(Math.max(0.4, high - low)) }}
      />
      {/* the line it has to be under */}
      <span
        aria-hidden
        className="absolute inset-y-0 w-0.5 bg-ink"
        style={{ left: pct(tolerance) }}
      />
    </div>
  );
}
