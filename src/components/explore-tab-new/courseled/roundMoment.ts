/**
 * THE ROUND'S MOMENT — the pure selector (BRIEF_ROUND_MOMENTS_V3 §2).
 *
 * SUPERSEDES the v2 six-kind list IN FULL. There is still ONE chart (the
 * scorecard) and the hero layout is untouched.
 *
 * IT RUNS ON `holes: { holeNo, par, strokes }[]` AND NOTHING ELSE (§S1.1) — the
 * exact array useRoundHoleShapes already returns. No query, no new hook, no new
 * field, no field average. Do not add one: this module is tuned against live
 * data and must stay testable without rendering a tile (§S1.8).
 *
 * SEVEN KINDS, FIRST MATCH WINS (§2 — was six):
 *   1 EAGLE           any hole 2+ under par, or a 1.               #FFC93C
 *   2 FINISHED IN RED the round's TOTAL to-par is BELOW ZERO.      canonical birdie red
 *   3 BIRDIE HAUL     4 or more birdies (d === -1 exactly).        PROVISIONAL
 *   4 STRONG FINISH   birdie or better on 2 of holes 16 / 17 / 18. #3B9DFF
 *   5 RUN             7+ CONSECUTIVE holes at par or better.       #22D07A
 *   6 GRIND           12+ at par or better, nothing worse than a
 *                     bogey.                                      #F7931E
 *   7 PLAIN           THE DEFAULT. Everything else.                #FFFFFF
 *
 * `inRed` WAS RENAMED `finishedInRed` AND ITS RULE CHANGED (§2.1). It used to
 * fire when the CUMULATIVE to-par went below zero at ANY point. Ben's reasoning
 * for the change: a round could go under par on the first hole and finish twenty
 * over, and the old rule called that in red. `toPar < 0` is a claim the card can
 * stand behind. The cumulative `underHoles` loop is DELETED and nothing else
 * needed it.
 *
 * IT KEEPS POSITION 2 (§0c): finishing under par is rarer than merely spending
 * time under par, so it still outranks the haul, the finish and the run.
 *
 * `finish` WAS RENAMED `strongFinish` (§2.2). Rule, tone, figure and FINISH_MIN
 * are unchanged.
 *
 * BIRDIE HAUL SITS AT POSITION 3 AND MUST NOT BE MOVED WITHOUT THOUGHT (§2.3):
 * BELOW finishedInRed because most under-par rounds also carry four birdies and
 * the finishing score is the bigger claim; ABOVE strongFinish and run because a
 * haul of birdies is a better story than two good closing holes or a stretch of
 * pars. Its most valuable case is the round that made five birdies and did NOT
 * finish under par — which before v3 fell all the way through to PLAIN. A hole
 * at −2 or better is NOT counted here: that round is already the eagle at
 * position 1 and never reaches this rule.
 *
 * NO NEGATIVE MOMENTS (§S1.3, upheld). "THE COLLAPSE" / "THE TURN" / "THE
 * ESCAPE" were designed and cut. Ben's call: "Every moment is something a member
 * would be pleased to see." BIRDIE HAUL is positive. Do not add a negative kind.
 *
 * THE PLAIN CARD IS THE MOST IMPORTANT OF THE SEVEN (§S1.6). MOST ROUNDS ARE
 * PLAIN. It is the one most likely to be treated as a fallback and built
 * carelessly. It must look deliberate — same hero, same well, same scorecard,
 * and only its GLOW is different (white).
 *
 * WHICH KINDS MARK HOLES (§3): ONLY birdieHaul, strongFinish and run.
 *   eagle          nothing — the feat hole already carries the loudest marker on
 *                  the card, and a second mark on it is redundant.
 *   finishedInRed  nothing — a WHOLE-ROUND claim, exactly like the grind. This
 *                  alone removes the reported "par drawn as an eagle" bug.
 *   run            THE ONLY KIND WHERE MARKING ADDS ANYTHING: a stretch of pars
 *                  is bare ink, so without the mark there is nothing to see.
 *   grind / plain  nothing, unchanged.
 * A MARKED HOLE IS DRAWN AS A RULE BENEATH THE CELLS, NEVER AS A RING (§4 and
 * the new §S5.3). markerStyle no longer takes a tone at all.
 */

export type MomentKind =
  | 'eagle'
  | 'finishedInRed'
  | 'birdieHaul'
  | 'strongFinish'
  | 'run'
  | 'grind'
  | 'plain';

export interface MomentHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
}

