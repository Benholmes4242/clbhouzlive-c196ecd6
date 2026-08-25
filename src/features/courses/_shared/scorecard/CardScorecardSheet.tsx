import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Table } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { TrajectoryLine } from './TrajectoryLine';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
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
  toParParts, type StatItem,
} from '@/features/courses/components/holes/analytical/tokens';
import { LABEL as LABEL_METRICS, TITLE as TITLE_METRICS } from '@/lib/tokens/type';

/**
 * Canonical scale (src/lib/tokens/type.ts) is colourless by design; this sheet
 * keeps its own palette, so ink is re-attached here and nowhere else.
 */
const LABEL: React.CSSProperties = { ...LABEL_METRICS, color: A.MUTE };
const TITLE: React.CSSProperties = { ...TITLE_METRICS, color: A.INK };
/** Panel headings sit below the sheet title: same role, 13px as before. */
const SECTION_TITLE: React.CSSProperties = { ...TITLE, fontSize: 13 };

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
 * THE TWO SENTENCES are the best copy in the sheet and must read LIGHTER than
 * the figures they explain: BODY 12/600, never a figure weight.
 */
const SENTENCE: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: A.BODY, margin: 0,
};

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
  /** Tour: shows a position ("T4") in place of the handicap index. */
  identityStat?: { label: string; value: string } | null;
  // FOOTER
  onViewProfile?: () => void;
  onViewCourse?: () => void;
  /** C3 — shown only for the viewer's own round; opens the composer pre-filled. */
  onShareRound?: () => void;
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
const NINE_GRID = '54px repeat(9, minmax(0, 1fr)) 32px';

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
function nineSummary(rows: CardScorecardHole[]): { par: number; strokes: number } {
  return {
    par: rows.reduce((s, h) => s + (h.par ?? 0), 0),
    strokes: rows.reduce((s, h) => s + (h.strokes != null && h.strokes > 0 ? h.strokes : 0), 0),
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
  const { par, strokes } = nineSummary(rows);

  const fieldRel = withField
    ? rows.reduce(
        (s, h) => s + (h.fieldAvg != null && h.par != null ? h.fieldAvg - h.par : 0),
        0,
      )
    : null;

  return (
    <div>
      <CardRow label={t('courses:scorecard.hole')} cells={rows.map((h) => h.holeNo)} total={label} muted />
      <CardRow label={t('courses:scorecard.par')} cells={rows.map((h) => h.par ?? '\u2014')} total={par || '\u2014'} muted />
      <CardRow
        label={scoreLabel}
        cells={rows.map((h) => (
          <ScoreMark key={h.holeNo} strokes={h.strokes} par={h.par ?? 4} size={22} surface="dark" />
        ))}
        total={strokes || '\u2014'}
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

const Legend: React.FC<{ holes: CardScorecardHole[] }> = ({ holes }) => {
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

  const keys: { strokes: number; label: string }[] = [
    { strokes: 3, label: t('courses:scorecard.legendBirdie') },
  ];
  if (rarities.eagle) keys.push({ strokes: 2, label: t('courses:scorecard.legendEagle') });
  // AN ALBATROSS AND AN ACE TAKE THE SAME MARK (solid red, gold ring): the
  // grammar does not distinguish them. If a round contains both we show the
  // RARER one once (albatross) rather than two identical entries.
  if (rarities.alba) keys.push({ strokes: 1, label: t('courses:scorecard.legendAlbatross') });
  else if (rarities.ace) keys.push({ strokes: 1, label: t('courses:scorecard.legendAce') });
  keys.push({ strokes: 5, label: t('courses:scorecard.legendBogey') });
  keys.push({ strokes: 6, label: t('courses:scorecard.legendDouble') });

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
              <ScoreMark strokes={k.strokes} par={4} size={KEY_MARK_SIZE} surface="dark" showStroke={false} />
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
  onViewProfile, onViewCourse, onShareRound,
}) => {
  const { t } = useTranslation(['courses']);
  void emptyMessage;
  void coursePar;
  void courseSlope;
  void nineHole;

  const isTour = surface === 'tour';
  const { user } = useSupabaseSession();
  /**
   * VOICE — this sheet opens over other members' rounds from the Clubhouse feed
   * as often as over the viewer's own history, so running copy must not claim a
   * stranger's round as theirs. Derived, never passed: a caller that forgets the
   * prop would silently produce the wrong (and worse) reading. When ownership
   * cannot be resolved we fall to the third person.
   */
  const isOwner = !isTour && !!playerUserId && !!user?.id && playerUserId === user.id;
  const firstName = (playerName || '').trim().split(/\s+/)[0] ?? '';
  /**
   * NO NAME IS A STATE, NOT AN EMPTY STRING. An empty or whitespace-only
   * playerName must NEVER be poured into a possessive or a subject slot: the
   * result renders as a bare apostrophe ("'s average here") or as a leading
   * space followed by a lowercase verb (" beat the field average"). This sheet
   * has more than one caller and will acquire more, so it defends itself here
   * rather than trusting every caller to pass a name. With no name and no
   * ownership we use the IMPERSONAL forms, which read correctly with no subject.
   */
  const hasName = firstName.trim().length > 0;
  // A first name already ending in s takes a bare apostrophe: "James' average".
  const namePossessive = /s$/i.test(firstName) ? `${firstName}\u2019` : `${firstName}\u2019s`;
  /** Impersonal voice: no owner and no name to speak of. */
  const impersonal = !isOwner && !hasName;
  const subject = isOwner ? t('courses:scorecard.voiceYou') : firstName;
  const whose = isOwner ? t('courses:scorecard.voiceYour') : namePossessive;
  const whoseCap = isOwner ? t('courses:scorecard.voiceYourCap') : namePossessive;

  const [showCard, setShowCard] = useState(false);
  useEffect(() => { if (!open) setShowCard(false); }, [open]);

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

  // scorecard_opened — has_field_data is the evidence for whether the
  // enrichment is reaching members at all.
  useEffect(() => {
    if (!open) return;
    analyticsEvents.track('scorecard_opened', {
      surface,
      holes: played.length,
      has_field_data: withField,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const statItems: StatItem[] = useMemo(() => {
    const items: StatItem[] = [];
    if (totals.played) {
      items.push({
        label: isTour ? t('courses:scorecard.round') : t('courses:scorecard.gross'),
        value: totals.gross,
      });
      items.push({
        label: t('courses:scorecard.toPar'),
        value: fmtRel(totals.toPar),
        tone: heroMuted ? EVEN_GRAY : toParColor(totals.toPar),
      });
    }
    if (isTour) {
      if (fieldRoundTotal != null) {
        items.push({
          label: t('courses:scorecard.fieldAvg'),
          value: (Math.round(fieldRoundTotal * 10) / 10).toFixed(1),
          sub: t('courses:scorecard.throughN', { n: fieldHoles.length }),
        });
      }
    } else if (courseContext?.yourAvgToPar != null) {
      const avgHere = courseContext.yourAvgToPar;
      const parts = toParParts(avgHere);
      if (parts) {
        items.push({
          label: isOwner
            ? t('courses:scorecard.yourAvgHere')
            : impersonal
              // No name: a neutral label, never a bare possessive.
              ? t('courses:scorecard.avgHereNeutral')
              : t('courses:scorecard.avgHereOther', { whose: whoseCap }),
          value: parts.text,
          // The member's own scoring average is a PLAYER SCORE, so it takes the
          // to-par rule. The label already says "Your"; amber is not needed to
          // carry the possessive. Amber means the viewing member, so it belongs
          // only on the member's own card.
          tone: isOwner ? A.AMBER_DEEP : toParColor(avgHere),
          sub: courseContext.roundsHere != null
            ? t('courses:scorecard.roundsHere', { count: courseContext.roundsHere })
            : undefined,
        });
      }
    }
    return items;
  }, [totals, isTour, heroMuted, fieldRoundTotal, fieldHoles.length, courseContext, isOwner, impersonal, whoseCap, t]);

  const captions = useMemo(() => {
    const out: string[] = [];
    if (!isTour && courseContext) {
      /*
       * THE CAPTION COMPARES AGAINST THE OTHER ROUNDS, NOT AN AVERAGE THAT
       * CONTAINS THIS ROUND. The hero cell keeps the inclusive average — it is
       * labelled "their average here" and that is what it is. The two figures
       * differ on one card and that is intended.
       *
       * Gated on avg_to_par_others being non-null, not on roundsHere > 1: the
       * null is the honest signal and cannot drift.
       */
      const avgOthers = courseContext.avgToParOthers;
      const roundsHere = courseContext.roundsHere ?? 0;
      const othersCount = Math.max(roundsHere - 1, 1);
      if (avgOthers != null && totals.played) {
        const diff = totals.toPar - avgOthers;
        const d = Math.abs(Math.round(diff * 10) / 10);
        // Impersonal variants carry no subject at all, so a missing name can
        // never produce a line that opens with an apostrophe.
        if (d < 0.5) {
          out.push(impersonal
            ? t('courses:scorecard.vsOthersLevelNeutral', { count: othersCount })
            : t('courses:scorecard.vsOthersLevel', { whose, count: othersCount }));
        } else if (diff < 0) {
          out.push(impersonal
            ? t('courses:scorecard.vsOthersBetterNeutral', { n: d.toFixed(1), count: othersCount })
            : t('courses:scorecard.vsOthersBetter', { n: d.toFixed(1), whose, count: othersCount }));
        } else {
          out.push(impersonal
            ? t('courses:scorecard.vsOthersWorseNeutral', { n: d.toFixed(1), count: othersCount })
            : t('courses:scorecard.vsOthersWorse', { n: d.toFixed(1), whose, count: othersCount }));
        }
      }
      if (courseContext.rankHere != null && roundsHere > 0) {
        /*
         * RANK 1 TAKES NO ORDINAL (BRIEF_SCORECARD_TRAJECTORY_WHOOP §9.3):
         * formatOrdinal(1) returns "1st", so the caption read "1st best of 2
         * rounds here". THE RANK ITSELF IS CORRECT - a round belongs in its own
         * ranking - only the wording changes.
         */
        const best = courseContext.rankHere === 1;
        out.push(impersonal
          ? best
            ? t('courses:scorecard.rankHereNeutralBest', { count: roundsHere })
            : t('courses:scorecard.rankHereNeutral', {
                ordinal: formatOrdinal(courseContext.rankHere),
                count: roundsHere,
              })
          : best
            ? t('courses:scorecard.rankHereVoiceBest', { whose: whoseCap, count: roundsHere })
            : t('courses:scorecard.rankHereVoice', {
                whose: whoseCap,
                ordinal: formatOrdinal(courseContext.rankHere),
                count: roundsHere,
              }));
      }
    }
    return out;
  }, [isTour, courseContext, totals, whose, whoseCap, impersonal, t]);

  /**
   * The caption must state what it measures. Two faults it must not repeat:
   *
   *  - The comparison at :485 is `strokes <= fieldAvg`, so a hole MATCHED is
   *    counted. The words are "matched or beat", never "beat".
   *  - The denominator is fieldHoles.length: holes with BOTH the member's
   *    strokes and a field average. When the community lacks data on a hole
   *    that number falls, which has nothing to do with the round's progress -
   *    so no form of this caption says "so far". When some scored holes have
   *    no field average we name the sample instead ("holes with field data").
   *
   * The test is fieldHoles.length against played.length, the holes the member
   * actually scored - NOT 18. A nine-hole round has played.length 9 and is
   * never described as missing field data for the back nine.
   *
   * With no subject to name, use the subject-less form (capital M, no leading
   * space) rather than interpolating an empty string into "{{who}} matched ...".
   */
  const fieldPartial = fieldHoles.length < played.length;
  const fieldCaption = withField && beatFieldOn != null
    ? t(
        (isTour || impersonal)
          ? (fieldPartial ? 'courses:scorecard.beatFieldOnTourPartial' : 'courses:scorecard.beatFieldOnTour')
          : (fieldPartial ? 'courses:scorecard.beatFieldVoicePartial' : 'courses:scorecard.beatFieldVoice'),
        {
          who: subject,
          beat: beatFieldOn,
          scored: fieldHoles.length,
        },
      )
    : null;



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
  const cardScoreLabel = isOwner ? t('courses:scorecard.you') : '';


  const showChip = playerHcpDelta != null && Math.abs(playerHcpDelta) >= 0.05;
  const showIdentity = !!playerName;
  const hasHoles = holes.length > 0;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="dark"
      surfaceColor={A.CANVAS}
      style={{ background: A.CANVAS, height: 'auto', maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: SANS, background: A.CANVAS, flex: 1, minHeight: 0, ...FIGS }}>
        {/*
          HEADER — DATE / COURSE / REGION / MEMBER / ACTIONS
          (BRIEF_SCORECARD_SHEET_HEADER, option B with ACTIONS UP).

          The identity and the two actions used to sit at the BOTTOM of the
          sheet, below the trajectory, the grid, the key and the breakdown — so a
          member scrolled a whole scorecard to learn whose round it was. They are
          header rows now. This also serves :722: the card's score-column label
          is blank in the third person because the reader is told the name
          ABOVE the card, which only works if the name is above it.

          THE COURSE KEEPS THE FULL WIDTH ON ITS OWN LINE. That is why B was
          chosen over the split layout: nothing sits beside the course name and
          nothing competes with it for horizontal space, so the parenthetical
          that separates East from West survives.

          NO TILE. The identity was a Panel because it was a standalone block at
          the end of a scroll; in the header it is part of the header — no panel,
          no border, no separate ground, one hairline above it.
        */}
        <div style={{ padding: '10px 16px 12px', background: A.CANVAS, borderBottom: `1px solid ${A.BORDER}`, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            {!!eyebrowText && (
               <div style={{ ...KICKER, color: A.MUTE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {eyebrowText}
              </div>
            )}
            <div
              style={{
                ...TITLE, marginTop: 3, lineHeight: 1.22,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {courseName}
            </div>
            {courseLocation && (
              <div style={{ fontSize: 12.5, color: A.MUTE, marginTop: 2 }}>{courseLocation}</div>
            )}
          </div>

          {(showIdentity || onShareRound || onViewProfile || onViewCourse) && (
            <Hairline style={{ margin: '10px 0 0' }} />
          )}

          {/* MEMBER ROW. With NO NAME this does not render at all — no avatar,
              no placeholder, no avatar-shaped hole — and the actions row falls
              directly under the region, still beneath its hairline. */}
          {showIdentity && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <SquircleAvatar
                src={playerAvatarUrl ?? null}
                alt={playerName}
                userId={playerUserId ?? undefined}
                size={34}
                hairlineRing
              />
              {/* The name is the ONLY elastic cell: minWidth 0 + ellipsis, so a
                  long display name yields to the figure rather than pushing it
                  off. The figure column is auto and never shrinks. */}
              <div
                style={{
                  flex: '1 1 auto', minWidth: 0,
                  fontSize: 13.5, fontWeight: 700,
                  color: isOwner ? A.AMBER : A.INK,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
                title={isOwner ? undefined : playerName}
              >
                {/* OWN ROUND (§3, option b): the app's viewing-member marker,
                    amber "You", with the avatar kept. The row's shape is
                    identical in both cases. */}
                {isOwner ? t('courses:scorecard.voiceYou') : playerName}
              </div>
              {(identityStat || playerHcp != null) && (
                <div style={{ flex: 'none', textAlign: 'right' }}>
                  <div style={{ ...NUM, fontSize: 20, color: A.INK, lineHeight: 1.05 }}>
                    {identityStat ? identityStat.value : formatHcp(playerHcp as number)}
                  </div>
                  <div style={{ ...LABEL, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    <span>{identityStat ? identityStat.label : t('courses:scorecard.handicapIndex')}</span>
                    {!identityStat && showChip && <HandicapChip delta={playerHcpDelta as number} />}
                  </div>
                </div>
              )}
            </div>
          )}

          {(onShareRound || onViewProfile || onViewCourse) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: showIdentity ? 4 : 8 }}>
              {onViewProfile && <Action label={t('courses:scorecard.viewProfile')} onClick={onViewProfile} align="left" />}
              {onViewCourse && <Action label={t('courses:scorecard.viewCourse')} onClick={onViewCourse} align="left" />}
              {onShareRound && <Action label={t('courses:scorecard.shareRound')} onClick={onShareRound} align="left" />}
            </div>
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
                    style={{
                      padding: '6px 13px', borderRadius: 999,
                      background: active ? A.INK : A.PANEL,
                      color: active ? A.PANEL : A.INK,
                      border: `1px solid ${active ? A.INK : A.BORDER}`,
                      fontFamily: SANS, fontSize: 11.5, fontWeight: 700,
                      letterSpacing: '0.04em', cursor: 'pointer', whiteSpace: 'nowrap',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    R{r}
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
              {/* PANEL 1 — the round */}
              <Panel>
                {statItems.length > 0 && <StatRow items={statItems} size={24} style={{ marginBottom: 20 }} />}

                <Hairline style={{ margin: '18px 0 14px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 12 }}>
                  <span style={{ ...SECTION_TITLE, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t('courses:scorecard.howItUnfolded')}
                  </span>
                  {/*
                    The heading row's action slot. This is a TOGGLE - it expands
                    the card in place - so the copy never promises a destination.
                  */}
                  <Action
                    align="left"
                    style={{ flexShrink: 0, minHeight: 0 }}
                    tone={A.AMBER}
                    label={showCard
                      ? t('courses:scorecard.hideHoleByHole')
                      : t('courses:scorecard.holeByHole')}
                    onClick={() => {
                      setShowCard((v) => {
                        if (!v) {
                          analyticsEvents.track('scorecard_card_expanded', {
                            surface,
                            holes: holes.length,
                          });
                        }
                        return !v;
                      });
                    }}
                  />
                </div>

                {/*
                  THE PLOT SITS IN THE TEXT COLUMN (BRIEF_SCORECARD_CHART_ALIGNMENT
                  §1). This SUPERSEDES the full-bleed decision of
                  BRIEF_SCORECARD_TRAJECTORY_WHOOP §3: the chart no longer breaks
                  out of the Panel's 16px padding, so its left edge lands under the
                  "H" of "How it unfolded" and its right edge under the chevron of
                  "Full scorecard ›". One column, one x-scale — which is also what
                  fixed the uneven tick spacing (§3): the tick row was remapping x
                  against a plot 32px wider than itself.

                  The chart legend row that used to sit here is GONE (§8): the
                  field key had nothing left to point at once the field line was
                  removed, and a single-colour swatch cannot represent a stroke
                  graded per hole.
                */}
                <TrajectoryLine holes={holes} height={120} surface="dark" interactive />


                {(captions.length > 0 || fieldCaption) && (
                  <>
                    <Hairline style={{ margin: '14px 0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {captions.length > 0 && <p style={SENTENCE}>{captions.join(' ')}</p>}
                      {fieldCaption && <p style={SENTENCE}>{fieldCaption}</p>}
                    </div>
                  </>
                )}




                {showCard && (
                  <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Nine rows={out} label={t('courses:scorecard.out')} withField={showFieldRow} scoreLabel={cardScoreLabel} />
                    {back.length > 0 && (
                      <Nine rows={back} label={t('courses:scorecard.in')} withField={showFieldRow} scoreLabel={cardScoreLabel} />
                    )}

                    <Legend holes={played} />

                    {/*
                      TOTALS BLOCK - a member of the HOLE / PAR / YOU family, not
                      a summary line floating beneath it. Two rows on the same
                      NINE_GRID: row 1 carries TOTAL, the OUT and IN segments and
                      the gross in the totals column, directly under the nine
                      totals above; row 2 carries PAR n as a caps label and the
                      to-par beneath the gross. Every figure lines up down the
                      right edge. On a nine-hole card the OUT segment spans the
                      full nine columns and no IN segment renders.
                    */}
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: NINE_GRID, alignItems: 'center', gap: 2, padding: '3px 0' }}>
                        <span style={{ ...LABEL_READ, color: A.INK }}>{t('courses:scorecard.total')}</span>
                        <span
                          style={{
                            gridColumn: backSummary ? 'span 4' : 'span 9',
                            ...LABEL_READ, color: A.MUTE, textAlign: 'center', whiteSpace: 'nowrap',
                          }}
                        >
                          {t('courses:scorecard.outN', { n: outSummary.strokes })}
                        </span>
                        {backSummary && (
                          <span
                            style={{
                              gridColumn: 'span 5',
                              ...LABEL_READ, color: A.MUTE, textAlign: 'center', whiteSpace: 'nowrap',
                            }}
                          >
                            {t('courses:scorecard.inN', { n: backSummary.strokes })}
                          </span>
                        )}
                        <span style={{ ...NUM, fontSize: 16, color: A.INK, textAlign: 'center' }}>{cardGross}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: NINE_GRID, alignItems: 'center', gap: 2, padding: '3px 0' }}>
                        <span style={{ ...LABEL_READ, color: A.MUTE, whiteSpace: 'nowrap' }}>
                          {t('courses:scorecard.parN', { n: cardTotalPar })}
                        </span>
                        <span style={{ gridColumn: 'span 9' }} />
                        <span style={{ ...NUM, fontSize: 13, color: toParColor(totals.toPar), textAlign: 'center' }}>
                          {fmtRel(totals.toPar)}
                        </span>
                      </div>
                    </div>


                  </div>
                )}
              </Panel>

              {/* PANEL 2 — how the round broke down */}
              <Panel title={t('courses:scorecard.howItBrokeDown')}>
                <RoundSplit split={split} />
              </Panel>
            </>
          )}

          {/*
            NOTHING FOLLOWS THE BREAKDOWN (BRIEF_SCORECARD_SHEET_HEADER §4).
            The identity panel and the anonymous-round footer that used to sit
            here are BOTH gone: the member row and both actions live in the
            header, and the anonymous path is served there too (member row
            omitted, actions row still rendered). Do not add a footer back.
          */}


        </div>
      </div>
    </BottomSheet>
  );
};

export default CardScorecardSheet;
