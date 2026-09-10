import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Table } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { TrajectoryLine } from './TrajectoryLine';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { RoundEngagementActions } from '@/components/explore-tab-new/courseled/RoundEngagementActions';
import {
  honoursGround,
  METAL_GOLD,
  METAL_HAIRLINE,
  METAL_INK,
  METAL_TOP_EDGE,
  type HonoursFeat,
} from './honoursTreatment';

import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import {
  TREND_UP, TREND_DOWN,
  TOPAR_UNDER_DARK, TOPAR_OVER_DARK, TOPAR_EVEN_DARK,
} from '@/features/tourhub/_shared/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatHcp } from '@/lib/formatHcp';
import { formatOrdinal } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  A, SANS, FIGS, NUM, KICKER, Panel, StatRow, Action, Hairline,
} from '@/features/courses/components/holes/analytical/tokens';
import { LABEL as LABEL_METRICS, TITLE as TITLE_METRICS } from '@/lib/tokens/type';

/**
 * Canonical scale (src/lib/tokens/type.ts) is colourless by design; this sheet
 * keeps its own palette, so ink is re-attached here and nowhere else.
 */
const LABEL: React.CSSProperties = { ...LABEL_METRICS, color: A.MUTE };
const TITLE: React.CSSProperties = { ...TITLE_METRICS, color: A.INK };
/*
 * BRIEF_ROUND_SHEET_SPLIT §3.4 — SECTION TITLES ARE CAPS-TRACKED LABELS.
 * The sentence-case SECTION_TITLE role is gone: each panel passes `kicker`, the
 * app's caps-tracked panel label, so these sections read like every other
 * section in the app rather than like headings unique to this sheet.
 */

/**
 * MICRO_BRIEF_SHEETS_TYPE_SCALE — TWO LOCAL LABEL ROLES.
 *
 * AXIS (10px) is the ONE STATED EXCEPTION to the app's 11px floor: a scorecard
 * axis label (HOLE / PAR / YOU row stubs) is a COORDINATE, not something read.
 * Lifting it to 11 would double the grid's weight beside 18 numerals.
 *
 * READ (11px) is for anything a member actually reads: the scoring-key title
 * and its entries, the TOTAL / OUT n / IN n / PAR n figures, the hcp chip.
 *
 * Size only — no tone moves. The quiet hole numbers stay quiet.
 */
const LABEL_AXIS: React.CSSProperties = { ...LABEL, fontSize: 10 };
const LABEL_READ: React.CSSProperties = { ...LABEL, fontSize: 11 };

const CAPTION: React.CSSProperties = { fontSize: 12.5, lineHeight: 1.5, color: A.MUTE, margin: 0 };
/**
 * BRIEF_ROUND_SHEET_SPLIT §2 — THE THREE SENTENCES BECAME THREE FIGURES.
 * The prose SENTENCE role is gone: nothing in this sheet names the member in a
 * sentence any more. The figure rail below the summary carries the same facts
 * as figure-over-label pairs, and every derivation behind them is unchanged.
 */
const RAIL_FIG: React.CSSProperties = { ...NUM, fontSize: 15, lineHeight: 1.05 };
const STAT_RAIL_ITEM_GAP = 20;


/*
 * The chart legend keys and FIELD_LINE_SWATCH are GONE
 * (BRIEF_SCORECARD_TRAJECTORY_WHOOP §8): the field line is no longer drawn and
 * the round stroke is graded per hole, so neither key had anything to name.
 */


/**
 * A PLAYER'S SCORE AGAINST PAR — under par is RED (good in golf), over par is
 * INK, even par is muted. One source of truth with the tour surfaces
 * (`tourhub/_shared/scoreColor`), so a member card and a tour card colour the
 * same score identically. Course DIFFICULTY (red harder / green easier) is a
 * different semantic surface and does not appear on a scorecard.
 */
const EVEN_GRAY = TOPAR_EVEN_DARK;

export interface CardScorecardHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
  /** Optional field average for the hole — member course field or tour field. */
  fieldAvg?: number | null;
}

export interface CardScorecardRounds {
  available: number[];
  active: number;
  onSelect: (r: number) => void;
}

/** Member-only enrichment from `get_round_course_context`. Defaults off. */
export interface CardScorecardCourseContext {
  /** Inclusive of this round — the hero cell figure. */
  yourAvgToPar?: number | null;
  /**
   * Average of the member's OTHER rounds here, NULL when this is the only one.
   * The caption compares against this, never the self-inclusive average.
   */
  avgToParOthers?: number | null;
  roundsHere?: number | null;
  rankHere?: number | null;
  /**
   * §C — THE INDEX THE ROUND WAS PLAYED OFF (`whs_scores.handicap_index_at_time`).
   * OPTIONAL AND DEFAULTING ABSENT: the tour caller never passes it and its
   * output is unchanged. NULL means the provider recorded none for that score —
   * nothing renders, and today's index is NOT substituted.
   */
  indexAtTime?: number | null;
}

export interface CardScorecardSheetProps {
  open: boolean;
  onClose: () => void;
  // HEADER (course-first)
  eyebrowText: string;
  courseName: string;
  courseLocation?: string | null;
  coursePar?: number | null;
  courseSlope?: number | null;
  // MIDDLE
  holes: CardScorecardHole[];
  nineHole?: boolean;
  rounds?: CardScorecardRounds;
  heroMuted?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  emptyVariant?: 'syncing' | 'nohbh' | 'unavailable';
  emptyGross?: number | null;
  emptyToPar?: number | null;

  /**
   * Optional overrides merged into the BottomSheet surface style LAST. Used
   * by the /round page to host the sheet full-height so its charcoal surface
   * continues to the top of the viewport instead of stopping at 85dvh and
   * leaving a backdrop-dimmed band above it.
   */
  sheetStyle?: React.CSSProperties;

  /** 'member' (default) or 'tour'. Changes copy and stat labels only. */
  surface?: 'member' | 'tour';
  /** Member enrichment — omitted for a pro, who has no history at the venue. */
  courseContext?: CardScorecardCourseContext | null;

