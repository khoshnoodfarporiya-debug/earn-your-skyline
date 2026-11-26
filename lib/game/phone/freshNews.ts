import type { NewsItem } from "../medical/types";

/**
 * KEEPING THE PHONE'S NEWS FROM REPEATING ITSELF
 *
 * Every phone has a few "filler" stories: trade-press colour drawn at random
 * when nothing in the run made the news. Drawn blind from a pool of three,
 * the same story came back week after week (the Chef's sous chef survey ran
 * at weeks 4, 5 and 6 in one beta save).
 *
 * The rule: a filler story is not re-run while it ran in the last
 * `NEWS_REPEAT_WEEKS` weeks, nor when it is still the newest item on the
 * list (so a quiet stretch cannot show it twice in a row). It needs no new
 * save field, because the phone's own news list, newest first, is the record
 * of what ran. When every story in the pool is excluded, nothing is posted
 * that week, which is better than a rerun.
 *
 * Stories that report something the run actually did (a verdict, an outbreak,
 * a rival's move) are not filler and do not go through here.
 */
export const NEWS_REPEAT_WEEKS = 10;

/**
 * True when a story with this headline ran within the repeat window, or is
 * the newest item on the list. `news` is newest first, as every phone keeps it.
 */
export function ranRecently(
  news: readonly Pick<NewsItem, "headline" | "week">[],
  headline: string,
  week: number,
): boolean {
  return (
    news[0]?.headline === headline ||
    news.some((n) => n.headline === headline && n.week > week - NEWS_REPEAT_WEEKS)
  );
}

/**
 * Pick one story from `pool` that has not run recently, or null when they all
 * have. `roll` is a number in [0, 1) the caller has already drawn, so the
 * caller's stream advances the same way whatever is picked.
 */
export function pickFreshStory<T extends { headline: string }>(
  pool: readonly T[],
  news: readonly Pick<NewsItem, "headline" | "week">[],
  week: number,
  roll: number,
): T | null {
  const fresh = pool.filter((item) => !ranRecently(news, item.headline, week));
  if (fresh.length === 0) return null;
  return fresh[Math.floor(roll * fresh.length)] ?? null;
}
