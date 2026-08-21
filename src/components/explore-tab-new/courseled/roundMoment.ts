/**
 * THE ROUND'S MOMENT — the pure selector (BRIEF_ROUND_TILE_THE_MOMENT §S1).
 *
 * IT RUNS ON `holes: { holeNo, par, strokes }[]` AND NOTHING ELSE (§S1.1) — the
 * exact array useRoundHoleShapes already returns. No query, no new field, no
 * field average. Do not add one: this module is tuned against live data and must
 * stay testable without rendering a tile (§S1.6).
 *
 * FIVE KINDS, FIRST MATCH WINS (§S1.2):
 *   1 EAGLE     any hole 2+ under par, or a hole in one.   strip
 *   2 RUN       7+ consecutive holes at par or better.     strip
 *   3 COLLAPSE  a single hole 3+ over par.                 trajectory
 *   4 FINISH    birdie or better on 2 of holes 16/17/18.   trajectory, last six
 *   5 GRIND     THE DEFAULT.                               mini scorecard
 *
 * "THE ESCAPE" WAS DESIGNED AND DROPPED (§S1.3). Ben's call. Do not build it.
 *
 * THE GRIND IS THE MOST IMPORTANT OF THE FIVE (§S1.4):
 *   "The grind is the DEFAULT and therefore the most-seen card. Its moment is
 *    the ABSENCE of a moment — no birdies, no doubles, fifteen holes taken care
 *    of. If this card is weak the whole surface is weak."
 */

export type MomentKind = 'eagle' | 'run' | 'collapse' | 'finish' | 'grind';

/** Which chart PROVES this kind of claim (§S2.1). Never picked for variety. */
export type MomentChart = 'strip' | 'trajectory' | 'trajectoryLastSix' | 'scorecard';

export interface MomentHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
}

export interface Moment {
  kind: MomentKind;
  /** §S3.5 — the celebration accent. Never used in the data region except on
   *  the moment's own holes. */
  tone: string;
  chart: MomentChart;
  /** The moment's OWN holes, the only holes allowed to take the tone (§S3.3). */
  holes: number[];
  /** EAGLE only: which feat it actually is. Golf terms, untranslated (§S5.3). */
  feat?: 'ace' | 'albatross' | 'eagle';
  /** The hero figure at 56px: a hole number or a count (§S4.2). */
  figure: number;
  /** Figures the copy interpolates. Never free text (§S4.3). */
  facts: {
    holeNo?: number;
    par?: number;
    strokes?: number;
    count?: number;
    from?: number;
    to?: number;
    dropped?: number;
    /** The round's to-par WITHOUT the collapse hole — the neutral counterweight. */
    restToPar?: number;
    parOrBetter?: number;
    played?: number;
    birdies?: number;
    doubles?: number;
    toPar?: number;
  };
}

export const MOMENT_TONE: Record<MomentKind, string> = {
  eagle: '#FFC93C',
  run: '#22D07A',
  collapse: '#FF5A4E',
  finish: '#3B9DFF',
  /* THE EVERYDAY ROUND GETS THE HOUSE COLOUR (§S3.5). */
  grind: '#F7931E',
};

const MOMENT_CHART: Record<MomentKind, MomentChart> = {
  eagle: 'strip',
  run: 'strip',
  collapse: 'trajectory',
  finish: 'trajectoryLastSix',
  grind: 'scorecard',
};

/** THE RUN'S THRESHOLD. Six is a good stretch; seven is a story. */
export const RUN_MIN = 7;
/** THE COLLAPSE'S THRESHOLD: a triple or worse on one hole. */
export const COLLAPSE_MIN = 3;
/** BEN TIGHTENED THE FINISH: one birdie on the last is a nice finish, not a
 *  story. TWO of the last three, or it is a grind. */
export const FINISH_MIN = 2;

interface Scored {
  holeNo: number;
  par: number;
  strokes: number;
  d: number;
}

function scored(holes: readonly MomentHole[]): Scored[] {
  return holes
    .filter(
      (h): h is MomentHole & { par: number; strokes: number } =>
        h.par != null &&
        h.strokes != null &&
        Number.isFinite(h.par) &&
        Number.isFinite(h.strokes),
    )
    .map((h) => ({ holeNo: h.holeNo, par: h.par, strokes: h.strokes, d: h.strokes - h.par }))
    .sort((a, b) => a.holeNo - b.holeNo);
}

/**
 * A ROUND WITH NO HOLE DATA CANNOT BE SELECTED ON (§S1.5): it returns the GRIND
 * with no holes and no counts, and the card renders the grind layout with an
 * empty well. Never a blank hero.
 */
