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
  onNavigate,
}: {
  active: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}) {
  const section = sectionOf(active);
  if (section.screens.length <= 1) return null;

  return (
    <div className="mb-4">
      {
        <div
          role="tablist"
          aria-label={`${section.label} screens`}
          className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
        >
          {section.screens.map((screen) => {
            const isActive = screen.id === active;
            return (
              <button
                key={screen.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onNavigate(screen.id)}
                className={`sign min-h-[44px] shrink-0 rounded-form border px-4 text-[11.5px] transition ${
                  isActive
                    ? "border-clinical/60 bg-clinical-tint text-clinical"
                    : "border-rule bg-card text-ink-soft hover:border-clinical/40 hover:text-ink"
                }`}
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
