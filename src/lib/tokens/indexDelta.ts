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
  /** White / #F8FAFC analytical surfaces: HcpStrip, Discover friends. */
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

/**
 * DELTA_TONE — the token for a SIGNED DIFFERENCE FROM A REFERENCE (e.g. your
 * rating against the community's). INDEX_DELTA remains the token for MOVEMENT
 * OVER TIME. The two deliberately share values: both express direction on the
 * same surfaces. Neither may ever be sourced from TOPAR_RED, A.RED or A.GREEN.
 */
export const DELTA_TONE = {
  light: { up: INDEX_DELTA.light.improved, down: INDEX_DELTA.light.drifted },
  dark: { up: INDEX_DELTA.dark.improved, down: INDEX_DELTA.dark.drifted },
} as const;