/**
 * HOW THE FIGURE READS (§S2.6). An IDENTITY figure takes a noun BEFORE it
 * (HOLE 13); a QUANTITY figure takes the noun AFTER it (14 HOLES, 5 BIRDIES).
 * The renderer derives both from ONE translatable template, so a translator can
 * reorder.
 */
export type FigureRole = 'identity' | 'quantity' | 'score';

export interface Moment {
  kind: MomentKind;
  /** §S5.1 — the celebration accent. Expressive in the hero. In the grid it may
   *  only ever appear as the RULE BENEATH marked cells (§4), never on a cell. */
  tone: string;
  /** i18n key suffix for the eyebrow. `null` on PLAIN: it has no label (§S2.7). */
  labelKey: string | null;
  /** i18n key suffix for the figure template, e.g. 'holes' -> "{n} HOLES". */
  figureKey: string | null;
  figureRole: FigureRole;
  /** The number in the 46px figure. `null` on PLAIN — the card uses the gross. */
  figure: number | null;
  /** i18n key suffix for the sentence. NEVER free text (§S6.2). */
  sentenceKey: string;
  /** The holes the grid underlines in the tone (§3, §4). */
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

/**
 * BIRDIE HAUL'S TONE IS NOT YET CHOSEN (§2.4). Ben picks it; the candidates and
 * their contrast against the hero's dark ground were reported with this brief.
 * THIS VALUE IS PROVISIONAL and is the only thing in v3 awaiting a decision.
 * It is clear of every other tone in the table and of the canonical birdie red.
 */
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';

export const BIRDIE_HAUL_TONE_PROVISIONAL = '#B58CFF';

export const MOMENT_TONE: Record<MomentKind, string> = {
  eagle: '#FFC93C',
  finishedInRed: TOPAR_UNDER_DARK,
  birdieHaul: BIRDIE_HAUL_TONE_PROVISIONAL,
  strongFinish: '#3B9DFF',
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
/** FOUR BIRDIES: three is a good day for most members and common enough to be
 *  unremarkable; four is the point at which the birdies, not the score, are the
 *  story of the round. */
export const BIRDIE_HAUL_MIN = 4;

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
     treatment, different word (§S1.2). NOTHING IS MARKED (§3): the feat hole
     already carries the loudest marker on the card. */
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
      markedHoles: [],
      feat,
      facts: { holeNo: best.holeNo, par: best.par, strokes: best.strokes, toPar, played },
    };
  }

  /* 2 — FINISHED IN THE RED. The round's TOTAL to-par is below zero (§2.1).
     NOTHING IS MARKED: the claim is about the whole round. */
  if (toPar < 0) {
    return {
      kind: 'finishedInRed',
      tone: MOMENT_TONE.finishedInRed,
      labelKey: 'finishedInRed',
      figureKey: null,
      figureRole: 'score',
      figure: toPar,
      sentenceKey: 'finishedInRed',
      markedHoles: [],
      facts: { toPar, played },
    };
  }

  /* 3 — BIRDIE HAUL. A birdie is d === -1 EXACTLY (§2.3). Anything better has
     already been taken by the eagle above. The birdie holes ARE marked: they
     are scattered by nature and worth grouping. */
  const birdies = hs.filter((h) => h.d === -1);
  if (birdies.length >= BIRDIE_HAUL_MIN) {
    return {
      kind: 'birdieHaul',
      tone: MOMENT_TONE.birdieHaul,
      labelKey: 'birdieHaul',
      figureKey: 'birdies',
      figureRole: 'quantity',
      figure: birdies.length,
      sentenceKey: 'birdieHaul',
      markedHoles: birdies.map((h) => h.holeNo),
      facts: { count: birdies.length, toPar, played },
    };
  }

  /* 4 — THE STRONG FINISH. Birdie or better on at least two of 16, 17, 18. */
  const closing = hs.filter((h) => h.holeNo >= 16 && h.holeNo <= 18 && h.d <= -1);
  if (closing.length >= FINISH_MIN) {
    return {
      kind: 'strongFinish',
      tone: MOMENT_TONE.strongFinish,
      labelKey: 'strongFinish',
      figureKey: 'inThree',
      figureRole: 'quantity',
      figure: closing.length,
      sentenceKey: 'strongFinish',
      markedHoles: closing.map((h) => h.holeNo),
      facts: { count: closing.length, toPar, played },
    };
  }

  /* 5 — THE RUN. Consecutive by HOLE NUMBER, so a missing hole breaks it. */
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

  /* 6 — THE GRIND. Twelve or more at par or better AND no hole worse than a
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

  /* 7 — PLAIN. The default, and the card members see most (§S1.6). */
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
