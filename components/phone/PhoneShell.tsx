"use client";

import type { ReactNode } from "react";

export type PhoneApp = "pulse" | "messages" | "news";

const APPS: { id: PhoneApp; label: string; glyph: string }[] = [
  { id: "pulse", label: "Pulse", glyph: "◎" },
  { id: "messages", label: "Messages", glyph: "✉" },
  { id: "news", label: "News", glyph: "▤" },
];

/**
 * The device itself: a status bar, a scrolling app area, and a dock.
 *
 * It reads as a phone without imitating any real one — same navy, same rules
 * and mono numerals as the rest of the command centre, just at handset scale
 * and with its own bezel.
 */
export function PhoneShell({
  week,
  app,
  onSelect,
  onClose,
  badges,
  children,
}: {
  week: number;
  app: PhoneApp;
  onSelect: (app: PhoneApp) => void;
  onClose: () => void;
  badges: Partial<Record<PhoneApp, number>>;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-paper">
      {/*
       * ONE status bar, not two.
       *
       * The dialog used to render a "Personal device / Close" strip and then
       * the shell rendered "WK n / Pulse OS / ▮▮▮" underneath it — two rows of
       * chrome stacked above any content, on a 400px-wide handset. A real
       * phone's status bar carries the state and nothing else, so the close
       * control lives in it rather than in a bar of its own.
       */}
      <div className="flex shrink-0 items-center gap-3 border-b border-rule/60 px-4 py-2">
        <span className="num text-[12px] text-ink-faint">WK {week}</span>
        <span className="sign flex-1 text-center text-[11.5px] text-clinical">
          Pulse OS
        </span>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1.5 min-h-[32px] rounded-form px-2.5 text-[12.5px] text-ink-soft transition hover:text-clinical"
        >
          Close
        </button>
      </div>

      {/* ---------------------------------------------------------- screen */}
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>

      {/* ------------------------------------------------------------ dock */}
      <nav
        aria-label="Phone apps"
        className="shrink-0 border-t border-rule/60 bg-card"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex">
          {APPS.map((a) => {
            const active = app === a.id;
            const count = badges[a.id] ?? 0;
            return (
              <li key={a.id} className="flex-1">
                <button
                  onClick={() => onSelect(a.id)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-[54px] w-full flex-col items-center justify-center gap-0.5 transition ${
                    active ? "text-clinical" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-x-6 top-0 h-0.5 rounded-full ${active ? "bg-clinical" : "bg-transparent"}`}
                  />
                  <span
                    className="relative text-[17px] leading-none"
                    aria-hidden
                  >
                    {a.glyph}
                    {count > 0 && (
                      <span className="absolute -right-2.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-alarm px-1 text-[11.5px] font-bold leading-none text-[#2A0808]">
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </span>
                  <span className="sign text-[11.5px] leading-none">
                    {a.label}
                  </span>
                  {count > 0 && (
                    <span className="sr-only">
                      {`${count} unread in ${a.label}`}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
