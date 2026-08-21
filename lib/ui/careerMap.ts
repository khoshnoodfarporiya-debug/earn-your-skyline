import { CITY_POSITIONS } from "./worldmap.generated";

/**
 * WHERE A CAREER IS
 *
 * The Physician has a network: fourteen markets, licences, entry costs, a case
 * mix that changes with the city. The Chef and the Solicitor have **one**
 * place — but which one is now the player's, chosen before week one, and the
 * career's own tables say what each is worth.
 *
 * So this module no longer holds a hardcoded home for either career. It holds
 * the two things a map still needs and neither career's state carries: the
 * projected point for a place, and the sentence about what the map cannot yet
 * show. Everything else is read from `CareerDef.startCities`, which is where
 * the effects live — one source, and no way for the map to claim a city the
 * simulation does not have.
 *
 * The coordinates are borrowed from the projected positions the world map
 * already ships: real places on a real projection, no regeneration, no second
 * source of geography.
 */

/** The projected point for a position key, or null if the geography is missing. */
export const pointFor = (
  position: string,
): { x: number; y: number } | null => CITY_POSITIONS[position] ?? null;

/**
 * What the map cannot show yet, per career, said plainly rather than implied.
 *
 * A world map with one lit marker on it invites the question, and answering it
 * is cheaper than letting a player hunt for a second site that is not built.
 */
export const HORIZON: Record<string, string> = {
  chef: "One kitchen, and you do not move it. A second site — and the question of whether a brigade can run without you in the room — is not built yet.",
  lawyer:
    "One set of chambers, and you do not move them. Regional offices, and instructions that arrive from somewhere other than here, are not built yet.",
};

export const horizonFor = (careerId: string): string | null =>
  HORIZON[careerId] ?? null;
