/**
 * WHERE THE STROKES GO (BRIEF_HANDICAP_TAB_REBUILD phase 5).
 *
 * Pure derivations for the HolesSection rebuild. EVERY figure comes from
 * get_my_scoring_breakdown_all_courses (ParSplit rows) — none from
 * get_trophy_aggregates (§5.3: the old caption mixed the two RPCs, whose
 * populations differ by nine-hole rounds, so the arithmetic did not close).
 *
 * THE BASIS RULE (§5.2): holes a round for a par type is
 *   holes_played(type) / Σ holes_played(all three types) × 18.
 * NEVER holes_played / complete_rounds: the RPC's par splits are built from
 * every fetched round including PARTIAL cards, while complete_rounds counts
 * only rounds whose hole rows total exactly eighteen scored holes. Dividing
 * one by the other mixes populations and overstates the figure — ~2% with
 * clean data, up to half with many partial cards. The mix ratio is immune.
 * Shots a round for a type is then avg_over(type) × holes a round(type).
 */

export interface ParSplitInput {
  par: number;
  avg_over: number;
  holes_played: number;
  pct_par_better: number;
  pct_bogey: number;
  pct_double: number;
  /**
   * Exact hole counts per outcome band (5B L1), added to the RPC by hand.
   * over ≤ −1 / = 0 / = 1 / ≥ 2; the four partition holes_played exactly.
   * OPTIONAL: a client running against a database without the updated
   * function will not have them, and in that case the distribution bar
   * does not render at all (5B L3) — never approximated from the pct_*
   * fields, because pct_par_better is par-OR-better and that conflation
   * is the bug 5B fixes.
   */
  birdie_better_count?: number;
  par_count?: number;
  bogey_count?: number;
  double_count?: number;
}

/**
 * MIN_HOLES_PAR_TYPE (BRIEF_HANDICAP_TAB_REBUILD_5A H1) — a par type needs
 * this many holes before its shots-a-round figure renders. At 90 holes the
 * standard error on a per-hole average is about 0.12 shots, against a spread
 * between par types of roughly 0.1, so below that the figure cannot support
 * the comparison it is drawn to make. This is a FIGURE-LEVEL withhold, not a
 * row-level one: the row still renders its label, holes-a-round and
 * holes-played meta; only the shots-a-round figure and the bar fill are
 * withheld, and a withheld type cannot win the derived title (H2). The mix
 * ratio is NOT gated (H3): it is a proportion of holes, not an average of
 * scores, so it does not carry the same uncertainty.
 */
export const MIN_HOLES_PAR_TYPE = 90;

export interface ParTypeRow {
  parN: 3 | 4 | 5;
  holesPlayed: number;
  /** Holes of this type per 18 (§5.2 mix ratio). Never withheld (H3). */
  holesPerRound: number;
  /** avg_over, i.e. shots dropped per hole of this type. */
  perHole: number;
  /**
   * Shots dropped per round on this type: perHole × holesPerRound.
   * NULL when holesPlayed < MIN_HOLES_PAR_TYPE (H1 figure-level withhold).
   */
  shotsPerRound: number | null;
}

export interface OutcomeBands {
  /** Percentages 0–100, weighted by holes_played across the three types. */
  birdiePlus: number;
  par: number;
  bogey: number;
  doublePlus: number;
}

export interface StrokesGo {
  totalHoles: number;
  rows: ParTypeRow[];
  /** The row carrying the largest share of dropped shots (drives the title). */
  dominant: ParTypeRow | null;
  bands: OutcomeBands;
  /** Double-or-worse holes per round (bands.doublePlus% × 18). */
  doublesPerRound: number;
}

const TYPES: Array<{ parN: 3 | 4 | 5; key: 'par3' | 'par4' | 'par5' }> = [
  { parN: 3, key: 'par3' },
  { parN: 4, key: 'par4' },
  { parN: 5, key: 'par5' },
];

export function deriveStrokesGo(
  splits: Record<'par3' | 'par4' | 'par5', ParSplitInput | null>,
): StrokesGo | null {
  const present = TYPES.map((t) => ({ ...t, data: splits[t.key] })).filter(
    (t): t is typeof t & { data: ParSplitInput } => !!t.data && t.data.holes_played > 0,
  );
  if (present.length === 0) return null;

  const totalHoles = present.reduce((s, t) => s + t.data.holes_played, 0);
  if (totalHoles <= 0) return null;

  const rows: ParTypeRow[] = present.map((t) => {
    const holesPerRound = (t.data.holes_played / totalHoles) * 18;
    return {
      parN: t.parN,
      holesPlayed: t.data.holes_played,
      holesPerRound,
      perHole: t.data.avg_over,
      shotsPerRound:
        t.data.holes_played >= MIN_HOLES_PAR_TYPE
          ? t.data.avg_over * holesPerRound
          : null,
    };
  });

  /* H2: a type that cannot state its own figure is not eligible to win the
     title. If no type clears the threshold the title falls back to the plain
     section name and the derived sentence does not render. */
  const eligible = rows.filter((r): r is ParTypeRow & { shotsPerRound: number } => r.shotsPerRound !== null);
  const dominant = eligible.sort((a, b) => b.shotsPerRound - a.shotsPerRound)[0] ?? null;

  /* Outcome bands, weighted by holes_played. Par share is the remainder so
     the four bands partition the holes exactly. */
  const w = (pick: (d: ParSplitInput) => number) =>
    present.reduce((s, t) => s + pick(t.data) * t.data.holes_played, 0) / totalHoles;
  const birdiePlus = w((d) => d.pct_par_better);
  const bogey = w((d) => d.pct_bogey);
  const doublePlus = w((d) => d.pct_double);
  const par = Math.max(0, 100 - birdiePlus - bogey - doublePlus);

  return {
    totalHoles,
    rows,
    dominant,
    bands: { birdiePlus, par, bogey, doublePlus },
    doublesPerRound: (doublePlus / 100) * 18,
  };
}

/** A shot of gross is 113 / slope of a differential (§5.6). */
export function shotsToDifferential(shots: number, slope: number): number {
  return shots * (113 / slope);
}
