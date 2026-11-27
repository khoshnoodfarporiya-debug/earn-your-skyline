"use client";

import { useState } from "react";
import Image from "next/image";
import type { Mentor } from "@/lib/ui/mentors";

/**
 * MEET YOUR MENTOR
 *
 * Three short cards at the top of a new run's first Week, one at a time, from
 * the person who has done this job before (design pack, Nov 2026).
 *
 * Not a modal, for the reason `LessonCard` gives: a modal stops the game to
 * talk about the game. This sits on the Week screen with the plan already
 * live underneath it, so a player can skip it, read it, or simply scroll
 * past it and start assigning time. Skipping and finishing do the same thing:
 * file it as met, so it does not come back. It is always there to reread
 * under "More this week".
 */
export function MentorIntro({
  mentor,
  onDone,
}: {
  mentor: Mentor;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const last = i === mentor.lines.length - 1;

  return (
    <section aria-labelledby="mentor-name" className="form overflow-hidden">
      <div className="flex items-center gap-3.5 px-4 pt-4 sm:px-5">
        <Image
          src={mentor.portrait}
          alt=""
          width={64}
          height={64}
          className="h-16 w-16 shrink-0 rounded-full border border-rule object-cover"
        />
        <div className="min-w-0">
          {/* The constraint is the first card's subject, so the label is
              just the role: with it, the line wrapped on a 375px phone. */}
          <p className="sign text-[11px] text-clinical">Your mentor</p>
          <h2 id="mentor-name" className="display mt-0.5 text-[21px] leading-tight text-ink">
            {mentor.name}
          </h2>
        </div>
      </div>

      {/* Polite, so a screen reader hears the next card when Continue is
          pressed without the focus having to move off the button. */}
      <p
        key={i}
        aria-live="polite"
        className="swap-in display px-4 pt-3.5 text-[17px] leading-snug text-ink sm:px-5"
      >
        “{mentor.lines[i]}”
      </p>

      <div className="flex items-center gap-2 px-4 pb-4 pt-3.5 sm:px-5">
        <p className="num text-[12.5px] text-ink-faint">
          {i + 1} of {mentor.lines.length}
        </p>
        <div className="ml-auto flex gap-2">
          {!last && (
            <button type="button" onClick={onDone} className="btn btn-sm btn-quiet">
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? onDone() : setI(i + 1))}
            className="btn btn-sm btn-secondary"
          >
            {last ? "Start planning" : "Continue"}
          </button>
        </div>
      </div>
    </section>
  );
}
