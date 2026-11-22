import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
/**
 * BRIEF_ROUND_SHEET_PEEK §1 — THE SCORECARD'S SHARED PARTS.
 *
 * These pieces were inline in CardScorecardSheet. They are extracted VERBATIM
 * here so the neighbour preview drawn during a horizontal swipe can be the SAME
 * summary and the SAME nines the sheet itself draws, rather than a look-alike
 * that drifts one tone or one pixel at a time.
 *
 * NOTHING HERE FETCHES. No query hook, no store, no reaction, no comment count:
 * every figure arrives as a prop, which is what makes the preview free to mount
 * and unmount inside a drag.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, RefreshCw, Table } from 'lucide-react';
import { ScoreFigureRow } from '@/components/shared/ScoreFigureRow';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { TREND_UP, TREND_DOWN, TOPAR_EVEN_DARK } from '@/features/tourhub/_shared/tokens';
import {
  A, SANS, NUM, KICKER, Panel, StatRow,
} from '@/features/courses/components/holes/analytical/tokens';
import { LABEL as LABEL_METRICS, TITLE as TITLE_METRICS } from '@/lib/tokens/type';

export const LABEL: React.CSSProperties = { ...LABEL_METRICS, color: A.MUTE };
export const TITLE: React.CSSProperties = { ...TITLE_METRICS, color: A.INK };
export const LABEL_AXIS: React.CSSProperties = { ...LABEL, fontSize: 10 };
export const LABEL_READ: React.CSSProperties = { ...LABEL, fontSize: 11 };
export const CAPTION: React.CSSProperties = {
  fontSize: 12.5, lineHeight: 1.5, color: A.MUTE, margin: 0,
};
export const RAIL_FIG: React.CSSProperties = { ...NUM, fontSize: 15, lineHeight: 1.05 };
export const STAT_RAIL_ITEM_GAP = 20;

/** A player's score against par — one source of truth with the tour surfaces. */
export const EVEN_GRAY = TOPAR_EVEN_DARK;

/** Integer to-par: rounds first, then branches. Never `-0`. */
export function fmtRel(n: number | null): string {
  if (n == null) return '\u2014';
  const r = Math.round(n);
  return r === 0 ? 'E' : r < 0 ? `\u2212${Math.abs(r)}` : `+${r}`;
}

export function toParColor(n: number | null): string {
  if (n == null || Math.round(n) === 0) return EVEN_GRAY;
  return getScoreColor(Math.round(n), 'dark');
}

export interface ScorecardHoleRow {
  holeNo: number;
  par: number | null;
  strokes: number | null;
  fieldAvg?: number | null;
}

export const ScorecardSection: React.FC<{
  kicker: string;
  flat: boolean;
  children: React.ReactNode;
}> = ({ kicker, flat, children }) => {
  if (!flat) return <Panel kicker={kicker}>{children}</Panel>;
  return (
    <section style={{ padding: '8px 2px 12px' }}>
      <div style={{ ...KICKER, color: A.MUTE, marginBottom: 14 }}>{kicker}</div>
      {children}
    </section>
  );
};

/* --------------------------------------------------------------- the card */

const NINE_GRID = 'repeat(9, minmax(0, 1fr)) 32px';
const PAR_QUIET = 'rgba(248,250,252,0.42)';

export const CardRow: React.FC<{
  cells: React.ReactNode[];
  total: React.ReactNode;
  muted?: boolean;
  tone?: string;
  emphasis?: 'par' | 'strokes';
}> = ({ cells, total, muted, tone, emphasis }) => (
  <div
    style={{
      display: 'grid', gridTemplateColumns: NINE_GRID, alignItems: 'center', gap: 2,
      padding: '3px 0', minWidth: 0, overflow: 'hidden',
    }}
  >
    {cells.map((c, i) => (
      <span key={i} style={{ textAlign: 'center', minWidth: 0, overflow: 'hidden' }}>
        {typeof c === 'object' ? c : (
          <span style={{
            ...NUM,
            fontSize: emphasis === 'par' ? 11 : 12,
            fontWeight: emphasis === 'par' ? 500 : (muted ? 500 : 700),
            color: emphasis === 'par' ? PAR_QUIET : (tone ?? (muted ? A.MUTE : A.INK)),
          }}>
            {c}
          </span>
        )}
      </span>
    ))}
    <span style={{
      ...NUM,
      fontSize: emphasis === 'par' ? 11 : emphasis === 'strokes' ? 15 : 13,
      fontWeight: emphasis === 'strokes' ? 700 : undefined,
      color: emphasis === 'par' ? PAR_QUIET : A.INK,
      textAlign: 'center', minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap',
    }}>
      {total}
    </span>
  </div>
);

