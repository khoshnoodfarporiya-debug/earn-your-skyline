"use client";

import { useEffect, useRef, useState } from "react";
import type { RunState } from "@/lib/game/types";
import { med } from "@/lib/game/careers/doctor";
import { unreadMessages, unreadNews } from "@/lib/game/medical/phone";
import { PhoneShell, type PhoneApp } from "./PhoneShell";
import { PulseApp } from "./PulseApp";
import { MessagesApp } from "./MessagesApp";
import { NewsApp } from "./NewsApp";

/**
 * The phone as a modal dialog.
 *
 * Full-bleed on mobile, a centred handset on desktop. Focus moves in, is
 * trapped, and returns to the button that opened it; Escape always closes,
 * because unlike the weekly review nothing here is a decision the run is
 * blocked on.
 *
 * Opening an app marks it read, which is the only mutation the phone makes
 * outside the composer — and it still goes through the command path.
 */
export function Phone({
  state,
  dispatch,
  onClose,
  returnFocusTo,
}: {
  state: RunState;
  dispatch: (cmd: string, arg: string) => void;
  onClose: () => void;
  returnFocusTo?: React.RefObject<HTMLElement | null>;
}) {
  const m = med(state);
  const [app, setApp] = useState<PhoneApp>(() =>
    unreadMessages(m) > 0 ? "messages" : unreadNews(m) > 0 ? "news" : "pulse",
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = "phone-title";

  // Mark the opened app read. Runs on app change as well as on open.
  useEffect(() => {
    if (app === "messages" && unreadMessages(m) > 0)
      dispatch("readMessages", "");
    if (app === "news" && unreadNews(m) > 0) dispatch("readNews", "");
    // dispatch and m are recreated each render; keying on the app and the
    // counts is what actually decides whether anything needs marking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, unreadMessages(m), unreadNews(m)]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* Resolved while the phone is open — see the note in WeekReview: reading
       the ref during cleanup can return a stale or unmounted node. */
    const focusOnClose = returnFocusTo?.current ?? previouslyFocused;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = priorOverflow;
      focusOnClose?.focus?.();
    };
  }, [onClose, returnFocusTo]);

  return (
    <div className="fade fixed inset-0 z-50 flex items-stretch justify-center bg-[#04080F]/75 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="phone-in flex h-full w-full flex-col overflow-hidden border-rule bg-paper sm:h-[min(760px,90vh)] sm:w-[400px] sm:rounded-[28px] sm:border-4 sm:shadow-lift"
      >
        <h2 id={headingId} className="sr-only">
          Phone — Pulse, Messages and News
        </h2>

        <div className="min-h-0 flex-1">
          <PhoneShell
            week={state.week}
            app={app}
            onSelect={setApp}
            onClose={onClose}
            badges={{
              messages: unreadMessages(m),
              news: unreadNews(m),
            }}
          >
            {app === "pulse" && <PulseApp state={state} dispatch={dispatch} />}
            {app === "messages" && (
              <MessagesApp state={state} dispatch={dispatch} />
            )}
            {app === "news" && <NewsApp state={state} />}
          </PhoneShell>
        </div>
      </div>
    </div>
  );
}
