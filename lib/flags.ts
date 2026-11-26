/**
 * FEATURE FLAGS FOR THE BETA.
 *
 * Unfinished features can be merged into the `beta` branch switched off, so
 * the beta stays playable while they are built. Each flag says what it gates
 * and what has to exist before it can be turned on. Read them through
 * `isEnabled`, never by importing the object and mutating it.
 *
 * All flags are off. Turning one on is a product decision, recorded in
 * docs/COMMUNICATION.md when it happens.
 */
export const FLAGS = {
  /**
   * Careers behind a paid unlock. Needs real login and a payment provider
   * (Apple In-App Purchase inside an iOS app; see WORKING_PLAN section 7).
   * While off, every career is free.
   */
  paidCareers: false,
  /** Accounts on a server and saves that follow the player. Needs a backend. */
  cloudSaves: false,
  /** The in-game feedback button. Needs a destination chosen by the owner. */
  feedback: false,
} as const;

export type FlagName = keyof typeof FLAGS;

export const isEnabled = (flag: FlagName): boolean => FLAGS[flag];