/** ONE SOURCE FOR THE NINE FIGURES (a partial nine is not a nine). */
export function nineSummary(rows: ScorecardHoleRow[]): {
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

/**
 * BRIEF_ROUND_SHEET_CUES §4 — THE MARK SIZE THE COLUMN CAN AFFORD.
 *
 * MEASURED IN A BROWSER, not calculated. The row sits inside the sheet body's
 * 14px padding and the section's 2px, and nine minmax(0,1fr) columns share what
 * is left after the 32px total column and ten 2px gaps:
 *
 *   viewport 320 -> row 288.0px, column 26.44px
 *   viewport 360 -> row 328.0px, column 30.88px
 *   viewport 390 -> row 358.0px, column 34.22px
 *
 * A 26px mark therefore CLEARS 320 (26.44 - 26 = 0.44px spare, no overflow of the
 * row's scrollWidth), so the brief's 24px fallback below 360 is not needed and
 * one size is drawn at every width. Reported.
 */
const MARK_SIZE = 26;
const MARK_NUMERAL = 14;

export const Nine: React.FC<{
  rows: ScorecardHoleRow[];
  label: string;
}> = ({ rows, label }) => {
  const { par, strokes, playedCount, parPlayed } = nineSummary(rows);
  const started = playedCount > 0;
  const partial = started && playedCount < rows.length;
  const parTotal = !started ? '' : partial ? parPlayed : (par || '\u2014');
  const strokesTotal = started ? strokes : '';

  return (
    <div>
      <CardRow cells={rows.map((h) => h.holeNo)} total={label} muted />
      <CardRow cells={rows.map((h) => h.par ?? '\u2014')} total={parTotal} muted emphasis="par" />
      <CardRow
        cells={rows.map((h) => (
          /* §4 — THE STROKES ROW IS THE LOUD ROW. A 14px numeral inside a 26px
             mark, and a plain par numeral in INK rather than the
             muted par ink. The shapes and colours are the shipped grammar,
             unchanged, at the larger size. */
          <ScoreMark
            key={h.holeNo}
            strokes={h.strokes}
            par={h.par ?? 4}
            size={MARK_SIZE}
            numeralSize={MARK_NUMERAL}
            parNumeralColor={A.INK}
            surface="dark"
            glassDoubleRings
          />
        ))}
        total={strokesTotal}
        emphasis="strokes"
      />
    </div>
  );
};

/**
 * FOLLOW-UP A of BRIEF_ROUND_SHEET — the one mark that is not standard notation.
 * Drawn from the same hole rows the card draws, so the line and the grid cannot
 * disagree, and shown ONLY while a hole is unplayed.
 */
export const NotPlayedLine: React.FC = () => {
  const { t } = useTranslation(['courses']);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, lineHeight: 1 }}>
      <ScoreMark strokes={null} par={4} size={18} surface="dark" showStroke />
      <span style={LABEL_READ}>{t('courses:scorecard.legendNotPlayed')}</span>
    </div>
  );
};

/* -------------------------------------------- loading and empty middles */

export const KEYFRAMES = `
@keyframes cardsheetPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes cardsheetSpin { to { transform: rotate(360deg); } }
`;

