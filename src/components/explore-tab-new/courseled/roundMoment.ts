/**
 * THE ROUND'S MOMENT — the pure selector (BRIEF_ROUND_TILE_THE_MOMENT v2 §S1).
 *
 * SUPERSEDES v1 IN FULL. The chart vocabulary is gone (there is ONE chart now,
 * the scorecard — §S0.3), the moment list changed, and the hero layout changed.
 *
 * IT RUNS ON `holes: { holeNo, par, strokes }[]` AND NOTHING ELSE (§S1.1) — the
 * exact array useRoundHoleShapes already returns. No query, no new hook, no new
 * field, no field average. Do not add one: this module is tuned against live
 * data and must stay testable without rendering a tile (§S1.8).
 *
 * SIX KINDS, FIRST MATCH WINS (§S1.2):
 *   1 EAGLE    any hole 2+ under par, or a hole in one.        #FFC93C
 *   2 IN RED   cumulative to-par went BELOW ZERO at any point. #C8102E
 *   3 FINISH   birdie or better on 2 of holes 16 / 17 / 18.    #3B9DFF
 *   4 RUN      7+ CONSECUTIVE holes at par or better.          #22D07A
 *   5 GRIND    12+ at par or better, nothing worse than bogey. #F7931E
 *   6 PLAIN    THE DEFAULT. Everything else.                   #FFFFFF
 *
 * IN RED SITS ABOVE THE FINISH AND THE RUN DELIBERATELY (§S1.5): a round that
 * spent time under par is the better story, and it is rarer.
 *
 * "THE COLLAPSE" / "THE TURN" WAS DESIGNED AND CUT (§S1.3). Ben's call:
 *   "Every moment is something a member would be pleased to see. A collapse
 *    card was designed and cut — the grind and the plain card are the honest
 *    neutral floor, and nothing on this surface tells anyone they played badly."
 * "THE ESCAPE" was cut in v1 (§S1.4). Do not build either, and do not add any
 * other negative kind.
 *
 * THE PLAIN CARD IS THE MOST IMPORTANT OF THE SIX (§S1.6). MOST ROUNDS ARE
 * PLAIN. It is the one most likely to be treated as a fallback and built
 * carelessly. It must look deliberate — it gets the same hero, the same well and
 * the same scorecard, and only its GLOW is different (white, §S2.2).
 */

export type MomentKind = 'eagle' | 'inRed' | 'finish' | 'run' | 'grind' | 'plain';

export interface MomentHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
}

/**
 * HOW THE FIGURE READS (§S2.6). An IDENTITY figure takes a noun BEFORE it
 * (HOLE 13); a QUANTITY figure takes the noun AFTER it (14 HOLES). The renderer
 * derives both from ONE translatable template, so a translator can reorder.
 */
export type FigureRole = 'identity' | 'quantity' | 'score';

export interface Moment {
  kind: MomentKind;
  /** §S5.1 — the celebration accent. Expressive in the hero, and in the grid
   *  ONLY on the moment's own holes (§S5.3). */
  tone: string;
  /** i18n key suffix for the eyebrow. `null` on PLAIN: it has no label (§S2.7). */
  labelKey: string | null;
  /** i18n key suffix for the figure template, e.g. 'holes' -> "{{n}} HOLES". */
  figureKey: string | null;
  figureRole: FigureRole;
  /** The number in the 46px figure. `null` on PLAIN — the card uses the gross. */
  figure: number | null;
  /** i18n key suffix for the sentence. NEVER free text (§S6.2). */
  sentenceKey: string;
  /** The holes the grid marks in the tone (§S4.6). */
  markedHoles: number[];
  /** EAGLE only: which feat it is. Untranslated golf words (§S6.4). */
  feat?: 'ace' | 'albatross' | 'eagle';
  /** Figures the sentence templates interpolate. Numbers only. */
  facts: {
    holeNo?: number;
    par?: number;
    strokes?: number;
    count?: number;
    from?: number;
    to?: number;
    parOrBetter?: number;
    played?: number;
    toPar?: number;
  };
}

export const MOMENT_TONE: Record<MomentKind, string> = {
  eagle: '#FFC93C',
  inRed: '#C8102E',
  finish: '#3B9DFF',
  run: '#22D07A',
  grind: '#F7931E',
  /* A PLAIN ROUND'S ACCENT IS WHITE (§S2.2): colour means something happened,
     white means a round was played. Same shape, same weight, different
     temperature — so a plain round still holds its own in the rail without
     claiming to be a story. */
  plain: '#FFFFFF',
};

/** THE RUN'S THRESHOLD. Six is a good stretch; seven is a story. */
export const RUN_MIN = 7;
/** TWO of the last three, or it is not a finish. */
export const FINISH_MIN = 2;
/** THE GRIND: twelve holes taken care of and nothing worse than a bogey. */
export const GRIND_MIN = 12;

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
 * A ROUND WITH NO HOLE DATA CANNOT BE SELECTED ON (§S1.7): it returns PLAIN with
 * no marked holes and no counts, and the card renders the plain hero with an
 * EMPTY well. Never a blank hero, never a placeholder grid.
 */
