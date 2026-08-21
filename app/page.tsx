"use client";

import { useEffect, useState } from "react";
import type { RunState } from "@/lib/game/types";
import { getCareer } from "@/lib/game/careers";
import { startRun } from "@/lib/game/engine";
import { clearRun, loadRun, saveRun } from "@/lib/game/save";
import { CareerSelect } from "@/components/CareerSelect";
import { Game } from "@/components/Game";

export default function Page() {
  const [run, setRun] = useState<RunState | null>(null);
  const [savedRun, setSavedRun] = useState<RunState | null>(null);
  const [ready, setReady] = useState(false);

  // localStorage is only available client-side, so the first paint is the
  // career select either way; this just decides whether to offer "continue".
  useEffect(() => {
    setSavedRun(loadRun());
    setReady(true);
  }, []);

  const update = (next: RunState) => {
    setRun(next);
    saveRun(next);
  };

  /*
   * `city` is where the run begins, for a career that offers a choice. It is
   * passed straight through to `startRun`, which resolves an unknown id to
   * the career's default rather than starting a run half-placed.
   */
  const begin = (careerId: string, city?: string) => {
    const career = getCareer(careerId);
    if (!career) return;
    const fresh = startRun(career, undefined, { city });
    clearRun();
    update(fresh);
  };

  /*
   * A run whose career no longer exists cannot be rendered. `loadRun` now
   * rejects unknown career ids outright, so this is only reachable if a run
   * held in memory somehow outlives its career — but it must still not blank
   * the screen, and it must not clear storage or set state while rendering.
   *
   * Both of those were happening here before: `clearRun()` and `setRun(null)`
   * ran during render and returned `null`, which is a side effect in the
   * render phase and a blank page for the user. The cleanup is now an effect
   * and the fallback is the career select, which is always something.
   */
  const career = run ? getCareer(run.careerId) : undefined;
  const orphaned = run !== null && career === undefined;

  useEffect(() => {
    if (!orphaned) return;
    clearRun();
    setSavedRun(null);
    setRun(null);
  }, [orphaned]);

  if (!ready) return <div className="min-h-screen" />;

  // `!career` rather than `orphaned` so the type narrows here too.
  if (!run || !career) {
    return (
      <CareerSelect
        // An orphaned run must not be offered back to the player.
        hasSave={!orphaned && !!savedRun && !savedRun.outcome}
        onContinue={() => savedRun && setRun(savedRun)}
        onPick={begin}
      />
    );
  }

  return (
    <Game
      career={career}
      state={run}
      setState={update}
      /* Same career, same city. A restart is another go at the run you
         chose, not a silent move back to the default market. */
      onRestart={() => begin(career.id, run.startCity)}
      onMenu={() => {
        setSavedRun(run.outcome ? null : run);
        setRun(null);
      }}
    />
  );
}
