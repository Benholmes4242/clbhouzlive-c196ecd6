/**
 * BRIEF_CLUB_ANALYTICS_TAB — the named constants.
 *
 * Every threshold this tab leans on lives here so Ben can move one number
 * rather than hunt six call sites.
 */

/**
 * THE EARLY-DATA FLOOR (§5). Below this many measured rounds the tab still
 * renders everything — nothing is hidden, that is Ben's absolute rule — but:
 *   - each section states EARLY DATA instead of a round count
 *   - the verdict's verb softens ("it looks like" not "it plays as")
 *   - the handicap breakdown withdraws entirely and says so
 *
 * 30 is the brief's starting suggestion and it is Ben's to move. It also
 * happens to be the shape of our data: five courses clear 100 rounds, eight
 * sit at 30-99, and everything else is below this line.
 */
export const EARLY_DATA_FLOOR = 30;

/**
 * "YOUR CARD HOLDS UP" (§3.2). When no hole's measured position sits more than
 * this many places from its declared stroke index, the verdict is a compliment.
 *
 * FIVE, NOT FOUR. §3.2 says "no hole more than four places out" but §1 records
 * Sundridge East — 630 rounds, our best data — as SOUND with a biggest
 * disagreement of FIVE places. Those two sentences contradict each other and
 * acceptance B requires Sundridge to read sound, so the wider bound wins and
 * the conflict is reported rather than silently resolved.
 */
export const SOUND_MAX_DRIFT = 5;

/** §3.4 — holes this far out of position carry their figure on the chart. */
export const DRIFT_FIGURE_MIN = 8;

/**
 * §6.4 — a percentage below this n is a sample-size claim we cannot make, so
 * the share renders as an absolute count instead.
 */
export const PCT_MIN_N = 20;

/**
 * §4.1 — a non-zero rare feat keeps a visible mark. The FIGURE carries the
 * magnitude; the BAR carries the presence. Zero gets no bar at all.
 */
export const MIN_BAR_PCT = 1.5;
