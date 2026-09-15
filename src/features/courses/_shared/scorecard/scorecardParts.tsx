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
import { RefreshCw, Table } from 'lucide-react';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { TREND_UP, TREND_DOWN, TOPAR_EVEN_DARK } from '@/features/tourhub/_shared/tokens';
import {
  A, SANS, NUM, KICKER, Panel, StatRow, Hairline,
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
      fontWeight: emphasis === 'strokes' ? 800 : undefined,
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

export interface RoundSummaryHeadProps {
  isTour?: boolean;
  kickerText?: string;
  courseName: string;
  courseLocation?: string | null;
  /** Shown only when the round has a score to show. */
  showScore: boolean;
  gross: number | null;
  toPar: number | null;
  /** Par the to-par is measured against; 0 falls back to coursePar. */
  shownPar?: number;
  coursePar?: number | null;
  heroMuted?: boolean;
  playerName?: string | null;
  playerAvatarUrl?: string | null;
  playerUserId?: string | null;
  /** Tour only — the ordered candidate chain from the canonical resolver. */
  tourAvatarCandidates?: string[];
  isOwner?: boolean;
  playerHcpDelta?: number | null;
  rail?: RailFigure[];
}

/**
 * S1 — THE FIXED SUMMARY. Course, place, member, gross, to-par, and the rail
 * when a figure resolves. One component for the sheet and for the neighbour
 * preview drawn during a swipe.
 */
export const RoundSummaryHead: React.FC<RoundSummaryHeadProps> = ({
  isTour = false, kickerText, courseName, courseLocation,
  showScore, gross, toPar, shownPar = 0, coursePar,
  heroMuted, playerName, playerAvatarUrl, playerUserId,
  tourAvatarCandidates = [], isOwner = false, playerHcpDelta, rail = [],
}) => {
  const { t } = useTranslation(['courses']);
  const showChip = playerHcpDelta != null && Math.abs(playerHcpDelta) >= 0.05;
  const showIdentity = !!playerName;

  return (
    <div
      style={{
        padding: '12px 16px 10px',
        borderBottom: `1px solid ${A.BORDER}`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* LEFT — date, course, member */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          {!!kickerText && isTour && (
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
          {courseLocation && (
            <div style={{ fontSize: 12, color: A.DIM, marginTop: 2 }}>{courseLocation}</div>
          )}
          {showIdentity && isTour && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, minWidth: 0 }}>
              <span style={{ flexShrink: 0, marginRight: 8 }}>
                <SquircleAvatar
                  srcCandidates={tourAvatarCandidates}
                  alt={playerName as string}
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
                title={playerName as string}
              >
                {playerName}
              </span>
              {showChip && <span style={{ marginLeft: 8, flexShrink: 0 }}><HandicapChip delta={playerHcpDelta as number} /></span>}
            </div>
          )}
        </div>

        {/* RIGHT — THE SCORE. Visible the moment the sheet opens. */}
        {showScore && (
          <div style={{ flex: 'none', textAlign: 'right' }}>
            <div
              style={{
                ...NUM, fontSize: 34, fontWeight: 800, lineHeight: 0.9,
                letterSpacing: '-0.05em',
                color: heroMuted ? EVEN_GRAY : A.INK,
              }}
            >
              {gross}
            </div>
            <div style={{ ...NUM, fontSize: 12, fontWeight: 700, marginTop: 6, color: A.MUTE, whiteSpace: 'nowrap' }}>
              <span style={{ color: heroMuted ? EVEN_GRAY : toParColor(toPar) }}>{fmtRel(toPar)}</span>
              {(shownPar > 0 || coursePar != null) && (
                <span> {'\u00B7'} {t('courses:scorecard.parN', { n: shownPar > 0 ? shownPar : coursePar })}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {!isTour && showIdentity && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 10, minWidth: 0 }}>
          <span style={{ flexShrink: 0, marginRight: 8 }}>
            <SquircleAvatar src={playerAvatarUrl ?? null} alt={playerName as string} userId={playerUserId ?? undefined} size={24} hairlineRing />
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: isOwner ? A.AMBER : A.INK, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {playerName}
          </span>
          {!!kickerText && <span style={{ ...LABEL_READ, marginLeft: 8, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kickerText}</span>}
          {showChip && <span style={{ marginLeft: 8, flexShrink: 0 }}><HandicapChip delta={playerHcpDelta as number} /></span>}
        </div>
      )}

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
  );
};

export { SANS };
