"use client";

import { useEffect, useRef, useState } from "react";
import { APP_VERSION, CHANGELOG } from "@/lib/version";

/**
 * "BETA" and the version, as a button that opens what changed.
 *
 * Shown on the title screen and in the game header, so a player always knows
 * this is a beta and which build they are on — the first thing anybody
 * reporting a problem needs. The list is a native <dialog> opened with
 * `showModal()`: the browser traps focus, makes the page behind it inert and
 * closes it on Escape, with nothing hand-rolled to get wrong.
 */
export function BetaBadge({ className = "" }: { className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  /*
   * The list is only in the page while it is open. A closed <dialog> is
   * hidden but its text is still in the DOM, where it answers every text
   * search on the screen behind it — a changelog line about kitchens that
   * "recover" was matching a test looking for a setback's recovery routes.
   */
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-form border border-gold/40 bg-gold-tint px-2 text-[11px] text-gold transition hover:border-gold ${className}`}
      >
        <span className="sign font-semibold">Beta</span>
        <span className="num text-gold/80">v{APP_VERSION}</span>
        <span className="sr-only">— what&apos;s new</span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="whats-new-title"
        className="w-[min(92vw,30rem)] rounded-lg border border-rule bg-card p-0 text-ink backdrop:bg-black/70"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          /* A tap on the backdrop closes it, as every other sheet does. */
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        {open && (
          <>
            <div className="form-head flex items-baseline justify-between px-5 py-3">
              <h2 id="whats-new-title" className="t-card">
                What&apos;s new
              </h2>
              <span className="num text-[12px] text-ink-faint">
                v{APP_VERSION}
              </span>
            </div>
            <div className="scroll-thin max-h-[65vh] overflow-y-auto px-5 py-4">
              <p className="text-[13px] leading-relaxed text-ink-soft">
                Earn Your Skyline is in beta. Things will change between
                updates, and your saves are kept on this device.
              </p>
              {CHANGELOG.map((entry) => (
                <section key={entry.version} className="mt-4">
                  <h3 className="sign text-[11.5px] text-ink-faint">
                    {entry.version} · {entry.date}
                  </h3>
                  <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-[13.5px] leading-snug text-ink-soft">
                    {entry.changes.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <div className="border-t border-rule-soft p-3">
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="min-h-[44px] w-full rounded-form border border-rule text-[14px] font-medium transition hover:border-clinical hover:text-clinical"
              >
                Close
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