export function selectMoment(holes: readonly MomentHole[] | null | undefined): Moment {
  const hs = scored(holes ?? []);
  if (hs.length === 0) return plain([], 0);

  const played = hs.length;
  const toPar = hs.reduce((s, h) => s + h.d, 0);

  /* 1 — EAGLE. An ACE outranks an eagle; an ALBATROSS outranks both. Same
     treatment, different word (§S1.2). */
  const feats = hs.filter((h) => h.strokes === 1 || h.d <= -2);
  if (feats.length > 0) {
    const rank = (h: Scored) => (h.strokes === 1 ? 3 : h.d <= -3 ? 2 : 1);
    const best = feats.reduce((a, b) => (rank(b) > rank(a) ? b : a));
    const feat: Moment['feat'] =
      best.strokes === 1 ? 'ace' : best.d <= -3 ? 'albatross' : 'eagle';
    return {
      kind: 'eagle',
      tone: MOMENT_TONE.eagle,
      labelKey: feat,
      figureKey: 'hole',
      figureRole: 'identity',
      figure: best.holeNo,
      sentenceKey: 'eagle',
      markedHoles: [best.holeNo],
      feat,
      facts: { holeNo: best.holeNo, par: best.par, strokes: best.strokes, toPar, played },
    };
  }

  /* 2 — IN RED. The CUMULATIVE to-par went below zero at any point. The marked
     holes are every hole the round was under par AFTER — the stretch the story
     is about, not a single hole. */
  const underHoles: number[] = [];
  let cum = 0;
  for (const h of hs) {
    cum += h.d;
    if (cum < 0) underHoles.push(h.holeNo);
  }
  if (underHoles.length > 0) {
    return {
      kind: 'inRed',
      tone: MOMENT_TONE.inRed,
      labelKey: 'inRed',
      figureKey: 'holes',
      figureRole: 'quantity',
      figure: underHoles.length,
      sentenceKey: 'inRed',
      markedHoles: underHoles,
      facts: { count: underHoles.length, toPar, played },
    };
  }

  /* 3 — THE FINISH. Birdie or better on at least two of 16, 17, 18. */
  const closing = hs.filter((h) => h.holeNo >= 16 && h.holeNo <= 18 && h.d <= -1);
  if (closing.length >= FINISH_MIN) {
    return {
      kind: 'finish',
      tone: MOMENT_TONE.finish,
      labelKey: 'finish',
      figureKey: 'inThree',
      figureRole: 'quantity',
      figure: closing.length,
      sentenceKey: 'finish',
      markedHoles: closing.map((h) => h.holeNo),
      facts: { count: closing.length, toPar, played },
    };
  }

  /* 4 — THE RUN. Consecutive by HOLE NUMBER, so a missing hole breaks it. */
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
      labelKey: 'run',
      figureKey: 'inARow',
      figureRole: 'quantity',
      figure: bestRun.length,
      sentenceKey: 'run',
      markedHoles: bestRun.map((h) => h.holeNo),
      facts: {
        count: bestRun.length,
        from: bestRun[0].holeNo,
        to: bestRun[bestRun.length - 1].holeNo,
        toPar,
        played,
      },
    };
  }

  /* 5 — THE GRIND. Twelve or more at par or better AND no hole worse than a
     bogey. NOTHING IS MARKED: the claim is about the WHOLE round, and marking
     twelve of eighteen holes would mark the card rather than a moment. */
  const parOrBetter = hs.filter((h) => h.d <= 0).length;
  const worstOverBogey = hs.some((h) => h.d >= 2);
  if (parOrBetter >= GRIND_MIN && !worstOverBogey) {
    return {
      kind: 'grind',
      tone: MOMENT_TONE.grind,
      labelKey: 'grind',
      figureKey: 'holes',
      figureRole: 'quantity',
      figure: parOrBetter,
      sentenceKey: 'grind',
      markedHoles: [],
      facts: { parOrBetter, played, toPar },
    };
  }

  /* 6 — PLAIN. The default, and the card members see most (§S1.6). */
  return plain(hs, toPar);
}

function plain(hs: Scored[], toPar: number): Moment {
  const parOrBetter = hs.filter((h) => h.d <= 0).length;
  return {
    kind: 'plain',
    tone: MOMENT_TONE.plain,
    /* NO LABEL (§S2.7). Its figure is the GROSS with the to-par beside it, which
       on an ordinary round is the right headline because it is the only thing
       that happened. */
    labelKey: null,
    figureKey: null,
    figureRole: 'score',
    figure: null,
    sentenceKey: hs.length === 0 ? 'noHoles' : 'plain',
    markedHoles: [],
    facts: { parOrBetter, played: hs.length, toPar },
  };
}

export default selectMoment;