  // IDENTITY BLOCK (below scorecard)
  playerName: string;
  playerAvatarUrl?: string | null;
  playerHcp?: number | null;
  playerHcpDelta?: number | null;
  playerUserId?: string | null;
  /**
   * S3 — TOUR ONLY. sr_players.photo_url is populated for 2 of 2,879 players, so
   * reading it alone showed initials for nearly every tour player. With these two
   * the tour branch goes through resolvePlayerAvatarCandidates — the canonical
   * resolver the player profile page uses — which builds the ordered storage-path
   * chain from the player's name. The MEMBER branch is untouched: a member avatar
   * is user_profiles.profile_photo_url and is unrelated.
   */
  playerTourSlug?: string | null;
  playerHeadshotOverride?: string | null;
  /** Tour: shows a position ("T4") in place of the handicap index. */
  identityStat?: { label: string; value: string } | null;
  // FOOTER
  onViewProfile?: () => void;
  onViewCourse?: () => void;
  /** C3 — shown only for the viewer's own round; opens the composer pre-filled. */
  onShareRound?: () => void;
  /**
   * ENGAGEMENT (BRIEF_ROUND_COMMENTS_EVERYWHERE §S2.2). The sheet is where a
   * member lands from a round notification, so it carries BOTH a like and a
   * comment control. The host resolves both (content_reactions on the score id,
   * comments_v2 on the resolved post) — this component only draws them, and
   * draws nothing when the prop is absent, so the tour surface is untouched.
   */
  engagement?: CardScorecardEngagement | null;
  /**
   * THE HONOURS TREATMENT (BRIEF_DISCOVER_FILTER_LED_BOARD S5.6/S8.3). The
   * honours board rail is deleted; its metal survives HERE, on the one surface
   * that shows a single feat round. Null for an ordinary round, which is nearly
   * all of them, and then nothing renders.
   */
  feat?: HonoursFeat | null;
}


export interface CardScorecardEngagement {
  likeHidden?: boolean;
  likeCount: number;
  likeMine: boolean;
  onToggleLike: () => void;
  likeLabel: string;
  /** Absent when the round has no post — no comment affordance at all (§1.6). */
  comment?: { count: number; label: string; onOpen: () => void } | null;
}

/** Integer to-par: rounds first, then branches. Never `-0`. */
function fmtRel(n: number | null): string {
  if (n == null) return '\u2014';
  const r = Math.round(n);
  return r === 0 ? 'E' : r < 0 ? `\u2212${Math.abs(r)}` : `+${r}`;
}

function toParColor(n: number | null): string {
  if (n == null || Math.round(n) === 0) return EVEN_GRAY;
  return getScoreColor(Math.round(n), 'dark');
}

/* --------------------------------------------------------------- the card */

/*
 * THE STUB COLUMN (item 4). It was 26px, set when the axis labels were 8px, and
 * it was already too narrow for TOTAL then. With the floor at 11 the widest stub
 * string, "PAR 72", measures 48.3px, so the column is widened to 54px — the
 * measured width plus slack — and the width is taken out of the nine hole
 * columns, NOT out of the type. The centred OUT/IN segments sit on those nine
 * columns and so lose ~3px each at 320; both strings are nowrap and still fit.
 */
/*
 * §D1 — THE ROW LABEL COLUMN DROPS FROM 54px TO 26px. 54 was sized for the
 * TOTAL / PAR 72 rows of the grand-totals block, which §B removed; the labels
 * that remain are HOLE, PAR, YOU and FIELD at 9.5px tracked caps, the widest of
 * which measures under 26. The 28px it gives back goes to the nine score
 * columns, which is where a 390pt card is tightest. The right-hand total column
 * stays at 32px — it carries two-digit strokes and is unchanged.
 */
const NINE_GRID = '26px repeat(9, minmax(0, 1fr)) 32px';

/**
 * Result marks come from the shared ScoreMark renderer — one grammar across the
 * sheet, the feed card and the Holes legend. Par is unmarked on purpose:
 * marking every hole marks nothing.
 */


const CardRow: React.FC<{
  label: string;
  cells: React.ReactNode[];
  total: React.ReactNode;
  muted?: boolean;
  tone?: string;
}> = ({ label, cells, total, muted, tone }) => (
  <div style={{ display: 'grid', gridTemplateColumns: NINE_GRID, alignItems: 'center', gap: 2, padding: '3px 0' }}>
    <span style={{ ...LABEL_AXIS }}>{label}</span>
    {cells.map((c, i) => (
      <span key={i} style={{ textAlign: 'center', minWidth: 0 }}>
        {typeof c === 'object' ? c : (
          <span style={{ ...NUM, fontSize: 12, fontWeight: muted ? 500 : 700, color: tone ?? (muted ? A.MUTE : A.INK) }}>
            {c}
          </span>
        )}
      </span>
    ))}
    <span style={{ ...NUM, fontSize: 13, color: A.INK, textAlign: 'center' }}>{total}</span>
  </div>
);

/**
 * ONE SOURCE FOR THE NINE FIGURES. The totals row now SHOWS its working
 * (OUT 36 / IN 39 / 75), so the gross beside the two nines must be the sum of
 * exactly the figures rendered above it. Both <Nine> and the totals row read
 * their par/strokes through this helper so the two can never be derived from
 * different filters and disagree on screen.
 */
/**
 * BRIEF_TOUR_SCORECARD_SHEET_FOUR_FAULTS S1 — A PARTIAL NINE IS NOT A NINE.
 *
 * `strokes` and `par` keep their old meaning (the full nine's arithmetic, which
 * the gross invariant at the totals block depends on). Two fields are ADDED:
 *
 *  - playedCount: how many holes on this nine carry a real score. Zero means
 *    the nine has not started, and a nine that has not started shows NOTHING —
 *    a 0 there is a claim, and it is false.
 *  - parPlayed: par for exactly the holes played, so a partial nine's strokes
 *    are compared against a par that covers the same holes (30 against 31 at
 *    eight holes, never 30 against 35).
 */
function nineSummary(rows: CardScorecardHole[]): {
  par: number;
  strokes: number;
  playedCount: number;
  parPlayed: number;
} {
  const scored = rows.filter((h) => h.strokes != null && h.strokes > 0);
  return {
    par: rows.reduce((s, h) => s + (h.par ?? 0), 0),
    strokes: scored.reduce((s, h) => s + (h.strokes as number), 0),
    playedCount: scored.length,
    parPlayed: scored.reduce((s, h) => s + (h.par ?? 0), 0),
  };
}


