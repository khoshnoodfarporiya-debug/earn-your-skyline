"use client";

import { useEffect, useRef, useState } from "react";
import { sectionOf, type ScreenId } from "@/lib/ui/navigation";

/**
 * Sub-navigation within a section: the sibling screens, and nothing else.
 *
 * It used to also print the current screen's static purpose line. That moved
 * to `ScreenHeader`, which prints the same sentence *and* what is currently
 * true underneath it — two copies of the purpose, one immediately above the
 * other, was the single largest piece of redundancy on these screens. A
 * section with one screen now renders nothing at all rather than a lone
 * sentence of chrome.
 */
export function SectionNav({
  active,
  careerId,
  onNavigate,
}: {
  active: ScreenId;
  /* Which career is looking. Two careers can share a screen id — `home` is
     both the Solicitor's whole map and the first of the Chef's two — and the
     sibling screens are different in each. */
  careerId: string;
  onNavigate: (screen: ScreenId) => void;
}) {
  const section = sectionOf(active, careerId);
  const rowRef = useRef<HTMLDivElement>(null);
  /* Which edges have more tabs past them. The row fades on that side, so a
     tab cut by the screen edge reads as "more this way", not a broken word. */
  const [more, setMore] = useState({ left: false, right: false });
  const measure = () => {
    const el = rowRef.current;
    if (!el) return;
    setMore({
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  };
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    /* The current tab in view, without moving the page. */
    const on = el.querySelector<HTMLElement>('[aria-selected="true"]');
    if (on) {
      const left = on.offsetLeft - el.offsetLeft;
      if (left < el.scrollLeft || left + on.offsetWidth > el.scrollLeft + el.clientWidth) {
        el.scrollLeft = Math.max(0, left - 24);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);
  if (section.screens.length <= 1) return null;

  return (
    <div className="mb-4">
      {
        <div
          role="tablist"
          aria-label={`${section.label} screens`}
          ref={rowRef}
          onScroll={measure}
          data-more-left={more.left || undefined}
          data-more-right={more.right || undefined}
          className="tab-row -mx-1 px-1"
        >
          {section.screens.map((screen) => {
            const isActive = screen.id === active;
            return (
              <button
                key={screen.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onNavigate(screen.id)}
                className={`tab shrink-0 ${isActive ? "is-on" : ""}`}
              >
                {screen.label}
              </button>
            );
          })}
        </div>
      }
    </div>
  );
}
