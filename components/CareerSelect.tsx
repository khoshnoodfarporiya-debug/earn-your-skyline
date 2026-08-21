"use client";

import Image from "next/image";
import { useState } from "react";
import { CAREER_PREVIEWS, getCareer } from "@/lib/game/careers";
import { careerVisual } from "@/lib/ui/visuals";
import { CareerIcon } from "./Icons";
import { ArtFrame } from "./visuals/ArtFrame";
import { StartCityPicker } from "./StartCityPicker";

/**
 * Career selection.
 *
 * Each career is a card with cover art, the fantasy, what it hands you and
 * what kills you — enough to choose on without opening the game. Selecting a
 * card arms it; a second press, or the Begin button, moves on to *where* you
 * start. That two step exists so the detail is readable before committing on a
 * phone, where the card cannot show everything at once.
 *
 * Two questions, two screens: which life, then which city. They are separate
 * because they are separate decisions — the city changes what the work is
 * worth and what it costs to be there, and asking both at once on a phone
 * would mean neither could be read properly.
 *
 * Closed careers are still legible: they are `disabled`, marked as such, and
 * carry the same information, because "why can't I play this" is a question
 * the screen should answer.
 */
export function CareerSelect({
  onPick,
  hasSave,
  onContinue,
}: {
  onPick: (careerId: string, cityId?: string) => void;
  hasSave: boolean;
  onContinue: () => void;
}) {
  const [armed, setArmed] = useState<string | null>(null);
  /* The career whose start city is being chosen, if we are on that step. */
  const [placing, setPlacing] = useState<string | null>(null);

  const placingCareer = placing ? getCareer(placing) : undefined;
  if (placingCareer && (placingCareer.startCities?.length ?? 0) > 0) {
    return (
      <StartCityPicker
        careerLabel={placingCareer.label}
        cities={placingCareer.startCities!}
        onBegin={(cityId) => onPick(placingCareer.id, cityId)}
        onBack={() => setPlacing(null)}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 py-14 sm:px-8">
      <header className="rise">
        <div className="flex items-baseline gap-3">
          <span className="sign text-[12px] text-clinical">
            A career tycoon
          </span>
          <span className="h-px flex-1 bg-rule" />
          <span className="num text-[12px] text-ink-faint">SELECT CAREER</span>
        </div>

        {/*
         * The wordmark is the heading, not a picture beside one.
         *
         * `alt` carries the name, so the <h1> has a real accessible name and a
         * screen reader hears "Earn Your Skyline, heading level 1" — which is
         * what a text heading would have given. An empty alt here would leave
         * the document with an unnamed top-level heading.
         *
         * The box is reserved at its rendered ratio so the cards below do not
         * jump when it decodes, and it is `priority` because it is the largest
         * thing above the fold on the first screen anybody sees.
         */}
        <h1 className="mt-6">
          <Image
            src="/visuals/brand/logo-lockup.webp"
            alt="Earn Your Skyline"
            width={1607}
            height={656}
            sizes="(min-width: 640px) 480px, 88vw"
            priority
            className="h-auto w-[88vw] max-w-[420px] sm:max-w-[480px]"
          />
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
          Pick a life, not a business. Each career runs on its own rules — its
          own resources, its own ways of coming apart. Nothing here ends your
          run except you deciding it is finished.
        </p>
      </header>

      {hasSave && (
        <button
          onClick={onContinue}
          className="rise mt-7 w-fit rounded-form border border-clinical bg-clinical px-5 py-2.5 text-sm font-medium text-on-accent transition hover:brightness-110"
        >
          Continue your run
        </button>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAREER_PREVIEWS.map((c, i) => {
          const selected = armed === c.id;
          return (
            <button
              key={c.id}
              type="button"
              disabled={!c.available}
              aria-pressed={c.available ? selected : undefined}
              onClick={() => {
                if (!c.available) return;
                /* Armed already: on to where. A career with nowhere to choose
                   between starts immediately, which is what a career with one
                   place has always done. */
                if (selected) {
                  const def = getCareer(c.id);
                  if ((def?.startCities?.length ?? 0) > 0) setPlacing(c.id);
                  else onPick(c.id);
                } else {
                  setArmed(c.id);
                }
              }}
              style={{ animationDelay: `${i * 70}ms` }}
              className={`rise group flex flex-col overflow-hidden rounded-form border text-left outline-none transition-[border-color,box-shadow,transform] duration-200 motion-reduce:transition-none ${
                c.available
                  ? selected
                    ? "-translate-y-0.5 border-clinical shadow-[0_0_0_1px_rgba(53,224,192,0.5),0_10px_30px_-12px_rgba(53,224,192,0.45)]"
                    : "border-rule hover:-translate-y-0.5 hover:border-clinical/70 focus-visible:border-clinical focus-visible:shadow-[0_0_0_2px_rgba(53,224,192,0.55)]"
                  : "cursor-not-allowed border-rule-soft opacity-70"
              }`}
            >
              {/* Cover. Cropped, never stretched, with a scrim under the name. */}
              <ArtFrame
                visual={careerVisual(c.id)}
                ratio="aspect-[16/10]"
                scrim="bottom"
                sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                /*
                 * Every cover is eager, and that is the point rather than an
                 * oversight.
                 *
                 * Whichever one the browser picks as the Largest Contentful
                 * Paint must not be lazy, and which one it picks is not
                 * predictable: it moves with the viewport, with the row the
                 * grid happens to wrap at, and with what is already cached.
                 * Marking only the first left Next warning about the third;
                 * marking the first three left it warning about the seventh
                 * once more cards were added. There is nothing else competing
                 * for bandwidth on this screen, so the honest answer is that
                 * all of them load.
                 */
                priority
                /* The source art is night-lit; a small lift keeps the subject
                   readable under the caption scrim. */
                imageClassName={`brightness-[1.18] contrast-[1.05] transition-transform duration-500 motion-reduce:transition-none ${
                  c.available
                    ? "group-hover:scale-[1.04]"
                    : "grayscale brightness-[0.9]"
                }`}
              >
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11.5px] tracking-widest ${
                      c.available
                        ? "border-clinical/60 bg-[#070E19]/70 text-clinical"
                        : "border-rule bg-[#070E19]/70 text-ink-faint"
                    }`}
                  >
                    {c.available ? "OPEN" : "CLOSED"}
                  </span>
                  <span
                    className={c.available ? "text-clinical" : "text-ink-faint"}
                  >
                    <CareerIcon name={c.icon} />
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
                  <h2 className="display text-2xl leading-none">{c.label}</h2>
                  <span className="sign shrink-0 text-[11.5px] text-caution">
                    {c.difficulty}
                  </span>
                </div>
              </ArtFrame>

              <div className="flex flex-1 flex-col bg-card p-4">
                <p className="text-[14px] leading-relaxed text-ink-soft">
                  {c.tagline}
                </p>

                <dl className="mt-3.5 space-y-2.5">
                  <div>
                    <dt className="sign text-[11.5px] text-good">
                      You start with
                    </dt>
                    <dd>
                      <ul className="mt-1 space-y-1">
                        {c.advantages.map((a) => (
                          <li
                            key={a}
                            className="flex gap-1.5 text-[13px] leading-snug text-ink"
                          >
                            <span aria-hidden className="text-good">
                              +
                            </span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt className="sign text-[11.5px] text-alarm">
                      What can go wrong
                    </dt>
                    <dd>
                      <ul className="mt-1 space-y-1">
                        {c.risks.map((r) => (
                          <li
                            key={r}
                            className="flex gap-1.5 text-[13px] leading-snug text-ink"
                          >
                            <span aria-hidden className="text-alarm">
                              −
                            </span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>

                <div className="mt-3.5 flex-1 border-t border-rule-soft pt-3">
                  <p className="sign text-[11.5px] text-ink-faint">The rule</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
                    {c.distinctRule}
                  </p>
                </div>

                <span
                  className={`sign mt-4 inline-flex items-center gap-1.5 rounded-form px-3 py-2 text-[12px] transition ${
                    !c.available
                      ? "bg-paper text-ink-faint"
                      : selected
                        ? "bg-clinical text-on-accent"
                        : "bg-paper text-clinical group-hover:bg-clinical-tint"
                  }`}
                >
                  {!c.available
                    ? "Not built yet"
                    : selected
                      ? "Choose where →"
                      : "Select"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-8 max-w-xl text-xs leading-relaxed text-ink-faint">
        Architect, Founder, Politician and Engineer are designed, not built.
        The engine already supports them — each is one{" "}
        <span className="num">CareerDef</span> away.
      </p>
    </main>
  );
}
