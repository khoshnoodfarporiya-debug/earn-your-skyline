"use client";

import type { Alert } from "@/lib/ui/alerts";
import type { Step } from "@/lib/ui/guidance";
import type { ScreenId } from "@/lib/ui/navigation";

/**
 * NEEDS YOU
 *
 * The warnings and the one suggested next step, as one list: one row each,
 * the action inline. They used to be two or three separate full-width cards
 * (AlertStack, then NextStep), each with its own button stretched across a
 * phone, which pushed the week's plan most of a screen down. One card with
 * rows reads as one to-do list, which is what it is (iPhone Week prototype,
 * Nov 2026).
 *
 * The severity is said in words as well as colour and glyph, so it never
 * depends on telling orange from red.
 */

const STYLE = {
  critical: { text: "text-alarm", ring: "border-alarm/60", glyph: "!", word: "Critical" },
  warning: { text: "text-caution", ring: "border-caution/60", glyph: "▲", word: "Warning" },
  info: { text: "text-ink-soft", ring: "border-rule", glyph: "i", word: "Note" },
} as const;

export function NeedsYou({
  alerts,
  remaining = 0,
  step,
  onNavigate,
  onDismissStep,
}: {
  alerts: Alert[];
  /** Alerts filed behind the navigation badges rather than shown here. */
  remaining?: number;
  step: Step | null;
  onNavigate: (screen: ScreenId) => void;
  onDismissStep: (id: string) => void;
}) {
  /* "2 blocks still unassigned" is what the commit bar's dots and its label
     already say, right beside the button; a second copy here is noise. */
  const shownStep = step && step.id !== "allocate:partial" ? step : null;
  if (alerts.length === 0 && !shownStep) return null;

  return (
    <section aria-labelledby="needs-you-title" className="form overflow-hidden">
      <h2
        id="needs-you-title"
        className="sign px-4 pb-1 pt-3 text-[11.5px] text-ink-faint"
      >
        Needs you
      </h2>

      {alerts.length > 0 && (
        /* A named region of its own, so the alerts can be found apart from
           the next step: the guidance tests count its buttons. */
        <section aria-label="Needs attention">
        <ul>
          {alerts.map((alert, i) => {
            const s = STYLE[alert.severity];
            return (
              <li
                key={alert.id}
                className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? "border-t border-rule-soft" : ""}`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold ${s.ring} ${s.text}`}
                >
                  {s.glyph}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`sign text-[11px] ${s.text}`}>
                    {s.word}
                    <span className="sr-only">: </span>
                  </p>
                  <p className="text-[15px] font-semibold leading-snug text-ink">
                    {alert.title}
                  </p>
                  <p className="mt-0.5 text-[13.5px] leading-snug text-ink-soft">
                    {alert.detail}
                  </p>
                  <button
                    onClick={() => onNavigate(alert.destination)}
                    className="btn btn-sm btn-secondary mt-2.5"
                  >
                    {alert.actionLabel}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        </section>
      )}

      {shownStep && (
        <aside
          aria-label="Suggested next step"
          className={`flex items-start gap-3 px-4 py-3 ${alerts.length > 0 ? "border-t border-rule-soft" : ""}`}
        >
          <span
            aria-hidden
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-clinical/60 text-[13px] font-bold text-clinical"
          >
            →
          </span>
          <div className="min-w-0 flex-1">
            <p className="sign text-[11px] text-clinical">Next step</p>
            <p className="text-[15px] font-semibold leading-snug text-ink">
              {shownStep.title}
            </p>
            <p className="mt-0.5 text-[13.5px] leading-snug text-ink-soft">
              {shownStep.detail}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {shownStep.destination && shownStep.actionLabel && (
                <button
                  onClick={() => onNavigate(shownStep.destination!)}
                  className="btn btn-sm btn-primary"
                >
                  {shownStep.actionLabel}
                </button>
              )}
              <button
                onClick={() => onDismissStep(shownStep.id)}
                className="btn btn-sm btn-quiet"
              >
                Got it
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* The rest are not hidden, they are filed. Saying so is the difference
          between a shortened list and a list that looks broken. */}
      {remaining > 0 && (
        <p className="border-t border-rule-soft px-4 py-2.5 text-[12.5px] text-ink-faint">
          {remaining} more thing{remaining === 1 ? "" : "s"} need
          {remaining === 1 ? "s" : ""} attention. The badges on the navigation
          say where.
        </p>
      )}
    </section>
  );
}