const Nine: React.FC<{
  rows: CardScorecardHole[];
  label: string;
  /**
   * FIELD ROW — MEMBER CARD DOES NOT SHOW IT. The field comparison is already
   * stated in prose directly above the card ("beat the field average on 14 of
   * 18 holes scored so far"), and a third row of small signed figures under two
   * rows that already carry the story is noise. Per-hole field figures remain
   * available behind "See all 18 holes". The TOUR card keeps the row: there the
   * field is the tournament field for that round and is the primary reference
   * point, not a secondary one, so callers gate this on surface.
   */
  withField: boolean;
  scoreLabel: string;
}> = ({ rows, label, withField, scoreLabel }) => {
  const { t } = useTranslation(['courses']);
  const { par, strokes, playedCount, parPlayed } = nineSummary(rows);
  /**
   * S1.2 / S1.3 — the nine's two totals.
   *  - No hole played: BOTH totals are absent (empty, not 0, not a dash).
   *    A completed nine and a genuine nine-hole round are unaffected.
   *  - Part played: par covers the holes played, so the strokes beside it mean
   *    something. Fully played: the nine's par, exactly as before.
   */
  const started = playedCount > 0;
  const partial = started && playedCount < rows.length;
  const parTotal = !started ? '' : partial ? parPlayed : (par || '\u2014');
  const strokesTotal = started ? strokes : '';

  const fieldRel = withField
    ? rows.reduce(
        (s, h) => s + (h.fieldAvg != null && h.par != null ? h.fieldAvg - h.par : 0),
        0,
      )
    : null;

  return (
    <div>
      <CardRow label={t('courses:scorecard.hole')} cells={rows.map((h) => h.holeNo)} total={label} muted />
      <CardRow label={t('courses:scorecard.par')} cells={rows.map((h) => h.par ?? '\u2014')} total={parTotal} muted />
      <CardRow
        label={scoreLabel}
        cells={rows.map((h) => (
          <ScoreMark key={h.holeNo} strokes={h.strokes} par={h.par ?? 4} size={22} surface="dark" />
        ))}
        total={strokesTotal}
      />

      {withField && (
        <CardRow
          label={t('courses:scorecard.fieldAvg')}
          cells={rows.map((h) => {
            const d = h.fieldAvg != null && h.par != null ? h.fieldAvg - h.par : null;
            if (d == null) return '';
            const r = Math.round(d * 10) / 10;
            return `${r > 0 ? '+' : r < 0 ? '\u2212' : ''}${Math.abs(r).toFixed(1)}`;
          })}
          total={
            fieldRel != null
              ? `${fieldRel > 0 ? '+' : fieldRel < 0 ? '\u2212' : ''}${Math.abs(Math.round(fieldRel * 10) / 10).toFixed(1)}`
              : ''
          }
          muted
        />
      )}
    </div>
  );
};





/**
 * THE SCORING KEY IS A KEY, NOT A TALLY (BRIEF_SCORECARD_TRAJECTORY_WHOOP §9.1).
 * The key teaches the MARK, not an incidental stroke count. ScoreMark can hide
 * its numeral while preserving the fill, tone and magnitude/rarity ring, so the
 * examples still use real score/par pairs but cannot imply that (for example)
 * every 3 is a birdie. Labels carry the outcome names.
 */
/**
 * MICRO_BRIEF_SCORING_KEY §1.2 — EACH ITEM'S MARK SITS IN A FIXED-WIDTH BOX.
 * ScoreMark is a fixed size x size box and centres its own contents, but in a
 * gapped flex row beside unringed siblings any optical difference between a
 * ringed and a bare mark reads as an alignment fault. A fixed MARK_BOX equal to
 * the largest mark's outer diameter, with the mark centred inside it, makes
 * every item occupy the same width and share one horizontal AND vertical
 * centreline. The fix is in the key: ScoreMark has four callers and is untouched.
 *
 * §2.2 — THE KEY SHOWS ONLY WHAT THE ROUND CONTAINS. Birdie, bogey and double+
 * are always shown because they teach the grammar a member reads while scanning.
 * Eagle, ace and albatross are conditional — never explain a mark this card does
 * not carry. Derived from the SAME hole data the card renders, so the key and
 * the card can never disagree.
 *
 * THE SCORING KEY IS A KEY, NOT A TALLY (BRIEF_SCORECARD_TRAJECTORY_WHOOP §9.1).
 * The key teaches the MARK, not an incidental stroke count. ScoreMark can hide
 * its numeral while preserving the fill, tone and magnitude/rarity ring, so the
 * examples still use real score/par pairs but cannot imply that (for example)
 * every 3 is a birdie. Labels carry the outcome names.
 */
const KEY_MARK_SIZE = 22;
/* The ring is drawn inset:0 inside the mark box, so outer diameter == size.
   The box is the mark size exactly; it exists to equalise item widths. */
const KEY_MARK_BOX = KEY_MARK_SIZE;

