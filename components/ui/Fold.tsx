"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A row that opens to show more: the goal's paragraph, the loan, recent
 * weeks, the case notes. Kept on the screen as one line each, so the week's
 * decision is not pushed below them, and opened when the player wants them.
 *
 * Native `<details>`: the browser handles the keyboard, the open state and
 * what a screen reader announces ("collapsed"/"expanded"), with nothing to
 * keep in sync. Stack several inside one `.form` card; each draws the
 * hairline above itself except the first.
 */
export function Fold({
  label,
  hint,
  hintClass = "text-ink-faint",
  openOnDesktop = false,
  children,
}: {
  label: string;
  /** A short figure on the right of the closed row, so it still says something. */
  hint?: ReactNode;
  hintClass?: string;
  /** Start open on a wide screen (1024px and up), where there is room for
      it beside the week; closed on a phone. The player can still toggle it. */
  openOnDesktop?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (openOnDesktop && ref.current && window.matchMedia("(min-width: 1024px)").matches) {
      ref.current.open = true;
    }
  }, [openOnDesktop]);

  return (
    <details ref={ref} className="group border-t border-rule-soft first:border-t-0">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-3 px-4 transition hover:bg-card-high focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clinical [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">
          {label}
        </span>
        {hint !== undefined && (
          <span className={`num truncate text-[13px] ${hintClass}`}>{hint}</span>
        )}
        <span
          aria-hidden
          className="text-[20px] leading-none text-ink-faint transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none"
        >
          ›
        </span>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
