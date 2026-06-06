import React, { useMemo } from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import { fmtDiff } from '@/lib/whs/format';
import { isReasonableGross, isReasonableDiff } from '@/lib/whs/handicapMath';
import { SectionHeader } from '../_shared/atoms';
import type { WhsScore } from '@/lib/whs/types';

interface Props {
  connectionId: string;
  currentHandicap: number | null;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const D_BG = 'var(--hcp-bg-1)';
const D_LINE = 'var(--hcp-line)';
const D_T100 = 'var(--hcp-t-100)';
const D_T60 = 'var(--hcp-t-60)';
const D_BG3 = 'var(--hcp-bg-3)';

interface Tile {
  eyebrow: string;
  value: string;
  caption: string | null;
}

function fmtCourseDate(s: WhsScore | null): string | null {
  if (!s) return null;
  const name = s.course?.name ?? null;
  const d = s.play_date ? new Date(s.play_date) : null;
  const dStr = d
    ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  return [name, dStr].filter(Boolean).join(' · ') || null;
}

function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map((s) => parseInt(s, 10));
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export const PersonalBests: React.FC<Props> = ({ connectionId, currentHandicap, viewMode = 'owner', ownerFirstName = null }) => {
  const { data: scores, isLoading } = useAllScores(connectionId);

  const tiles: Tile[] = useMemo(() => {
    const list = scores ?? [];
    const empty = (eyebrow: string): Tile => ({ eyebrow, value: '—', caption: null });

    if (list.length === 0) {
      return [
        empty('Best Gross'),
        empty('Best Diff'),
        empty('Best Stableford Score'),
        empty('Best vs HCP'),
        empty('Most Rounds in a Month'),
      ];
    }

    // #1 Lowest gross (sanity-filtered to exclude impossible rounds)
    const grossList = list.filter(isReasonableGross);
    let bestGross: Tile = empty('Best Gross');
    if (grossList.length) {
      const best = grossList.reduce((a, b) =>
        (a.adjusted_gross as number) <= (b.adjusted_gross as number) ? a : b,
      );
      bestGross = {
        eyebrow: 'Best Gross',
        value: String(best.adjusted_gross),
        caption: fmtCourseDate(best),
      };
    }

    // #2 Lowest differential (sanity-filtered to exclude impossible rounds)
    const diffList = list.filter(isReasonableDiff);
    let bestDiff: Tile = empty('Best Diff');
    if (diffList.length) {
      const best = diffList.reduce((a, b) =>
        (a.handicap_differential as number) <= (b.handicap_differential as number) ? a : b,
      );
      bestDiff = {
        eyebrow: 'Best Diff',
        value: fmtDiff(best.handicap_differential as number),
        caption: fmtCourseDate(best),
      };
    }

    // #3 Best Stableford
    const stableList = list.filter((s) => s.stableford_points != null);
    let bestSF: Tile = empty('Best Stableford Score');
    if (stableList.length) {
      const best = stableList.reduce((a, b) =>
        (a.stableford_points as number) >= (b.stableford_points as number) ? a : b,
      );
      bestSF = {
        eyebrow: 'Best Stableford Score',
        value: String(best.stableford_points),
        caption: fmtCourseDate(best),
      };
    }

    // #4 Best vs handicap
    let bestVsHcp: Tile = empty('Best vs HCP');
    if (currentHandicap != null && grossList.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scored = grossList.map((s) => {
        const par = (s.course as any)?.course_par ?? 72;
        const overPar = (s.adjusted_gross as number) - par;
        const vsHcp = overPar - currentHandicap;
        return { s, vsHcp };
      });
      const best = scored.reduce((a, b) => (a.vsHcp <= b.vsHcp ? a : b));
      const sign = best.vsHcp <= 0 ? '' : '+';
      bestVsHcp = {
        eyebrow: 'Best vs HCP',
        value: `${sign}${best.vsHcp.toFixed(1)}`,
        caption: fmtCourseDate(best.s),
      };
    }

    // #5 Most rounds in a month
    let mostMonth: Tile = empty('Most Rounds in a Month');
    const monthCounts = new Map<string, number>();
    for (const s of list) {
      if (!s.play_date) continue;
      const key = s.play_date.substring(0, 7);
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
    if (monthCounts.size) {
      let topKey = '';
      let topCount = 0;
      for (const [k, v] of monthCounts) {
        if (v > topCount) {
          topCount = v;
          topKey = k;
        }
      }
      mostMonth = {
        eyebrow: 'Most Rounds in a Month',
        value: String(topCount),
        caption: monthLabel(topKey),
      };
    }

    return [bestDiff, bestGross, bestSF, bestVsHcp, mostMonth];
  }, [scores, currentHandicap]);

  return (
    <section style={{ marginTop: 32, fontFamily: FONT }}>
      <SectionHeader
        eyebrow="PERSONAL BESTS"
        title={
          viewMode === 'friend'
            ? `${ownerFirstName ? `${ownerFirstName}'s` : 'Their'} records to break`
            : 'Records to break'
        }
      />
      <div style={{ padding: '0 16px 8px' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {(isLoading ? Array.from({ length: 5 }) : tiles).map((t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 14px',
                borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {!isLoading && (t as Tile).value !== '—' && (
                <>
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: 2,
                      background: 'linear-gradient(180deg, #F7931E 0%, #BA6E12 100%)',
                      opacity: 0.6,
                    }}
                  />
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      right: -18,
                      bottom: -22,
                      opacity: 0.08,
                      color: GOLD,
                      transform: 'rotate(-8deg)',
                      pointerEvents: 'none',
                    }}
                  >
                    <Crown size={72} strokeWidth={1.4} />
                  </div>
                </>
              )}

              <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                {isLoading ? (
                  <>
                    <div style={{ height: 13, width: '50%', background: D_BG3, borderRadius: 2, marginBottom: 4 }} />
                    <div style={{ height: 10.5, width: '75%', background: D_BG3, borderRadius: 2 }} />
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: '-0.005em',
                        color: 'rgba(247,147,30,0.85)',
                      }}
                    >
                      {(t as Tile).eyebrow}
                    </div>
                    {(t as Tile).caption && (
                      <div
                        style={{
                          fontSize: 10.5,
                          color: D_T60,
                          marginTop: 2,
                          fontWeight: 600,
                          lineHeight: 1.15,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {(t as Tile).caption}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexShrink: 0, position: 'relative', zIndex: 1 }}>
                {isLoading ? (
                  <div style={{ height: 22, width: 48, background: D_BG3, borderRadius: 4 }} />
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 200,
                        color: (t as Tile).value === '—' ? 'rgba(255,255,255,0.25)' : D_T100,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.04em',
                        lineHeight: 0.9,
                      }}
                    >
                      {(t as Tile).value}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PersonalBests;
