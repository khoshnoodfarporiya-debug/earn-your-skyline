/**
 * THE TOP OF A SCREEN, THE SAME IN EVERY CAREER
 *
 * The section in small capitals, the screen's name, one line on what it is
 * for. Every career's screens open this way, the Physician's included.
 *
 * Before (Nov 2026) there were two styles: the Physician had a "Work / Build"
 * breadcrumb over a bolder title, and the other six careers had a plain
 * serif title with a smaller grey line. One component now draws both, so
 * a player who learns one career's screens has learned how all of them read.
 * The small capitals are the same kicker the Week hero and the section
 * banners use.
 */
export function ScreenTitle({
  kicker,
  title,
  purpose,
}: {
  /** The section this screen belongs to: Work, World, Career, Life. */
  kicker?: string;
  title: string;
  purpose?: string;
}) {
  return (
    <div>
      {kicker && <p className="sign text-[11px] text-clinical">{kicker}</p>}
      <h1 className="display mt-0.5 text-[22px] leading-tight text-ink">
        {title}
      </h1>
      {purpose && (
        <p className="mt-1 max-w-[68ch] text-[13.5px] leading-snug text-ink-soft">
          {purpose}
        </p>
      )}
    </div>
  );
}
