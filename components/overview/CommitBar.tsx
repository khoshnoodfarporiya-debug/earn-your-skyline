"use client";

/**
 * The primary action, pinned within thumb reach on mobile.
 *
 * The weekly allocation list is long enough that the commit button sat about
 * 1,700px down the page — the single most important control in the game, five
 * screens below the fold. On mobile it now rides above the nav bar with the
 * two numbers needed to decide whether to press it. On desktop this is hidden,
 * and the Week screen pins its own commit card at the top of the right column
 * (see `Overview`).
 *
 * The time left is drawn as the week itself: one dot per block, lit while it
 * is still free (iPhone Week prototype, Nov 2026). It used to be a number in
 * the status strip at the top of the screen, far from the button that spends
 * it.
 */
export function CommitBar({
  spent,
  budget,
  headline,
  onCommit,
}: {
  spent: number;
  budget: number;
  /** The projected-net figure from the briefing, if the career supplies one. */
  headline?: { label: string; value: string; tone: "good" | "bad" | "neutral" };
  onCommit: () => void;
}) {
  const remaining = budget - spent;
  const ready = spent > 0;

  return (
    <div
      /* Hides at the same breakpoint the bottom nav does, or it would float
         above empty space on tablet. */
      className="fixed inset-x-0 bottom-[56px] z-30 border-t border-rule bg-[#0d1729]/95 px-4 py-2.5 backdrop-blur lg:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {budget > 0 && budget <= 12 && (
              <span aria-hidden className="flex gap-[4px]">
                {Array.from({ length: budget }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-2 rounded-full ${i < remaining ? "bg-clinical" : "bg-rule"}`}
                  />
                ))}
              </span>
            )}
            <p className="sign text-[11.5px] text-ink-faint">
              {remaining === 0 ? "Week planned" : `${remaining} of ${budget} free`}
            </p>
          </div>
          {headline && (
            <p
              className={`num truncate text-[15px] font-semibold leading-tight ${
                headline.tone === "good"
                  ? "text-good"
                  : headline.tone === "bad"
                    ? "text-alarm"
                    : "text-ink"
              }`}
            >
              {headline.value}
              <span className="ml-1.5 text-[12px] font-normal text-ink-faint">
                {headline.label.toLowerCase()}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={onCommit}
          disabled={!ready}
          className="btn btn-primary btn-lg shrink-0"
        >
          {ready ? "Commit week" : "Assign time"}
        </button>
      </div>
    </div>
  );
}
