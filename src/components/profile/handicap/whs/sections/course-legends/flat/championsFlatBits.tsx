/**
 * BRIEF_CHAMPIONS_TAB_REBUILD — the shared parts of the flat Champions tab.
 *
 * ONE row, ONE champion line, ONE chip row. The tab and the full-board sheet
 * both import from here, so the sheet cannot become richer than the tab again.
 * The sheet's ONLY addition is a per-row deficit, passed as a prop.
 *
 * Nothing here modifies Panel, tokens.tsx, DiscoverSectionHeading or the
 * shared board chip treatment.
 */
import React from 'react';
import { Crown } from 'lucide-react';
import { A, NUM, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { SCOPE_PILL_RADIUS } from '@/components/explore-tab-new/courseled/tokens';
import { BoardAvatar, formatChampionsWhen, formatToPar, toParColor, hasToPar } from '../drilldown/_shared/boardParts';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';

export const MINUS = '\u2212';

/** Lower is better on gross; every other board counts upwards. */
export function lowerIsBetter(cat: string): boolean {
  return String(cat).startsWith('lowest_gross');
}

/** The board's own unit, pluralised for the gap sentence. */
export function unitWord(cat: string, n: number): string {
  const base = String(cat).replace(/_(90d|all_time)$/, '');
  const one = n === 1;
  switch (base) {
    case 'lowest_gross':
    case 'lowest_gross_women':
      return one ? 'shot' : 'shots';
    case 'best_stableford':
      return one ? 'point' : 'points';
    case 'most_birdies':
      return one ? 'birdie' : 'birdies';
    case 'most_eagles':
      return one ? 'eagle' : 'eagles';
    case 'most_aces':
      return one ? 'ace' : 'aces';
    case 'most_albatrosses':
      return one ? 'albatross' : 'albatrosses';
    case 'most_rounds':
      return one ? 'round' : 'rounds';
    case 'best_score_diff':
      return one ? 'shot against handicap' : 'shots against handicap';
    default:
      return one ? 'point' : 'points';
  }
}

const WORDS = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve',
];

/** Sentence-leading number word, so the gap line never opens on a numeral. */
export function numberWord(n: number, capital = true): string {
  const w = n >= 0 && n < WORDS.length ? WORDS[n] : String(n);
  return capital ? w : w.toLowerCase();
}

/** "HELD 5Y" / "HELD 7M" / "HELD 3D" — how long the champion has stood. */
export function tenureLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days < 0) return null;
  if (days >= 365) return `HELD ${Math.floor(days / 365)}Y`;
  if (days >= 31) return `HELD ${Math.floor(days / 30)}M`;
  if (days <= 1) return 'HELD 1D';
  return `HELD ${days}D`;
}

/** "since June" for the viewer's own reign. */
export function heldSince(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    ? d.toLocaleDateString('en-GB', { month: 'long' })
    : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export interface FlatRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  value: number;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
  userId?: string | null;
}

/* ------------------------------------------------------------------ CHIPS */

export interface FlatChip {
  key: LegendCategory;
  short: string;
  figure: string;
}

/**
 * One chip per CLAIMED board, each carrying its leading figure. An unclaimed
 * board gets no chip — a dash is not a figure. They are named in Unclaimed.
 */
export const BoardChips: React.FC<{
  chips: FlatChip[];
  activeKey: LegendCategory;
  onSelect: (key: LegendCategory) => void;
  gutter?: number;
}> = ({ chips, activeKey, onSelect, gutter = 20 }) => (
  <div
    className="champions-flat-chips"
    style={{
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
      padding: `0 ${gutter}px`,
      margin: `0 -${gutter}px`,
    }}
  >
    <style>{`.champions-flat-chips::-webkit-scrollbar{display:none}`}</style>
    {chips.map((c) => {
      const active = c.key === activeKey;
      return (
        <button
          key={c.key}
          type="button"
          onClick={() => onSelect(c.key)}
          aria-pressed={active}
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: SCOPE_PILL_RADIUS,
            border: `1px solid ${active ? A.INK : A.BORDER}`,
            background: active ? A.INK : 'transparent',
            color: active ? A.PANEL : A.INK,
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          {c.short}
          <span style={{ ...NUM, fontSize: 12.5, fontWeight: 700, color: active ? A.PANEL : A.INK }}>
            {c.figure}
          </span>
        </button>
      );
    })}
  </div>
);

/* --------------------------------------------------------- CHAMPION LINE */

/**
 * §3.2 — the important addition. Who holds it, for how long, and what it
 * would take, in the board's own unit. Identical on the tab and in the sheet.
 */
