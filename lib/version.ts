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
export const APP_VERSION = "0.9.0-beta.5";

export interface ChangelogEntry {
  version: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.9.0-beta.5",
    date: "2026-11-28",
    changes: [
      "Your week is planned for you: every week arrives with a recommended plan and one line on why. Press Commit, pick another plan in one tap, or change it block by block.",
      "On your first week, your mentor shows you around: they point at your money, your plan and the Commit button, one step at a time. You can skip it.",
      "Fixed: on a phone, the Commit button on the Week screen could end up at the bottom of the page instead of the bottom of the screen.",
    ],
  },
  {
    version: "0.9.0-beta.4",
    date: "2026-11-27",
    changes: [
      "Every career now has a mentor who meets you at the start of your first week: three short tips you can skip, and reread any time under \"More this week\".",
      "Smoother screens: switching screens, opening a row and changing your plan now move gently, and a number that changes glows once so you can see what moved. Turn on Reduce Motion to switch it off.",
      "Clearer controls: every career has its own icon, tabs that run off the edge fade instead of cutting words, and the plan bar on every screen says \"Plan the week\".",
      "On a computer, the planner beside each screen no longer squeezes action names onto one word a line.",
      "Every career's screens now open the same way: the section, the title and one line on what the screen is for. The Physician's warnings are calmer cards, like \"Needs you\" on the Week screen.",
    ],
  },
  {
    version: "0.9.0-beta.3",
    date: "2026-11-26",
    changes: [
      "A calmer Week screen: what needs you is one short list, your week comes straight after it, and the goal, the loan and the history fold away until you want them.",
      "The week and your city are under your name at the top of every screen.",
      "Your phone's news no longer runs the same story week after week.",
    ],
  },
  {
    version: "0.9.0-beta.2",
    date: "2026-11-26",
    changes: [
      "New lettering: an editorial serif for headings and clearer numbers, plus bigger, clearer buttons. The planner's + and − are easier to tap.",
      "Controls now look like what they do: buttons act, round pills pick an option, and underlined tabs switch screens.",
      "The week's free time shows as a row of dots, lit for every block still to plan.",
      "Calmer spacing: every screen has the same breathing room, and wider margins on a phone.",
      "On a small iPhone the phone button no longer slips off the edge of the screen.",
    ],
  },
  {
    version: "0.9.0-beta.1",
    date: "2026-11-26",
    changes: [
      "The first beta. You can add the game to your iPhone home screen and it opens full screen, like an app.",
      "A new logo: one lit window in a tower at dusk. Your place in the city.",
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