const Legend: React.FC<{ holes: CardScorecardHole[]; hasUnplayed?: boolean }> = ({ holes, hasUnplayed }) => {
  const { t } = useTranslation(['courses']);

  const rarities = React.useMemo(() => {
    let eagle = false, ace = false, alba = false;
    for (const h of holes) {
      const s = h.strokes;
      const p = h.par;
      if (s == null || s <= 0 || p == null) continue;
      if (s === 1) { ace = true; continue; }
      const d = s - p;
      if (d <= -3) alba = true;
      else if (d === -2) eagle = true;
    }
    return { eagle, ace, alba };
  }, [holes]);

  const keys: { strokes: number | null; label: string; showStroke?: boolean }[] = [
    { strokes: 3, label: t('courses:scorecard.legendBirdie') },
  ];
  if (rarities.eagle) keys.push({ strokes: 2, label: t('courses:scorecard.legendEagle') });
  // AN ALBATROSS AND AN ACE TAKE THE SAME MARK (GOLD-FILLED DISC, ringed —
  // twice for an albatross, once for an eagle; the old note here said "solid
  // red, gold ring" and was wrong about the fill): the
  // grammar does not distinguish them. If a round contains both we show the
  // RARER one once (albatross) rather than two identical entries.
  if (rarities.alba) keys.push({ strokes: 1, label: t('courses:scorecard.legendAlbatross') });
  else if (rarities.ace) keys.push({ strokes: 1, label: t('courses:scorecard.legendAce') });
  /**
   * §D5 — PAR IS NAMED. It is the most common cell on the card and was the only
   * unexplained one on a completed round: a reader who sees a numeral with no
   * mark had nothing telling them that absence of a mark IS the statement. The
   * entry is a bare numeral (strokes === par), which is exactly what the card
   * draws — the key stays generated from ScoreMark, never hand-drawn. It sits
   * between the under-par marks and the over-par marks, in scoring order.
   */
  keys.push({ strokes: 4, label: t('courses:scorecard.legendPar'), showStroke: true });
  keys.push({ strokes: 5, label: t('courses:scorecard.legendBogey') });
  keys.push({ strokes: 6, label: t('courses:scorecard.legendDouble') });
  /**
   * S4 — THE FOURTH TREATMENT IS THE UNPLAYED HOLE, AND IT IS NOW NAMED.
   * Par stays deliberately unmarked (marking every hole marks nothing), so the
   * only unexplained cell on a live card was the empty one. ScoreMark already
   * renders it as a faint mid-dot — no new glyph — and this entry appears ONLY
   * while holes remain unplayed, so a completed card's key is unchanged.
   */
  if (hasUnplayed) {
    keys.push({ strokes: null, label: t('courses:scorecard.legendNotPlayed'), showStroke: true });
  }

  return (
    <div>
      {/* THE KEY IS CENTRED UNDER THE CARD (BRIEF_SCORECARD_CHART_ALIGNMENT §4).
          Centre justification also centres a trailing item under the ones that
          wrapped above it, instead of leaving it hanging left. */}
      <div style={{ ...LABEL_READ, color: A.INK, marginBottom: 8, textAlign: 'center' }}>
        {t('courses:holes.scoringKey.title')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, rowGap: 10, flexWrap: 'wrap' }}>
        {keys.map((k) => (
          <span key={k.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, lineHeight: 1 }}>
            <span
              style={{
                width: KEY_MARK_BOX,
                height: KEY_MARK_BOX,
                flex: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ScoreMark strokes={k.strokes} par={4} size={KEY_MARK_SIZE} surface="dark" showStroke={k.showStroke === true} />
            </span>
            <span style={{ ...LABEL_READ }}>{k.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};



/* ------------------------------------------------------ round breakdown */

/**
 * THE BREAKDOWN BAR KEEPS ITS SEMANTIC COLOURS — deliberate, do not neutralise.
 * This sheet pairs one round with a facsimile of a physical card, where RED
 * ALREADY MEANS UNDER PAR in the card's red circles, so a red BIRDIE+ agrees
 * with the card inches below it. The Course-tab hole rows had to surrender the
 * bar's colour because they are a FIELD comparison and needed green/red to mark
 * you against the field. Different jobs, different rules. Do not "harmonise".
 *
 * A zero band renders NO segment (never a zero-width sliver) and its cell shows
 * 0 in quiet chrome rather than the band colour — a colour there would claim a score
 * that was not made.
 */
const RoundSplit: React.FC<{ split: { label: string; n: number; tone: string }[] }> = ({ split }) => (
  <div>
    <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
      {split.filter((s) => s.n > 0).map((s) => (
        <i key={s.label} style={{ height: 6, flex: s.n, background: s.tone, borderRadius: 3 }} />
      ))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${split.length}, minmax(0, 1fr))` }}>
      {split.map((s) => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={LABEL_READ}>{s.label}</div>
          <div style={{ ...NUM, fontSize: 18, color: s.n > 0 ? s.tone : A.MUTE, marginTop: 3 }}>{s.n}</div>
        </div>
      ))}
    </div>
  </div>
);


/* -------------------------------------------- loading and empty middles */

const HandicapChip: React.FC<{ delta: number }> = ({ delta }) => {
  const cut = delta < 0;
  const color = cut ? TREND_UP : TREND_DOWN;
  const arrow = cut ? '\u2193' : '\u2191';
  return (
    <span style={{ ...LABEL_READ, color, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span aria-hidden="true">{arrow}</span>
      {Math.abs(delta).toFixed(1)}
    </span>
  );
};

const SKEL_BG = A.TRACK;
const KEYFRAMES = `
@keyframes cardsheetPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes cardsheetSpin { to { transform: rotate(360deg); } }
`;

const SkeletonMiddle: React.FC = () => (
  <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <style>{KEYFRAMES}</style>
    {[168, 116].map((h, i) => (
      <div
        key={i}
        style={{
          height: h, borderRadius: 16, background: A.PANEL,
          border: `1px solid ${A.BORDER}`, padding: 16,
        }}
      >
        <div
          style={{
            height: '100%', borderRadius: 10, background: SKEL_BG,
            animation: `cardsheetPulse 1.4s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      </div>
    ))}
  </div>
);

const SyncingMiddle: React.FC = () => {
  const { t } = useTranslation(['courses']);
  return (
    <Panel style={{ textAlign: 'center' }}>
      <style>{KEYFRAMES}</style>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 12, padding: '18px 0 6px',
        }}
      >
        <div style={{ position: 'relative', width: 46, height: 46 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${A.TRACK}` }} />
          <div
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid transparent', borderTopColor: A.AMBER,
              animation: 'cardsheetSpin 0.9s linear infinite',
            }}
          />
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: A.AMBER,
            }}
          >
            <RefreshCw size={16} strokeWidth={2.2} />
          </div>
        </div>
        <div style={TITLE}>{t('courses:scorecard.syncingTitle')}</div>
        <div style={{ ...CAPTION, maxWidth: 250 }}>{t('courses:scorecard.syncingBody')}</div>
      </div>
    </Panel>
  );
};

const UnavailableMiddle: React.FC = () => {
  const { t } = useTranslation(['courses']);
  return (
    <Panel style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 10, padding: '18px 0 6px', color: A.MUTE,
        }}
      >
        <Table size={22} strokeWidth={1.6} />
        <div style={TITLE}>{t('courses:scorecard.unavailableTitle')}</div>
        <div style={{ ...CAPTION, maxWidth: 250 }}>{t('courses:scorecard.unavailableBody')}</div>
      </div>
    </Panel>
  );
};

const NohbhMiddle: React.FC<{ gross: number | null; toPar: number | null }> = ({ gross, toPar }) => {
  const { t } = useTranslation(['courses']);
  return (
    <Panel>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 10, textAlign: 'center', color: A.MUTE,
        }}
      >
        <Table size={22} strokeWidth={1.6} />
        <div style={TITLE}>{t('courses:scorecard.grossOnlyTitle')}</div>
        <div style={{ ...CAPTION, maxWidth: 250 }}>{t('courses:scorecard.grossOnlyBody')}</div>
      </div>
      {gross != null && (
        <StatRow
          style={{ marginTop: 18 }}
          items={[
            { label: t('courses:scorecard.gross'), value: gross },
            { label: t('courses:scorecard.toPar'), value: fmtRel(toPar), tone: toParColor(toPar) },
          ]}
        />
      )}
    </Panel>
  );
};

/* ------------------------------------------------------------- the sheet */

export const CardScorecardSheet: React.FC<CardScorecardSheetProps> = ({
  open, onClose, eyebrowText,
  courseName, courseLocation, coursePar, courseSlope,
  holes, nineHole, rounds, heroMuted, emptyMessage, loading,
  emptyVariant, emptyGross, emptyToPar,
  surface = 'member', courseContext,
  playerName, playerAvatarUrl, playerHcp, playerHcpDelta, playerUserId, identityStat,
  playerTourSlug, playerHeadshotOverride,
  onViewProfile, onViewCourse, onShareRound, engagement = null,
  feat = null,
  sheetStyle,

}) => {
  const { t } = useTranslation(['courses']);
  void emptyMessage;
  void coursePar;
  void courseSlope;

  /**
   * §B — THE KICKER. `nineHole` is no longer voided: a nine-hole round says so
   * on the one line that describes the round's format, and an eighteen-hole
   * round is unchanged (no suffix, no separator, no empty space).
   */
  const kickerText = nineHole
    ? (eyebrowText
        ? `${eyebrowText} \u00B7 ${t('courses:scorecard.nineHoleTag')}`
        : t('courses:scorecard.nineHoleTag'))
    : eyebrowText;


  const isTour = surface === 'tour';
  /**
   * S3 — the tour avatar's ordered candidate chain, from the ONE canonical
   * resolver (consumed, never re-implemented). photo_url still wins when it is
   * there; otherwise SquircleAvatar walks the name-derived storage paths and
   * falls back to initials only when every candidate misses.
   */
  const tourAvatarCandidates = React.useMemo(
    () => (isTour
      ? resolvePlayerAvatarCandidates({
          name: playerName,
          photoUrl: playerAvatarUrl ?? null,
          tourSlug: playerTourSlug ?? null,
          headshotOverride: playerHeadshotOverride ?? null,
        })
      : []),
    [isTour, playerName, playerAvatarUrl, playerTourSlug, playerHeadshotOverride],
  );
  const { user } = useSupabaseSession();
  /**
   * OWNERSHIP is still derived, never passed — it drives the amber own-member
   * rule on the member row and the card's score-column stub. The VOICE
   * machinery (possessives, impersonal fallbacks, subject slots) is gone with
   * the sentences: a figure rail has no subject to name, so an empty
   * playerName can no longer produce a bare apostrophe anywhere.
   */
  const isOwner = !isTour && !!playerUserId && !!user?.id && playerUserId === user.id;


  const played = useMemo(
    () => holes.filter((h) => h.strokes != null && h.strokes > 0 && h.par != null),
    [holes],
  );

  const totals = useMemo(() => {
    let gross = 0;
    let toPar = 0;
    for (const h of played) {
      gross += h.strokes as number;
      toPar += (h.strokes as number) - (h.par as number);
    }
    return { gross, toPar, played: played.length > 0 };
  }, [played]);

  const fieldHoles = useMemo(() => played.filter((h) => h.fieldAvg != null), [played]);
  const withField = fieldHoles.length >= 2;

  const fieldRoundTotal = withField
    ? fieldHoles.reduce((s, h) => s + (h.fieldAvg as number), 0)
    : null;

  const beatFieldOn = withField
    ? fieldHoles.filter((h) => (h.strokes as number) <= (h.fieldAvg as number)).length
    : null;

  /**
   * §G — WHY THERE IS NO CARD, AS A MEASURED FACT.
   *
   * 568 of 3,554 rounds (16%) cannot draw a card, and they fail for THREE
   * different reasons that the sheet previously collapsed into one: 148 have no
   * hole rows at all, 420 have rows with every gross null, and 195 have some
   * holes scored and some not. `holes.length > 0` was true for the middle group,
   * so those rounds drew an eighteen-column grid of empty cells.
   *
   * The cause is derived once, here, and used both by the render gate and by the
   * event, so what a member saw and what we recorded cannot disagree.
   */
  const cardCause: 'ok' | 'partial' | 'unscored' | 'norows' = useMemo(() => {
    if (holes.length === 0) return 'norows';
    if (played.length === 0) return 'unscored';
    return played.length === holes.length ? 'ok' : 'partial';
  }, [holes.length, played.length]);

  // scorecard_opened — has_field_data is the evidence for whether the
  // enrichment is reaching members at all; card_cause is the evidence for how
  // often the sheet opens on a round it cannot draw, split by reason.
  useEffect(() => {
    if (!open) return;
    analyticsEvents.track('scorecard_opened', {
      surface,
      holes: played.length,
      has_field_data: withField,
      card_cause: cardCause,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /**
   * BRIEF_ROUND_SHEET_SPLIT §2 — THE RAIL.
   *
   * Three facts, three figure-over-label pairs, in this order: rank here,
   * this round against the member's OTHER rounds here, holes matched or beaten
   * against the field. ANY FIGURE WHOSE SOURCE IS NULL PUSHES NOTHING — no
   * cell, no dash — and the rail closes up because it is a flex row.
   *
   * THE DERIVATIONS ARE THE ONES THAT WERE BEHIND THE SENTENCES, unchanged:
   *
   *  - vs-avg is gated on avgToParOthers being non-null, NOT on roundsHere > 1.
   *    The null is the honest signal: a member's only round at a course cannot
   *    be compared with their others, and the RPC returns null for exactly that
   *    case. othersCount stays Math.max(roundsHere - 1, 1) and is retained as
   *    the sample size behind the comparison even though the rail no longer
   *    prints it.
   *  - the field figure counts strokes <= fieldAvg, so a MATCHED hole counts.
   *    The denominator is fieldHoles.length (holes with both a score and a
   *    field average), never 18 and never played.length.
   *  - rank 1 does not take an ordinal (formatOrdinal(1) -> "1st", which read
   *    as "1st of 19"). It prints BEST instead, the same correction the
   *    neutral-best sentence carried.
   */
  /**
   * §C — ONE POOL PER PANEL. The member's rank here, this round against their
   * other rounds here, and the index they carried INTO the round are all one
   * pool: THE MEMBER'S OWN HISTORY AT THIS COURSE. They leave the header rail
   * and become a titled section that states its own sample ("Your 7 rounds
   * here"), so no figure sits beside a figure drawn from a different pool
   * without a basis.
   *
   * The derivations are byte-for-byte the ones that were in the rail:
   *  - rank 1 prints BEST, never "1st of 1".
   *  - vs-avg is gated on avgToParOthers being non-null (the RPC returns null
   *    when this is the member's only round here) — never on roundsHere > 1.
   *  - INDEX THEN is `handicap_index_at_time`, the index the round was played
   *    off. It is NOT the member's current index: the current index is a fact
   *    about today, and putting it on a round from March claimed something
   *    false. When the provider gave no index at the time, NOTHING renders —
   *    there is no fallback to today's figure.
   */
  const courseSection = useMemo(() => {
    const items: { key: string; value: string; label: string; tone?: string }[] = [];
    if (isTour || !courseContext) return items;
    const roundsHere = courseContext.roundsHere ?? 0;
    if (courseContext.rankHere != null && roundsHere > 0) {
      items.push({
        key: 'rank',
        value: courseContext.rankHere === 1
          ? t('courses:scorecard.figBest')
          : formatOrdinal(courseContext.rankHere),
        label: t('courses:scorecard.figOf', { count: roundsHere }),
      });
    }
    const avgOthers = courseContext.avgToParOthers;
    if (avgOthers != null && totals.played) {
      const diff = Math.round((totals.toPar - avgOthers) * 10) / 10;
      items.push({
        key: 'vsavg',
        value: Math.abs(diff) < 0.05
          ? 'E'
          : diff < 0
            ? `\u2212${Math.abs(diff).toFixed(1)}`
            : `+${diff.toFixed(1)}`,
        label: t('courses:scorecard.figVsAvg'),
        tone: Math.abs(diff) < 0.05 ? EVEN_GRAY : toParColor(diff < 0 ? -1 : 1),
      });
    }
    if (courseContext.indexAtTime != null) {
      items.push({
        key: 'indexthen',
        value: formatHcp(courseContext.indexAtTime),
        label: t('courses:scorecard.figIndexThen'),
      });
    }
    return items;
  }, [isTour, courseContext, totals, t]);

  const rail = useMemo(() => {
    const items: { key: string; value: string; label: string; tone?: string }[] = [];
    /**
     * THE BEAT-FIELD FIGURE STAYS IN THE RAIL FOR NOW (§E2/E3 HELD). It is the
     * one figure on this sheet drawn from the FIELD pool rather than the
     * member's own history, and it cannot state its basis until the field
     * average can exclude the caller and report how many players it covers.
     * Moving it and gating it is ONE change, made once that function exists —
     * not two half-changes. Until then it renders exactly as it shipped.
     */
    if (withField && beatFieldOn != null) {
      items.push({
        key: 'field',
        value: `${beatFieldOn}/${fieldHoles.length}`,
        label: t('courses:scorecard.figBeatField'),
      });
    }
    /**
     * The tour position keeps the rail — a pro has no history section to move
     * into. The member's CURRENT index no longer appears here at all when the
     * course section renders: that section carries INDEX THEN, and showing both
     * put two different indexes on one sheet.
     */
    if (identityStat) {
      items.push({ key: 'identity', value: identityStat.value, label: identityStat.label });
    } else if (playerHcp != null && courseSection.length === 0) {
      items.push({
        key: 'hcp',
        value: formatHcp(playerHcp),
        label: t('courses:scorecard.handicapIndex'),
      });
    }
    return items;
  }, [withField, beatFieldOn, fieldHoles.length, identityStat, playerHcp, courseSection.length, t]);




  const split = useMemo(() => {
    const d = (h: CardScorecardHole) => (h.strokes as number) - (h.par as number);
    return [
      { label: t('courses:scorecard.splitBirdie'), n: played.filter((h) => d(h) <= -1).length, tone: TOPAR_UNDER_DARK },
      { label: t('courses:scorecard.splitPar'), n: played.filter((h) => d(h) === 0).length, tone: TOPAR_EVEN_DARK },
      { label: t('courses:scorecard.splitBogey'), n: played.filter((h) => d(h) === 1).length, tone: A.MUTE },
      { label: t('courses:scorecard.splitDouble'), n: played.filter((h) => d(h) >= 2).length, tone: TOPAR_OVER_DARK },
    ];
  }, [played, t]);




  const out = holes.filter((h) => h.holeNo <= 9);

  const back = holes.filter((h) => h.holeNo > 9);

  /**
   * TOTALS ARE DERIVED FROM THE NINES SHOWN ABOVE, NOT COMPUTED SEPARATELY.
   * The row displays OUT n / IN n either side of the gross, so a reader adds
   * them. cardGross and cardTotalPar therefore come from the same nineSummary
   * calls that produced those two figures. to-par is NOT recomputed here: it
   * stays totals.toPar, the single hole-by-hole derivation.
   */
  const outSummary = nineSummary(out);
  const backSummary = back.length > 0 ? nineSummary(back) : null;
  const cardGross = outSummary.strokes + (backSummary?.strokes ?? 0);
  const cardTotalPar = outSummary.par + (backSummary?.par ?? 0);
  const totalPar = played.reduce((s, h) => s + (h.par as number), 0);
  /**
   * S1.3 — WHICH PAR THE ROUND IS SHOWN AGAINST. A completed card (18 or a
   * genuine nine) reads against the card's own par, exactly as before. A round
   * still in progress reads against the par of the holes played — the same par
   * totals.toPar is measured against — so the figures agree with each other.
   * cardGross and cardTotalPar are untouched: the invariant and the DEV warning
   * above keep their original inputs.
   */
  const allHolesPlayed = holes.length > 0 && played.length === holes.length;
  const shownPar = allHolesPlayed ? cardTotalPar : totalPar;
  const showOutSeg = outSummary.playedCount > 0;
  const showInSeg = (backSummary?.playedCount ?? 0) > 0;
  if (import.meta.env.DEV) {
    // The visible sum must agree with the hero/stat gross. A mismatch means the
    // nines and the round totals were filtered differently - loud, not silent.
    if (totals.played && cardGross !== totals.gross) {
      console.warn('[CardScorecardSheet] gross mismatch', { cardGross, gross: totals.gross });
    }
    // Par can legitimately differ mid-round: cardTotalPar counts every hole on
    // the card, totalPar only the holes played (which is what to-par is measured
    // against). Flag it so a full-round disagreement is not mistaken for that.
    if (totals.played && cardTotalPar !== totalPar && played.length === holes.length) {
      console.warn('[CardScorecardSheet] par mismatch', { cardTotalPar, totalPar });
    }
  }


  /**
   * The FIELD row is a tour-card row only — see the note on <Nine>. On the
   * member card the prose above states the field comparison and the per-hole
   * figures live in the holes sheet.
   */
  const showFieldRow = withField && isTour;

  // The card column header has no room for a name and the legend above already
  // names the player, so a third-person card leaves the score-column label blank.
  /*
   * §D2 — A THIRD-PERSON CARD NO LONGER HAS AN UNLABELLED SCORE ROW. YOU is
   * right for the viewer's own round and wrong for anyone else's, but the answer
   * was never an empty cell: on a pro's card the row beneath PAR had no name at
   * all. It falls back to SCORE, which is true of every card.
   */
  const cardScoreLabel = isOwner ? t('courses:scorecard.you') : t('courses:scorecard.scoreRow');


  const showChip = playerHcpDelta != null && Math.abs(playerHcpDelta) >= 0.05;
  const showIdentity = !!playerName;
  /*
   * §G — THE GATE READS SCORED HOLES, NOT HOLE ROWS. 420 rounds carry eighteen
   * rows with every gross null; `holes.length > 0` let those through and drew a
   * grid of empty cells with a scoring key beneath it. An unscored round now
   * takes the same explained state as a round with no rows at all.
   */
  const hasHoles = cardCause === 'ok' || cardCause === 'partial';

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="dark"
      // The grabber strip is the only place the BottomSheet surface itself
      // shows through — everything below it is painted by the content column
      // (fixed summary header on PANEL, scrolling body on CANVAS). So the
      // surface takes PANEL, or the grabber sits on a visibly different band
      // from the header directly under it.
      surfaceColor={A.PANEL}
      style={{ background: A.PANEL, height: 'auto', maxHeight: '85dvh', display: 'flex', flexDirection: 'column', ...sheetStyle }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: SANS, background: A.CANVAS, flex: 1, minHeight: 0, ...FIGS }}>
        {/*
          S1 — THE FIXED SUMMARY (BRIEF_ROUND_SHEET_SPLIT).

          The score used to appear only at the FOOT of the expanded grid, after a
          date, a course, a handicap index and two links. It is now the first
          thing on the sheet and it does not scroll: the card, the breakdown and
          the chart scroll beneath this block.

          DISMISS IS SAFE. BottomSheet binds its touch drag handlers to the
          GRABBER ROW ONLY, not to the sheet body, so a non-scrolling header
          inside the sheet cannot capture the dismiss gesture. This block sits
          BELOW that grabber and never sees those events.
        */}
        {/* THE HONOURS BAND. Champagne for the albatross, bone for the ace —
            they separate by SATURATION, never by value. It sits above the
            summary because the feat is why this round is worth a look. */}
        {feat && (
          <div
            style={{
              flexShrink: 0,
              background: honoursGround(feat),
              borderTop: `1px solid ${METAL_TOP_EDGE}`,
              borderBottom: `1px solid ${METAL_HAIRLINE}`,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: METAL_GOLD,
              }}
            >
              {feat === 'ace' ? 'Hole in one' : 'Albatross'}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: METAL_INK, opacity: 0.62 }}>
              {feat === 'ace' ? 'Honours' : 'Honours · rarest of all'}
            </span>
          </div>
        )}
        <div

          style={{
            padding: '12px 16px 10px',
            background: A.PANEL,
            borderBottom: `1px solid ${A.BORDER}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* LEFT — date, course, member */}
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              {/* §B — THE KICKER CARRIES THE FORMAT. A nine-hole round is 30 of
                  3,554 rounds, and on those the card, the totals and the to-par
                  are all read against nine holes; the kicker is where that is
                  said once. Eighteen holes is the default and says nothing. */}
              {!!kickerText && (
                <div style={{ ...KICKER, color: A.MUTE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {kickerText}
                </div>
              )}
              <div
                style={{
                  fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em',
                  color: A.INK, marginTop: 3, lineHeight: 1.18,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}
              >
                {courseName}
              </div>
              {/* §B — THE VENUE'S PLACE STEPS BACK ONE TONE. The course name
                  went up to 20px, so the line beneath it has to drop from MUTE
                  to DIM or the two read as one two-line title. */}
              {courseLocation && (
                <div style={{ fontSize: 12, color: A.DIM, marginTop: 2 }}>{courseLocation}</div>
              )}
              {/* MEMBER ROW. With NO NAME nothing renders — no avatar, no
                  avatar-shaped hole. Amber marks the viewer's own round. */}
              {showIdentity && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, minWidth: 0 }}>
                  <span style={{ flexShrink: 0, marginRight: 8 }}>
                    <SquircleAvatar
                      {...(isTour
                        ? { srcCandidates: tourAvatarCandidates }
                        : { src: playerAvatarUrl ?? null })}
                      alt={playerName}
                      userId={playerUserId ?? undefined}
                      size={22}
                      hairlineRing
                    />
                  </span>
                  <span
                    style={{
                      fontSize: 12.5, fontWeight: 700,
                      color: isOwner ? A.AMBER : A.INK,
                       flex: '0 1 auto', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                    title={playerName}
                  >
                    {playerName}
                  </span>
                   {/* §B — THE ENGAGEMENT PAIR IS PUSHED TO THE RIGHT EDGE of the
                       member row instead of hanging one gap off the end of the
                       name. A short name no longer leaves the heart floating in
                       the middle of the row. */}
                   {engagement && (
                     <span style={{ marginLeft: 'auto', paddingLeft: 12, flexShrink: 0 }}>
                    <RoundEngagementActions
                      comment={engagement.comment ?? null}
                      like={{
                        hidden: engagement.likeHidden,
                        count: engagement.likeCount,
                        reacted: engagement.likeMine,
                        onToggle: engagement.onToggleLike,
                        label: engagement.likeLabel,
                      }}
                    />
                     </span>
                  )}
                  {showChip && <span style={{ marginLeft: 8, flexShrink: 0 }}><HandicapChip delta={playerHcpDelta as number} /></span>}
                </div>
              )}
            </div>

            {/* RIGHT — THE SCORE. Visible the moment the sheet opens. */}
            {totals.played && (
              <div style={{ flex: 'none', textAlign: 'right' }}>
                <div
                  style={{
                    /* §B — 34, not 38. The course name went to 20 and the gross
                       no longer competes with a second copy of itself in the
                       totals block, so it can give back four points. */
                    ...NUM, fontSize: 34, fontWeight: 800, lineHeight: 0.9,
                    letterSpacing: '-0.05em',
                    color: heroMuted ? EVEN_GRAY : A.INK,
                  }}
                >
                  {totals.gross}
                </div>
                <div
                  style={{
                    ...NUM, fontSize: 13, fontWeight: 700, marginTop: 6,
                    color: heroMuted ? EVEN_GRAY : toParColor(totals.toPar),
                  }}
                >
                  {fmtRel(totals.toPar)}
                </div>
                {/* §B — THE PAR IS A KICKER, not a third figure: it is the
                    basis the two figures above are read against, so it takes
                    the caps-tracked label role. */}
                {(shownPar > 0 || coursePar != null) && (
                  <div style={{ ...LABEL_READ, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 }}>
                    {t('courses:scorecard.parN', { n: shownPar > 0 ? shownPar : coursePar })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* S1.3 — THE RAIL. Nothing renders when no figure resolves. */}
          {rail.length > 0 && (
            <>
              <Hairline style={{ margin: '12px 0 10px' }} />
              <div style={{ display: 'flex', gap: STAT_RAIL_ITEM_GAP, flexWrap: 'wrap' }}>
                {rail.map((it) => (
                  <div key={it.key} style={{ minWidth: 0 }}>
                    <div style={{ ...RAIL_FIG, color: it.tone ?? A.INK }}>{it.value}</div>
                    <div style={{ ...LABEL, fontSize: 9.5, letterSpacing: '0.12em', marginTop: 3 }}>{it.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            background: A.CANVAS,
            padding: '12px 14px calc(env(safe-area-inset-bottom, 0px) + 24px)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}
        >
          {/* ROUND SELECTOR */}
          {rounds && rounds.available.length > 1 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {rounds.available.map((r) => {
                const active = r === rounds.active;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => rounds.onSelect(r)}
                    aria-pressed={active}
                    aria-label={t('courses:scorecard.roundN', { n: r })}
                    style={{
                      // S2 — flexShrink: 0. Inside an overflowX scroller the
                      // pills were shrinkable flex items and collapsed onto
                      // their padding box, painting as bare capsules. Every
                      // other pill row in the app pins this for the same reason.
                      flexShrink: 0,
                      minWidth: 44, textAlign: 'center',
                      padding: '6px 13px', borderRadius: 999,
                      background: active ? A.INK : A.PANEL,
                      color: active ? A.CANVAS : A.INK,
                      border: `1px solid ${active ? A.INK : A.BORDER}`,
                      fontFamily: SANS, fontSize: 11.5, fontWeight: 700, lineHeight: 1.2,
                      letterSpacing: '0.04em', cursor: 'pointer', whiteSpace: 'nowrap',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {t('courses:scorecard.roundShort', { n: r })}
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <SkeletonMiddle />
          ) : !hasHoles && emptyVariant === 'unavailable' ? (
            <UnavailableMiddle />
          ) : !hasHoles && emptyVariant === 'nohbh' ? (
            <NohbhMiddle gross={emptyGross ?? null} toPar={emptyToPar ?? null} />
          ) : !hasHoles ? (
            <SyncingMiddle />
          ) : (
            <>
              {/*
                S4.1 — THE CARD LEADS, because that is what the sheet is for. It
                is no longer behind a "Full scorecard" toggle: the grid was on
                the same screen as its own CTA. The scoring key stays with the
                card, directly beneath it (S4.2).
              */}
              <Panel kicker={t('courses:scorecard.theCard')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Nine rows={out} label={t('courses:scorecard.out')} withField={showFieldRow} scoreLabel={cardScoreLabel} />
                  {back.length > 0 && (
                    <Nine rows={back} label={t('courses:scorecard.in')} withField={showFieldRow} scoreLabel={cardScoreLabel} />
                  )}

                  {/*
                    BRIEF_ROUND_SCORECARD_REBUILD §B — THE GRAND TOTALS BLOCK IS
                    GONE. It printed the gross, the round par and the to-par a
                    second time, directly under a fixed header that shows all
                    three and never scrolls away. THE PER-NINE TOTALS SURVIVE:
                    each <Nine> still carries its own par and strokes total in
                    the right-hand column beside its OUT / IN label, which is the
                    figure a reader actually adds. Nothing else moved.
                  */}


                  <Legend holes={played} hasUnplayed={!allHolesPlayed} />
                </div>
              </Panel>

              {/*
                §C — AT THIS COURSE. ONE POOL: the member's own rounds at this
                venue. The kicker names the sample, so "BEST OF 1" — the most
                common case, since 274 member-course pairs hold exactly one
                round — reads as a fact about one round rather than a ranking
                against an invisible field. Renders only when a figure resolves,
                and never on the tour surface.
              */}
              {/* The kicker states the sample when we know it. With no round
                  count (INDEX THEN can resolve on its own) it falls back to the
                  bare title rather than claiming "your 0 rounds here". */}
              {courseSection.length > 0 && (
                <Panel
                  kicker={(courseContext?.roundsHere ?? 0) > 0
                    ? t('courses:scorecard.atThisCourse', { count: courseContext?.roundsHere as number })
                    : t('courses:scorecard.atThisCourseBare')}
                >
                  <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
                    {courseSection.map((it) => (
                      <div key={it.key} style={{ minWidth: 0 }}>
                        <div style={{ ...RAIL_FIG, color: it.tone ?? A.INK }}>{it.value}</div>
                        <div style={{ ...LABEL, fontSize: 9.5, letterSpacing: '0.12em', marginTop: 3 }}>{it.label}</div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {/* HOW IT BROKE DOWN — the birdie+ figure keeps its RED (S4.3). */}
              <Panel kicker={t('courses:scorecard.howItBrokeDown')}>
                <RoundSplit split={split} />
              </Panel>

              {/* HOW IT UNFOLDED — last, the most decorative and least
                  referenced element. Construction and monotonePath unchanged. */}
              <Panel kicker={t('courses:scorecard.howItUnfolded')}>
                <TrajectoryLine holes={holes} height={120} surface="dark" interactive />
              </Panel>
            </>
          )}

          {/* S3.3 — EXITS BELONG AT THE END. */}
          {(onViewProfile || onViewCourse || onShareRound) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', paddingTop: 2 }}>
              {onViewProfile && <Action label={t('courses:scorecard.viewProfile')} onClick={onViewProfile} align="left" />}
              {onViewCourse && <Action label={t('courses:scorecard.viewCourse')} onClick={onViewCourse} align="left" />}
              {onShareRound && <Action label={t('courses:scorecard.shareRound')} onClick={onShareRound} align="left" />}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default CardScorecardSheet;

