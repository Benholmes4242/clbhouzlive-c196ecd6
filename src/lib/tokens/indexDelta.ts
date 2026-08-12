/**
 * INDEX_DELTA — the one token for the HANDICAP INDEX MOVEMENT figure.
 *
 * The index delta is GREEN when the index improved (delta < 0) and RED when it
 * drifted (delta > 0), on every surface. This is a MOVEMENT, not a score: it
 * has nothing to do with the to-par convention (under par RED, over par INK),
 * and must never be sourced from TOPAR_RED, A.RED or A.GREEN.
 *
 * ONE TOKEN, TWO THEMES. The values are NOT interchangeable: the dark pair is
 * lighter because it sits on near-black, and the light pair would fail there.
 * Pick the theme that matches the surface, never the other pair's value.
 */
export const INDEX_DELTA = {
  /** White / #F8FAFC analytical surfaces: HcpStrip, HeroHandicapCardDark, Discover friends. */
  light: {
    improved: '#0F8F4A',
    drifted: '#C8372B',
  },
  /** Near-black surfaces: profile hero, Clubhouse feed cards. */
  dark: {
    improved: '#4ADE80',
    drifted: '#F87171',
  },
} as const;
