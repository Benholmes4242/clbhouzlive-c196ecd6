/**
 * IndexGlance — the handicap index glance card (BRIEF_ISLANDS_NAV §3).
 *
 * Tapping the connected index cell in the right island opens this card
 * portalled to body; it no longer navigates. (The disconnected variant uses the same GlanceShell without loading WHS data.)
 *
 * DATA LOADS ONLY WHILE OPEN: HcpCell mounts this component only when the
 * glance is open, so useHandicapHistory / useLastRound / the last-five rounds run
 * exclusively for the glance's lifetime. No skeletons — each block appears
 * when its data settles.
 *
 * Position: 300 wide, top = right island bottom + 10px, right edge aligned to
 * the island's right edge. The island host is found via [data-island-right];
 * non-island hosts (AppHeader, NewsChromeBridge) fall back to the index
 * cell's own rect, so the glance works everywhere HcpCell renders.
 *
 * A11y: role dialog + aria-modal, focus moves to the card on open and back to
 * the index cell on close, and the rest of the app is hidden with hideOthers
 * (the ScorecardGlassOverlay pattern). The right island stays VISUALLY sharp
 * above the backdrop via z-index.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlanceShell } from './GlanceShell';
import { useHandicapHistory, useLastRound } from '@/lib/whs/hooks';
import type { HcpMoveDetail } from './ChromeIsland';
import { IndexWindowChart } from '@/components/handicap/IndexWindowChart';
import { indexWindow, indexDirection, indexToneOf, windowSpanLabel } from '@/lib/whs/indexWindow';
import { useLastFiveChartRounds } from '@/lib/whs/lastFive';

const INK = '#F8FAFC';
const DIM = 'rgba(248,250,252,0.42)';
const MOVE_IMPROVING = '#34D77F';
const MOVE_DRIFTING = '#FF5A4E';
const NUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

export interface IndexGlanceProps {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  connectionId: string;
  /** Signed-in member: the shared last five dots on the chart. */
  userId?: string | null;
  currentIndex: number;
  move: HcpMoveDetail;
}

/** "▾ 0.2 this month" when the last move landed in the current calendar
 *  month, otherwise "▾ 0.2 on 12 Sep". Null when there is no move. */
export function glanceMoveText(move: HcpMoveDetail, now: Date = new Date()): string | null {
  if (move.direction === 'none' || move.size == null || move.movedAt == null) return null;
  const triangle = move.direction === 'improving' ? '▾' : '▴';
  const size = move.size.toFixed(1);
  const moved = new Date(move.movedAt);
  const sameMonth =
    moved.getFullYear() === now.getFullYear() && moved.getMonth() === now.getMonth();
  if (sameMonth) return `${triangle} ${size} this month`;
  const date = moved.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${triangle} ${size} on ${date}`;
}

/** BRIEF_ONE_INDEX_CHART: the headline reads the 90-day window's net, the same net that tones the chart. */
export function glanceNinetyDayText(net: number, span = '90 days'): { text: string; color: string } {
  const d = indexDirection(net);
  if (d === 'flat') return { text: `Level · ${span}`, color: 'rgba(248,250,252,0.62)' };
  return { text: `${d === 'down' ? '▼' : '▲'} ${Math.abs(net).toFixed(1)} · ${span}`, color: indexToneOf(net) };
}

/** adjusted_gross − course_par, written +1, E or −2. Null when either side is missing. */
export function formatVsPar(adjustedGross: number | null | undefined, coursePar: number | null | undefined): string | null {
  if (adjustedGross == null || coursePar == null) return null;
  const diff = adjustedGross - coursePar;
  if (diff === 0) return 'E';
  return diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`;
}

export const IndexGlance: React.FC<IndexGlanceProps> = ({
  onClose,
  anchorRef,
  connectionId,
  userId = null,
  currentIndex,
  move,
}) => {
  const navigate = useNavigate();

  const { data: history } = useHandicapHistory(connectionId, 'all');
  const { data: lastRound } = useLastRound(connectionId);

  // BRIEF_ONE_INDEX_CHART: the shared 90-day window and the shared last five.
  const win90 = useMemo(() => indexWindow(history, 90), [history]);
  const chartPoints = useMemo(() => win90.pts.map((p) => ({ value: p.v, observed_at: new Date(p.ts).toISOString() })), [win90]);
  const rounds = useLastFiveChartRounds(userId);

  // Low index: the lowest handicap_index over the last 365 days.
  const lowIndex = useMemo(() => {
    if (!history || history.length === 0) return null;
    const cutoff = Date.now() - 365 * 86_400_000;
    const values = history
      .filter((p) => new Date(p.observed_at).getTime() >= cutoff)
      .map((p) => Number(p.handicap_index))
      .filter((v) => Number.isFinite(v));
    if (values.length === 0) return null;
    return Math.min(...values).toFixed(1);
  }, [history]);

  const lastRoundGross = lastRound?.adjusted_gross ?? null;
  const vsPar = formatVsPar(lastRound?.adjusted_gross, lastRound?.course_par);

  const stats: { value: string; label: string }[] = [];
  if (lowIndex != null) stats.push({ value: lowIndex, label: 'Low index' });
  if (lastRoundGross != null) stats.push({ value: String(lastRoundGross), label: 'Last round' });
  if (vsPar != null) stats.push({ value: vsPar, label: 'vs par' });

  const windowMove = chartPoints.length >= 2 ? glanceNinetyDayText(win90.net, windowSpanLabel(win90)) : null;
  const moveText = windowMove?.text ?? glanceMoveText(move);
  const moveColor = windowMove?.color ?? (move.direction === 'improving' ? MOVE_IMPROVING : MOVE_DRIFTING);

  const openHandicap = () => {
    onClose();
    navigate('/handicap');
  };

  return (
    <GlanceShell onClose={onClose} anchorRef={anchorRef} label="Your handicap index" cardStyle={{ fontFamily: 'inherit' }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: DIM,
          }}
        >
          Your handicap index
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: INK, lineHeight: 1, ...NUM }}>
            {currentIndex.toFixed(1)}
          </div>
          {moveText && (
            <div data-glance-move style={{ fontSize: 12.5, fontWeight: 700, color: moveColor, ...NUM }}>
              {moveText}
            </div>
          )}
        </div>

        {chartPoints.length >= 2 && (
          <div data-testid="index-glance-chart" style={{ marginTop: 14 }}>
            <IndexWindowChart points={chartPoints} windowDays={90} spanLabel={windowSpanLabel(win90)} rounds={rounds} height={60} />
          </div>
        )}

        {stats.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 16,
            }}
            data-glance-stats
          >
            {stats.map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 16, fontWeight: 700, color: INK, ...NUM }}>{s.value}</div>
                <div
                  style={{
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: DIM,
                    marginTop: 4,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={openHandicap}
          style={{
            marginTop: 14,
            height: 42,
            width: '100%',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.07)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 650,
            color: INK,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Open your handicap
          <svg
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke={INK}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
    </GlanceShell>
  );
};

export default IndexGlance;
