"use client";

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
  if (section.screens.length <= 1) return null;

  return (
    <div className="mb-4">
      {
        <div
          role="tablist"
          aria-label={`${section.label} screens`}
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
