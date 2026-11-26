/**
 * THE BETA, AND WHAT CHANGED IN IT.
 *
 * The game is in beta until it ships (owner's decision, 26 Nov 2026). Every
 * update a player can notice gets an entry at the TOP of `CHANGELOG`, in
 * plain words a player would understand, and `APP_VERSION` moves with it.
 * `package.json` carries the same version; an engine check keeps them equal.
 *
 * Numbering: each beta update bumps the last number — 0.9.0-beta.1,
 * 0.9.0-beta.2, and so on — until the owner calls a release, which is 1.0.0.
 */
export const APP_VERSION = "0.9.0-beta.1";

export interface ChangelogEntry {
  version: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.9.0-beta.1",
    date: "2026-11-26",
    changes: [
      "The first beta. You can add the game to your iPhone home screen and it opens full screen, like an app.",
      "A new logo: one lit window in a tower at dusk. Your place in the city.",
      "New lettering: an editorial serif for headings and clearer numbers, plus bigger, clearer buttons. The planner's + and − are easier to tap.",
      "Controls now look like what they do: buttons act, round pills pick an option, and underlined tabs switch screens.",
      "Every career now opens its week on its own picture, not a doctor's.",
      "New colours: warm lamplight instead of hospital teal, and a quieter colour of its own for every career.",
      "Every Founder, Politician, Architect and Engineer event now has its own picture.",
      "Reach your career's goal and retire, and the end screen shows your career's own victory scene.",
      "The week planner is a compact list; tap an action to see everything it does.",
      "On a computer, the commit button stays on screen while you plan.",
      "Kitchens that run out of money can now recover, and staff wages are fairer.",
      "Elections can be lost: support has a ceiling, time in office costs goodwill, and polling day has a mood of its own.",
    ],
  },
];
