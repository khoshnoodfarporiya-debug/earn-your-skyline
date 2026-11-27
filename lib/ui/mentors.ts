/**
 * THE MENTORS
 *
 * One person per career who has done the job, and who meets you at the start
 * of your first week with three short things to know. From the design pack's
 * "Opening guides" (Nov 2026): the rule that binds this career, one move worth
 * making in week one, and what to look for in the first week's review.
 *
 * This is the one place the game talks before you play, so it is kept to
 * three sentences you can skip. The lessons in `onboarding.ts` still do the
 * real teaching, on the screen each system lives on; the mentor's card simply
 * comes first on a new run, and the week's lesson follows once it is done.
 *
 * Every action named here is one the career really offers (its label in
 * `lib/game/careers/<career>.ts`), and every rule is one its engine really
 * applies, so the mentor never promises a mechanic that is not there.
 */

export interface Mentor {
  name: string;
  /** Square portrait, 256px. Masters in `art-source/visuals/characters/mentors/`. */
  portrait: string;
  /** Exactly three: the rule, a first move, what to read in the review. */
  lines: readonly [string, string, string];
}

const portrait = (careerId: string) =>
  `/visuals/characters/mentors/${careerId}.webp`;

export const MENTORS: Record<string, Mentor> = {
  doctor: {
    name: "Dr Maya Laurent",
    portrait: portrait("doctor"),
    lines: [
      "Patients arrive whether or not you have the department they need. Some will have to be referred.",
      "Give yourself time to see patients. Leave a block to study or rest if you can.",
      "In your first review, look at the referrals. Space, qualified staff and equipment each fix a different gap.",
    ],
  },
  chef: {
    name: "Luc Moreau",
    portrait: portrait("chef"),
    lines: [
      "Ingredients go off. The kitchen uses the oldest usable stock first, and stock ages even in a quiet week.",
      "Check the larder, then give prep enough time to supply the week's service.",
      "In your first review, look for food thrown away and diners turned away. Together they show where the kitchen is stretched.",
    ],
  },
  lawyer: {
    name: "Amira Haddad",
    portrait: portrait("lawyer"),
    lines: [
      "A busy desk can still leave you short of cash. Most fees arrive when a case settles.",
      "Find the nearest deadline and give casework its time before you fill the week with pitches.",
      "In your first review, read case progress next to your cash. An advance or a retainer changes when the money comes in.",
    ],
  },
  founder: {
    name: "Jules Park",
    portrait: portrait("founder"),
    lines: [
      "Runway is how many weeks your cash lasts at today's rate of spending.",
      "Put time into building or selling, then check the runway before you take on a weekly cost.",
      "In your first review, see whether revenue is starting to cover the burn. Investment buys time and costs you ownership.",
    ],
  },
  politician: {
    name: "Rosa Alvarez",
    portrait: portrait("politician"),
    lines: [
      "A good poll is a snapshot. Voters drift before polling day.",
      "Try canvassing or a surgery, and watch both the trend and the weeks left to the count.",
      "In your first review, see where support moved. Keep time for the ward as polling day gets closer.",
    ],
  },
  architect: {
    name: "Noor Saleh",
    portrait: portrait("architect"),
    lines: [
      "Commissions pay in stages, and a client can send unfinished work back.",
      "Give the commission time at the board, and make time to see the client.",
      "In your first review, read the stage and the cash together. A finished drawing and an earned fee are not the same thing.",
    ],
  },
  engineer: {
    name: "Dev Patel",
    portrait: portrait("engineer"),
    lines: [
      "A product can ship with faults nobody has found yet. The fault count you see is only an estimate.",
      "Book bench time and a test. Check how sure the estimate is before you deliver.",
      "Keep time for support after shipping. A quiet first week is weak evidence that the product is sound.",
    ],
  },
};

export function mentorFor(careerId: string): Mentor | null {
  return MENTORS[careerId] ?? null;
}

/** The id the mentor's card is filed under in the taught list (`loadTaught`). */
export const mentorLessonId = (careerId: string) => `mentor:${careerId}`;