export function selectMoment(holes: readonly MomentHole[] | null | undefined): Moment {
  const hs = scored(holes ?? []);
  if (hs.length === 0) return grind([], 0);

  const played = hs.length;
  const toPar = hs.reduce((s, h) => s + h.d, 0);

  /* 1 — EAGLE. An ACE outranks an eagle; an ALBATROSS outranks both. */
  const feats = hs.filter((h) => h.strokes === 1 || h.d <= -2);
  if (feats.length > 0) {
    const rank = (h: Scored) => (h.strokes === 1 ? 3 : h.d <= -3 ? 2 : 1);
    const best = feats.reduce((a, b) => (rank(b) > rank(a) ? b : a));
    const feat: Moment['feat'] =
      best.strokes === 1 ? 'ace' : best.d <= -3 ? 'albatross' : 'eagle';
    return {
      kind: 'eagle',
      tone: MOMENT_TONE.eagle,
      chart: MOMENT_CHART.eagle,
      holes: [best.holeNo],
      feat,
      figure: best.holeNo,
      facts: {
        holeNo: best.holeNo,
        par: best.par,
        strokes: best.strokes,
        toPar,
        played,
      },
    };
  }

  /* 2 — THE RUN. Consecutive by HOLE NUMBER, so a missing hole breaks it. */
  let bestRun: Scored[] = [];
  let cur: Scored[] = [];
  for (const h of hs) {
    const continues =
      h.d <= 0 && (cur.length === 0 || h.holeNo === cur[cur.length - 1].holeNo + 1);
    cur = continues ? [...cur, h] : h.d <= 0 ? [h] : [];
    if (cur.length > bestRun.length) bestRun = cur;
  }
  if (bestRun.length >= RUN_MIN) {
    return {
      kind: 'run',
      tone: MOMENT_TONE.run,
      chart: MOMENT_CHART.run,
      holes: bestRun.map((h) => h.holeNo),
      figure: bestRun.length,
      facts: {
        count: bestRun.length,
        from: bestRun[0].holeNo,
        to: bestRun[bestRun.length - 1].holeNo,
        toPar,
        played,
      },
    };
  }

  /* 3 — THE COLLAPSE. The worst hole; ties go to the LATER hole, which is the
     one the member remembers. Its word is neutral and the figure talks (§S3.6). */
  const bad = hs.filter((h) => h.d >= COLLAPSE_MIN);
  if (bad.length > 0) {
    const worst = bad.reduce((a, b) => (b.d >= a.d ? b : a));
    return {
      kind: 'collapse',
      tone: MOMENT_TONE.collapse,
      chart: MOMENT_CHART.collapse,
      holes: [worst.holeNo],
      figure: worst.holeNo,
      facts: {
        holeNo: worst.holeNo,
        par: worst.par,
        strokes: worst.strokes,
        dropped: worst.d,
        restToPar: toPar - worst.d,
        toPar,
        played,
      },
    };
  }

  /* 4 — THE FINISH. Two of 16, 17, 18 under par. */
  const closing = hs.filter((h) => h.holeNo >= 16 && h.holeNo <= 18 && h.d <= -1);
  if (closing.length >= FINISH_MIN) {
    return {
      kind: 'finish',
      tone: MOMENT_TONE.finish,
      chart: MOMENT_CHART.finish,
      holes: closing.map((h) => h.holeNo),
      figure: closing.length,
      facts: { count: closing.length, toPar, played },
    };
  }

  /* 5 — THE GRIND. The default, and the card members see most. */
  return grind(hs, toPar);
}

function grind(hs: Scored[], toPar: number): Moment {
  const parOrBetter = hs.filter((h) => h.d <= 0).length;
  const birdies = hs.filter((h) => h.d <= -1).length;
  const doubles = hs.filter((h) => h.d >= 2).length;
  return {
    kind: 'grind',
    tone: MOMENT_TONE.grind,
    chart: MOMENT_CHART.grind,
    /* NOTHING IS HIGHLIGHTED: an absence cannot be shown by highlighting
       anything, so THE EVIDENCE IS EVERY HOLE (§S2.1). */
    holes: [],
    figure: parOrBetter,
    facts: { parOrBetter, played: hs.length, birdies, doubles, toPar },
  };
}

/** Which sentence template a grind takes — chosen, never concatenated (§S5.2). */
export function grindSentenceKey(m: Moment): 'clean' | 'noDoubles' | 'noBirdies' | 'plain' | 'noHoles' {
  const { played = 0, birdies = 0, doubles = 0 } = m.facts;
  if (played === 0) return 'noHoles';
  if (birdies === 0 && doubles === 0) return 'clean';
  if (doubles === 0) return 'noDoubles';
  if (birdies === 0) return 'noBirdies';
  return 'plain';
}

export default selectMoment;