export const ChampionLine: React.FC<{
  category: LegendCategory;
  rows: FlatRow[];
  /** The viewer's own value on this board, when they are on it. */
  viewerValue?: number | null;
}> = ({ category, rows, viewerValue = null }) => {
  const champion = rows[0];
  if (!champion) return null;

  const onlyRound = rows.length === 1 && !champion.isSelf ? false : rows.length === 1;
  const tenure = tenureLabel(champion.attained_at);
  const since = heldSince(champion.attained_at);

  let gapLine: string | null = null;
  if (rows.length > 1 || (viewerValue != null && !champion.isSelf)) {
    const chaser = viewerValue != null && !champion.isSelf ? viewerValue : rows[1]?.value ?? null;
    const chaserIsViewer = viewerValue != null && !champion.isSelf;
    if (chaser != null) {
      const diff = Math.abs(Math.round(champion.value - chaser));
      if (diff > 0) {
        const unit = unitWord(category, diff);
        const first = champion.name.split(/\s+/)[0] || champion.name;
        gapLine = chaserIsViewer
          ? `${numberWord(diff)} ${unit} to take the crown from ${first}.`
          : `${numberWord(diff)} ${unit} clear of the next member.`;
      }
    }
  }

  return (
    <div style={{ fontFamily: SANS }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: champion.isSelf ? A.AMBER : A.INK,
            letterSpacing: '-0.01em',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {champion.isSelf ? 'You' : champion.name}
        </span>
        {!onlyRound && tenure && !champion.isSelf ? (
          <span
            style={{
              flexShrink: 0,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.19em',
              textTransform: 'uppercase',
              color: A.AMBER,
            }}
          >
            {tenure}
          </span>
        ) : null}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 500, color: A.MUTE, lineHeight: 1.45 }}>
        {onlyRound
          ? 'The only round posted here.'
          : champion.isSelf
            ? since
              ? `You have held this since ${since}.`
              : 'You hold this board.'
            : gapLine}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- ROW */

/**
 * The one board row. No column headers, no tinted band on the viewer's row —
 * the amber IS the statement. The sheet passes `deficit`; the tab does not.
 */
export const FlatBoardRow: React.FC<{
  row: FlatRow;
  pos: string;
  category: LegendCategory;
  coursePar?: number | null;
  rule?: boolean;
  /** SHEET ONLY — "−5 from champion" in the board's unit. */
  deficit?: string | null;
  onPress?: () => void;
}> = ({ row, pos, category, coursePar = null, rule = true, deficit = null, onPress }) => {
  const tone = row.isSelf ? A.AMBER : A.INK;
  const showToPar = hasToPar(category) && coursePar != null;
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: 'grid',
        width: '100%',
        gridTemplateColumns: '26px 34px 1fr auto',
        gap: 10,
        alignItems: 'center',
        padding: '11px 0',
        background: 'transparent',
        border: 'none',
        borderTop: rule ? `1px solid ${A.HAIRLINE}` : undefined,
        textAlign: 'left',
        fontFamily: SANS,
        cursor: onPress ? 'pointer' : 'default',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {pos === '1' && (
          <Crown size={11} strokeWidth={2.5} fill={A.AMBER} style={{ color: A.AMBER, flexShrink: 0 }} />
        )}
        <span style={{ ...NUM, fontSize: 12, color: row.isSelf ? A.AMBER : A.DIM }}>{pos}</span>
      </span>
      <BoardAvatar photoUrl={row.photoUrl} name={row.name} size={34} />
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: tone,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.isSelf ? 'You' : row.name}
        </span>
        <span style={{ display: 'block', marginTop: 3, fontSize: 11, fontWeight: 500, color: A.DIM }}>
          {formatChampionsWhen(row.attained_at)}
        </span>
        {deficit ? (
          <span style={{ ...NUM, display: 'block', marginTop: 3, fontSize: 11, fontWeight: 600, color: A.DIM }}>
            {deficit}
          </span>
        ) : null}
      </span>
      <span style={{ textAlign: 'right', minWidth: 0 }}>
        <span style={{ ...NUM, fontSize: 16, fontWeight: 700, color: tone, display: 'block', lineHeight: 1 }}>
          {row.valueDisplay}
        </span>
        {showToPar && coursePar != null ? (
          <span
            style={{
              ...NUM,
              display: 'block',
              marginTop: 3,
              fontSize: 11,
              lineHeight: 1,
              color: row.isSelf ? A.AMBER : toParColor(row.value, coursePar),
            }}
          >
            {formatToPar(row.value, coursePar)}
          </span>
        ) : null}
      </span>
    </button>
  );
};

/** The sheet's per-row deficit, in the board's unit. Champion gets none. */
export function deficitFor(category: LegendCategory, row: FlatRow, champion: FlatRow): string | null {
  const diff = Math.abs(Math.round(champion.value - row.value));
  if (diff === 0) return null;
  return `${MINUS}${diff} ${unitWord(category, diff)} from champion`;
}

/** Chevron action, matching the Course and You tabs. */
export const FlatAction: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <button
    type="button"
    onClick={onPress}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      width: '100%',
      padding: '12px 0 0',
      background: 'transparent',
      border: 'none',
      borderTop: `1px solid ${A.HAIRLINE}`,
      marginTop: 12,
      fontFamily: SANS,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.19em',
      textTransform: 'uppercase',
      color: A.AMBER,
      cursor: 'pointer',
    }}
  >
    {label}
    <span aria-hidden style={{ fontSize: 12, letterSpacing: 0 }}>›</span>
  </button>
);

/** The board's window, stated in the meta so figure and basis travel together. */
export function windowMeta(count: number, legendWindow: LegendWindow): string {
  const members = `${count} ${count === 1 ? 'member' : 'members'}`;
  return `${members} · ${legendWindow === '90d' ? 'last 90 days' : 'all time'}`;
}