export const SkeletonMiddle: React.FC = () => (
  <div
    aria-hidden
    data-scorecard-skeleton="true"
    style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 394 }}
  >
    <style>{KEYFRAMES}</style>
    {[214, 168].map((h, i) => (
      <div
        key={i}
        style={{
          height: h, borderRadius: 16, background: A.PANEL,
          border: `1px solid ${A.BORDER}`, padding: 16,
        }}
      >
        <div
          style={{
            height: '100%', borderRadius: 10, background: A.TRACK,
            animation: `cardsheetPulse 1.4s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      </div>
    ))}
  </div>
);

export const SyncingMiddle: React.FC = () => {
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

export const UnavailableMiddle: React.FC = () => {
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

export const NohbhMiddle: React.FC<{ gross: number | null; toPar: number | null }> = ({ gross, toPar }) => {
  const { t } = useTranslation(['courses']);
  const items = [
    { label: t('courses:scorecard.gross'), value: gross },
    ...(toPar == null
      ? []
      : [{ label: t('courses:scorecard.toPar'), value: fmtRel(toPar), tone: toParColor(toPar) }]),
  ];
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
          items={items}
        />
      )}
    </Panel>
  );
};

export const HandicapChip: React.FC<{ delta: number }> = ({ delta }) => {
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

/* ------------------------------------------------------- the fixed summary */

export interface RailFigure {
  key: string;
  value: string;
  label: string;
  tone?: string;
}

/* ------------------------------------------- SCORECARD_TILE_REDESIGN parts */

/** The tile's quiet tones (signed-off scorecard-tile mock). */
export const TILE_DIM = 'rgba(248,250,252,0.42)';
export const TILE_MUTE = 'rgba(248,250,252,0.62)';
export const TILE_BODY = 'rgba(248,250,252,0.82)';
export const TILE_INK = '#F8FAFC';

/** Section / header kicker: 9.5px / 700, .16em, uppercase, dim. */
export const TILE_KICKER: React.CSSProperties = {
  fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: TILE_DIM, lineHeight: 1.2,
};

/** One body section: kicker then content; sections sit 26px apart (host gap). */
export const TileSection: React.FC<{ kicker: string; children: React.ReactNode; testId?: string; sectionRef?: React.Ref<HTMLElement> }> = ({ kicker, children, testId, sectionRef }) => (
  <section ref={sectionRef} data-scorecard-tile-section={testId} style={{ minWidth: 0 }}>
    <h3 style={{ ...TILE_KICKER, margin: 0 }}>{kicker}</h3>
    {children}
  </section>
);

/** The TOP 100 stamp — the review tile's, by construction (one component). */
export const Top100Stamp: React.FC<{ attr?: string }> = ({ attr = 'data-scorecard-top100' }) => (
  <span {...{ [attr]: 'true' }} style={{ flex: 'none', height: 18, padding: '0 7px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.28)', display: 'inline-flex', alignItems: 'center', boxSizing: 'border-box', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', color: TILE_INK }}>
    TOP 100
  </span>
);

const TILE_NINE_GRID = 'repeat(9, minmax(0, 1fr)) 36px';

/**
 * One glass nine: hole numbers, par, strokes (ScoreMark at 24px — the canon
 * notation and colours), and a right-aligned OUT/IN total column. The partial
 * nine rules are nineSummary's, unchanged from <Nine>.
 */
export const TileNine: React.FC<{ rows: ScorecardHoleRow[]; label: string }> = ({ rows, label }) => {
  const { par, strokes, playedCount, parPlayed } = nineSummary(rows);
  const started = playedCount > 0;
  const partial = started && playedCount < rows.length;
  const parTotal = !started ? '' : partial ? parPlayed : (par || '\u2014');
  const strokesTotal = started ? strokes : '';
  const cell: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, whiteSpace: 'nowrap', lineHeight: 1.2, ...NUM };
  const tot: React.CSSProperties = { ...cell, justifyContent: 'flex-end' };
  return (
    <div
      data-scorecard-nine={label}
      style={{
        display: 'grid', gridTemplateColumns: TILE_NINE_GRID, columnGap: 2, rowGap: 5,
        padding: '10px 8px 10px 4px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', minWidth: 0,
      }}
    >
      {rows.map((h) => <span key={`n${h.holeNo}`} data-nine-cell="hole" style={{ ...cell, fontSize: 10, fontWeight: 600, color: TILE_DIM }}>{h.holeNo}</span>)}
      <span data-nine-total="label" style={{ ...tot, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: TILE_MUTE, textTransform: 'uppercase' }}>{label}</span>
      {rows.map((h) => <span key={`p${h.holeNo}`} data-nine-cell="par" style={{ ...cell, fontSize: 11, fontWeight: 600, color: TILE_DIM }}>{h.par ?? '\u2014'}</span>)}
      <span data-nine-total="par" style={{ ...tot, fontSize: 11, fontWeight: 700, color: TILE_MUTE }}>{parTotal}</span>
      {rows.map((h) => (
        <span key={`s${h.holeNo}`} data-nine-cell="strokes" style={{ ...cell, height: 26, fontSize: 13.5, fontWeight: 700, color: TILE_INK }}>
          <ScoreMark strokes={h.strokes} par={h.par ?? 4} size={24} numeralSize={13.5} parNumeralColor={TILE_INK} surface="dark" glassDoubleRings />
        </span>
      ))}
      <span data-nine-total="strokes" style={{ ...tot, height: 26, fontSize: 14, fontWeight: 700, color: TILE_INK }}>{strokesTotal}</span>
    </div>
  );
};

const TILE_KEY_ITEMS = [
  { key: 'under', strokes: 3 },
  { key: 'bogey', strokes: 5 },
  { key: 'double', strokes: 6 },
  { key: 'triple', strokes: 7 },
] as const;

/** The key under the nines: the card's own ScoreMark at 11px, wrapping at 320. */
export const TileKey: React.FC = () => {
  const { t } = useTranslation(['courses']);
  return (
    <div data-scorecard-key="true" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 10, fontSize: 11, color: TILE_DIM, lineHeight: 1.2 }}>
      {TILE_KEY_ITEMS.map((it) => (
        <span key={it.key} data-scorecard-key-item={it.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ScoreMark strokes={it.strokes} par={4} size={11} showStroke={false} surface="dark" glassDoubleRings />
          {t(`courses:scorecard.key.${it.key}`)}
        </span>
      ))}
    </div>
  );
};

export interface RoundSummaryHeadProps {
  isTour?: boolean;
  /** Tour sub-line: the existing date/eyebrow text. */
  kickerText?: string;
  /** Member sub-line fallback when no play date is known (long date). */
  memberDateText?: string;
  /** Member: the round's play date, for "Played {relative day}". */
  playDate?: string | null;
  /** Member: rounds at this course; null drops the "· N rounds here" part. */
  roundsHere?: number | null;
  courseName: string;
  courseLocation?: string | null;
  /** The TOP 100 stamp node (or null) after the place. */
  top100Slot?: React.ReactNode;
  showScore: boolean;
  gross: number | null;
  toPar: number | null;
  heroMuted?: boolean;
  playerName?: string | null;
  playerAvatarUrl?: string | null;
  playerUserId?: string | null;
  tourAvatarCandidates?: string[];
  isOwner?: boolean;
  /** Cells after TO PAR, in order, only those with data. */
  cells?: RailFigure[];
  /** Hold every cell after the hairline while the net read is pending. */
  cellsHeld?: boolean;
  /** The comparison line (member only); null draws nothing. */
  comparison?: React.ReactNode;
  onViewCourse?: () => void;
  onViewProfile?: () => void;
  /** Swipe preview: draw the same row, inert. */
  previewDoors?: boolean;
  /* Retained for caller compatibility; the tile head prints no par suffix,
     no handicap pair and no stat rail (SCORECARD_TILE_REDESIGN §1). */
  shownPar?: number | null;
  playedHoles?: number;
  coursePar?: number | null;
  playerHcp?: number | null;
  playerHcpDelta?: number | null;
  playedOffIndex?: number | null;
  rail?: RailFigure[];
}

function playedWhen(iso: string | null | undefined, t: (k: string, o?: Record<string, unknown>) => string): string {
  if (!iso) return '';
  const day = iso.slice(0, 10);
  const then = new Date(`${day}T12:00:00`).getTime();
  if (!Number.isFinite(then)) return '';
  const days = Math.max(0, Math.round((Date.now() - then) / 86_400_000));
  if (days === 0) return t('courses:discover.when.today');
  if (days === 1) return t('courses:discover.when.yesterday');
  if (days < 7) return t('courses:discover.when.fullDaysAgo', { count: days });
  if (days < 70) return t('courses:discover.when.fullWeeksAgo', { count: Math.max(1, Math.round(days / 7)) });
  if (days < 365) return t('courses:discover.when.fullMonthsAgo', { count: Math.max(1, Math.round(days / 30.44)) });
  return t('courses:discover.when.fullYearsAgo', { count: Math.max(1, Math.round(days / 365.25)) });
}

/**
 * S1 — THE FIXED SUMMARY, rebuilt to the signed-off scorecard tile: kicker
 * (place + TOP 100), two-line course name (taps to the course), the player row
 * (taps to the profile, chevron right), the GROSS figure row and the member
 * comparison line. One component for the sheet and the swipe preview.
 */
export const RoundSummaryHead: React.FC<RoundSummaryHeadProps> = ({
  isTour = false, kickerText, memberDateText, playDate = null, roundsHere = null,
  courseName, courseLocation, top100Slot = null,
  showScore, gross, toPar, heroMuted, shownPar = 0, playedHoles = 0, coursePar = null,
  playerName, playerAvatarUrl, playerUserId, tourAvatarCandidates = [], isOwner = false,
  cells = [], cellsHeld = false, comparison = null,
  onViewCourse, onViewProfile, previewDoors = false,
}) => {
  const { t } = useTranslation(['courses']);
  const when = playedWhen(playDate, t as never);
  const memberSub = [
    when ? t('courses:scorecard.tile.played', { when: when.charAt(0).toLowerCase() + when.slice(1) }) : (memberDateText || ''),
    roundsHere != null ? t('courses:scorecard.tile.roundsHere', { count: roundsHere }) : '',
  ].filter(Boolean).join(' \u00B7 ');
  const sub = isTour ? (kickerText ?? '') : memberSub;
  /* Ruling: the head-par rule, unchanged, now labels the gross figure. */
  const parShown = shownPar != null && shownPar > 0 ? shownPar : coursePar;
  const grossLabel = parShown != null
    ? t('courses:scorecard.parN', { n: parShown })
    : playedHoles > 0 ? t('courses:scorecard.thruN', { n: playedHoles }) : t('courses:scorecard.gross');
  const toParTone = heroMuted ? EVEN_GRAY : toParColor(toPar);
  const scoreCells: { key: string; value: string; label: string; color?: string }[] = [
    ...(toPar != null ? [{ key: 'toPar', value: fmtRel(toPar), label: t('courses:scorecard.toPar'), color: toParTone }] : []),
    ...cells.map((c) => ({ key: c.key, value: c.value, label: c.label, color: c.tone })),
  ];
  const courseTap = previewDoors ? undefined : onViewCourse;
  const profileTap = previewDoors ? undefined : onViewProfile;
  return (
    <div data-scorecard-head="true" style={{ flex: 'none', padding: '20px 20px 0', minWidth: 0 }}>
      {(courseLocation || top100Slot) && (
        <div data-scorecard-kicker="true" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {courseLocation && (
            <span style={{ ...TILE_KICKER, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{courseLocation}</span>
          )}
          {top100Slot}
        </div>
      )}
      <h2 style={{ margin: 0, marginTop: 7, minWidth: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, color: TILE_INK }}>
        {courseTap ? (
          <button
            type="button"
            data-scorecard-course-name="true"
            onClick={(e) => { e.stopPropagation(); courseTap(); }}
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', width: '100%', padding: 0, margin: 0, border: 0, background: 'none', color: 'inherit', font: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit', textAlign: 'left', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
          >
            {courseName}
          </button>
        ) : (
          <span data-scorecard-course-name="true" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{courseName}</span>
        )}
      </h2>
      {!!playerName && (() => {
        const inner = (
          <>
            <span style={{ flex: 'none', display: 'flex' }}>
              {isTour ? (
                <SquircleAvatar srcCandidates={tourAvatarCandidates} alt={playerName} userId={playerUserId ?? undefined} size={36} hairlineRing />
              ) : (
                <SquircleAvatar src={playerAvatarUrl ?? null} alt={playerName} userId={playerUserId ?? undefined} size={36} hairlineRing />
              )}
            </span>
            <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <span data-sheet-player-name="true" style={{ display: 'block', fontSize: 15, fontWeight: 600, color: isOwner ? A.AMBER : TILE_INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <InlineProMemberName userId={isTour ? undefined : playerUserId}>{playerName}</InlineProMemberName>
              </span>
              {sub && <span data-scorecard-player-sub="true" style={{ display: 'block', fontSize: 12, lineHeight: 1.35, color: TILE_DIM, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>}
            </span>
            <ChevronRight data-scorecard-player-chevron="true" size={16} strokeWidth={2.2} color={TILE_DIM} aria-hidden style={{ flex: 'none' }} />
          </>
        );
        const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 11, marginTop: 14, minHeight: 44, minWidth: 0, width: '100%' };
        return profileTap ? (
          <button
            type="button"
            data-scorecard-player-row="true"
            onClick={(e) => { e.stopPropagation(); profileTap(); }}
            style={{ ...rowStyle, padding: 0, border: 0, background: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
          >
            {inner}
          </button>
        ) : (
          <div data-scorecard-player-row="true" style={rowStyle}>{inner}</div>
        );
      })()}
      {showScore && gross != null && (
        <ScoreFigureRow
          name="round-score"
          lead={{ key: 'gross', value: String(gross), label: grossLabel, color: heroMuted ? EVEN_GRAY : TILE_INK }}
          cells={scoreCells}
          held={cellsHeld}
          dividerColor="rgba(255,255,255,0.14)"
          cellWeight={700}
          style={{ marginTop: 16 }}
        />
      )}
      {comparison && (
        <p data-scorecard-comparison="true" style={{ margin: '14px 0 0', fontSize: 12.5, lineHeight: 1.45, color: TILE_MUTE, ...NUM }}>{comparison}</p>
      )}
    </div>
  );
};

export { SANS };
