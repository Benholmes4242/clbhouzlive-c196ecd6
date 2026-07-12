/**
 * BoardTable — Tour Book leaderboard rows.
 *
 * Columns: POS(26) + MOVE(20) = 46 left | PLAYER(flex) | TOT(44) | THRU(44) | TODAY(44)
 * Header rendered by parent (LeaderboardTab) with a single 46px POS
 * label; the delta lives inside that footprint so the outer layout
 * is unchanged.
 *
 * House score colors:
 *   under par -> #189A55
 *   over par  -> #C24A4A
 *   E/level   -> #8A9099
 *
 * MOVEMENT COLUMN (live — computed round-start deltas).
 * POS is a two-slot cell: position (T-prefixed) in a 26px slot,
 * delta in an adjacent 20px slot. That guarantees deltas ('UP N' /
 * 'DN N') sit on the same vertical line whether the position is '1'
 * or 'T44'. Deltas come from movementFromRounds using standard-
 * competition ranking on prior-round strokes. Zero delta / no delta
 * renders empty (quiet board). CUT/WD/DQ rows never show a delta.
 *
 * CUT sentence and CUT/WD/DQ demoted rows are inserted inline by
 * this component; the parent supplies cut state via props.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { movementFromRounds } from './movementFromRounds';

const INK = '#0F172A';
const SECONDARY = '#4B5563';
const MUTED = '#94A3B8';
const HAIRLINE = 'rgba(0,0,0,0.08)';
const BAND = '#F8FAFC';

const SCORE_UNDER = '#189A55';
const SCORE_OVER = '#C24A4A';
const SCORE_EVEN = '#8A9099';

const POS_NUM_W = 26;
const POS_MOVE_W = 20;
const NUM_W = 44;

const F = 'Geist, system-ui, sans-serif';

export interface BoardEntry {
  id: string;
  position: number | null;
  position_tied?: boolean | null;
  score: number | null;
  thru: number | null;
  today?: number | null;
  status?: string | null;
  round_1?: number | null;
  round_2?: number | null;
  round_3?: number | null;
  round_4?: number | null;
  raw_data?: any;
  player?: {
    id: string;
    full_name: string;
    country_code?: string | null;
    country?: string | null;
  } | null;
}

export interface CutState {
  kind: 'none' | 'projected' | 'actual';
  cutline: number | null;
  extraCount: number;
}

interface Props {
  entries: BoardEntry[];
  cutState: CutState;
  currentRound?: number | null;
}

function houseColor(score: number | null | undefined): string {
  if (score == null) return INK;
  if (score < 0) return SCORE_UNDER;
  if (score > 0) return SCORE_OVER;
  return SCORE_EVEN;
}

function fmtScore(score: number | null | undefined): string {
  if (score == null) return '-';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : String(score);
}

function fmtThru(thru: number | null | undefined): string {
  if (thru == null) return '-';
  if (thru >= 18) return 'F';
  return String(thru);
}

function todayFromEntry(e: BoardEntry): number | null {
  if (e.today != null) return e.today;
  const roundNum = [e.round_1, e.round_2, e.round_3, e.round_4].filter(
    (r) => r != null,
  ).length;
  if (roundNum === 0) return null;
  const active =
    roundNum === 1
      ? e.round_1
      : roundNum === 2
      ? e.round_2
      : roundNum === 3
      ? e.round_3
      : e.round_4;
  return active ?? null;
}

function roundsLine(e: BoardEntry): string | null {
  const rs = [e.round_1, e.round_2, e.round_3, e.round_4];
  const parts: string[] = [];
  for (let i = 0; i < 4; i++) {
    const r = rs[i];
    if (r == null) continue;
    const disp = r === 0 ? 'E' : r > 0 ? `+${r}` : String(r);
    parts.push(`R${i + 1} ${disp}`);
  }
  return parts.length ? parts.join(' \u00B7 ') : null;
}

function isDemoted(s?: string | null): boolean {
  if (!s) return false;
  const u = s.toUpperCase();
  return u === 'MC' || u === 'CUT' || u === 'WD' || u === 'DQ' || u === 'MDF' || u === 'DNS';
}

function statusWord(s?: string | null): string {
  const u = (s || '').toUpperCase();
  if (u === 'CUT' || u === 'MC') return 'CUT';
  if (u === 'MDF') return 'MDF';
  return u || '-';
}

export function BoardTable({ entries, cutState }: Props) {
  const navigate = useNavigate();

  // Partition: active rows first (in incoming order), demoted after.
  const { active, demoted, insertionIndex } = useMemo(() => {
    const act: BoardEntry[] = [];
    const dem: BoardEntry[] = [];
    for (const e of entries) (isDemoted(e.status) ? dem : act).push(e);

    let idx = act.length; // default: after all active rows
    if (cutState.kind === 'projected' && cutState.cutline != null) {
      // insert between last player at/inside the number and first outside
      const cutTot = cutState.cutline;
      idx = act.findIndex((e) => e.score != null && e.score > cutTot);
      if (idx < 0) idx = act.length;
    }
    return { active: act, demoted: dem, insertionIndex: idx };
  }, [entries, cutState]);

  const renderCutSentence = () => {
    if (cutState.kind === 'none') return null;
    const isProjected = cutState.kind === 'projected';
    const label = isProjected ? 'Projected cut' : 'The following players failed to make the cut';
    const cl = cutState.cutline;
    const numTxt =
      cl == null ? '' : cl === 0 ? 'E' : cl > 0 ? `+${cl}` : String(cl);
    const extraTxt =
      cutState.extraCount > 0 ? ` (+${cutState.extraCount})` : '';
    return (
      <div
        key="__cut__"
        style={{
          background: BAND,
          padding: '10px 16px',
          borderTop: `1px solid ${HAIRLINE}`,
          borderBottom: `1px solid ${HAIRLINE}`,
          fontFamily: F,
          fontSize: 9.5,
          fontWeight: 700,
          color: SECONDARY,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
        {numTxt ? (
          <>
            {' '}
            <span style={{ fontWeight: 800, color: INK }}>
              {numTxt}
              {extraTxt}
            </span>
          </>
        ) : null}
      </div>
    );
  };

  const renderRow = (e: BoardEntry, opts?: { demoted?: boolean }) => {
    const demotedRow = !!opts?.demoted;
    const posText = demotedRow
      ? statusWord(e.status)
      : e.position == null
      ? '-'
      : `${e.position_tied ? 'T' : ''}${e.position}`;
    const totColor = demotedRow ? SECONDARY : houseColor(e.score);
    const totalDisplay = fmtScore(e.score);
    const thruDisplay = fmtThru(e.thru);
    const todayVal = todayFromEntry(e);
    const todayDisplay = fmtScore(todayVal);
    const todayColor = demotedRow ? SECONDARY : houseColor(todayVal);
    const rounds = roundsLine(e);
    const cc = e.player?.country_code || e.player?.country || '';

    return (
      <div
        key={e.id}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (e.player?.id) navigate(`/tourhub/player/${e.player.id}`);
        }}
        onKeyDown={(k) => {
          if ((k.key === 'Enter' || k.key === ' ') && e.player?.id) {
            navigate(`/tourhub/player/${e.player.id}`);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8.5px 16px',
          borderBottom: `1px solid ${HAIRLINE}`,
          background: '#fff',
          opacity: demotedRow ? 0.55 : 1,
          cursor: 'pointer',
          fontFamily: F,
        }}
      >
        {/* POS */}
        <div
          style={{
            width: POS_W,
            flexShrink: 0,
            fontSize: demotedRow ? 9 : 12.5,
            fontWeight: demotedRow ? 800 : 700,
            color: INK,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: demotedRow ? '0.06em' : undefined,
          }}
        >
          {posText}
        </div>

        {/* PLAYER — two lines */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: INK,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {e.player?.full_name || 'Unknown'}
            </span>
            {cc && (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: MUTED,
                  flexShrink: 0,
                  letterSpacing: '0.04em',
                }}
              >
                {cc.toUpperCase()}
              </span>
            )}
          </div>
          {rounds && (
            <div
              style={{
                marginTop: 2,
                fontSize: 9,
                color: MUTED,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {rounds}
            </div>
          )}
        </div>

        {/* TOT */}
        <div
          style={{
            width: NUM_W,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 13.5,
            fontWeight: 800,
            color: totColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {totalDisplay}
        </div>

        {/* THRU */}
        <div
          style={{
            width: NUM_W,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 11.5,
            color: SECONDARY,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {demotedRow ? '-' : thruDisplay}
        </div>

        {/* TODAY */}
        <div
          style={{
            width: NUM_W,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: 11.5,
            fontWeight: 700,
            color: todayColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {demotedRow ? '-' : todayDisplay}
        </div>
      </div>
    );
  };

  const parts: React.ReactNode[] = [];
  active.forEach((e, i) => {
    if (i === insertionIndex) parts.push(renderCutSentence());
    parts.push(renderRow(e));
  });
  if (insertionIndex >= active.length && cutState.kind !== 'none') {
    parts.push(renderCutSentence());
  }
  demoted.forEach((e) => parts.push(renderRow(e, { demoted: true })));

  return <div>{parts}</div>;
}

export default BoardTable;
