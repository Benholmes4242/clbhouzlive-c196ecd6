import React, { useMemo } from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import { fmtDiff } from '@/lib/whs/format';
import { isReasonableGross, isReasonableDiff } from '@/lib/whs/handicapMath';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import { Skeleton } from '@/components/ui/skeleton';
import type { WhsScore } from '@/lib/whs/types';
import { TrendingDown, Flag, Target, Award, CalendarDays, type LucideIcon } from 'lucide-react';
import { formatDay2MonthYearShortGB, formatMonthYearLongGB } from '@/i18n/format';

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

const RECORD_ICON: Record<string, LucideIcon> = {
  'Best Diff': TrendingDown,
  'Best Gross': Flag,
  'Best Stableford Score': Target,
  'Best vs HCP': Award,
  'Most Rounds in a Month': CalendarDays,
};

interface Tile {
  eyebrow: string;
  value: string;
  caption: string | null;
  valueColor?: string;
}

function fmtCourseDate(s: WhsScore | null): string | null {
  if (!s) return null;
  const name = s.course?.name ?? null;
  const d = s.play_date ? new Date(s.play_date) : null;
  const dStr = d
    ? formatDay2MonthYearShortGB(d)
    : null;
  return [name, dStr].filter(Boolean).join(' · ') || null;
}

function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map((s) => parseInt(s, 10));
  const d = new Date(y, (m || 1) - 1, 1);
  return formatMonthYearLongGB(d);
}

export const PersonalBests: React.FC<Props> = ({ connectionId, currentHandicap, viewMode = 'owner', ownerFirstName = null }) => {
  const { data: scores, isLoading, isError, refetch } = useAllScores(connectionId);

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
        valueColor: '#55BD8B',
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
      const scored = grossList.map((s) => {
        const course = s.course as { course_par?: number | null } | null | undefined;
        const par = course?.course_par ?? 72;
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
        valueColor: '#55BD8B',
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

  if (isError && !isLoading) {
    return (
      <section style={{ marginTop: 0, fontFamily: FONT }}>
        <DarkSectionHeader
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
              background: D_BG,
              border: `1px solid ${D_LINE}`,
              borderRadius: 16,
              padding: '20px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12, color: D_T60 }}>
              Couldn't load your bests.
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${D_LINE}`,
                color: D_T100,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONT,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginTop: 0, fontFamily: FONT }}>
      <DarkSectionHeader
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
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          {(isLoading ? Array.from({ length: 5 }) : tiles).map((t, i) => {
            const tile = t as Tile;
            const Icon = !isLoading ? RECORD_ICON[tile.eyebrow] : null;
            const isEmpty = !isLoading && tile.value === '—';
            // Last card spans full width when there's an odd count (5 → last is full-width)
            const isOddLast =
              !isLoading && i === tiles.length - 1 && tiles.length % 2 === 1;

            return (
              <div
                key={i}
                style={{
                  gridColumn: isOddLast ? '1 / -1' : 'auto',
                  background: D_BG,
                  border: `1px solid ${D_LINE}`,
                  borderRadius: 16,
                  padding: 12,
                  position: 'relative',
                  overflow: 'hidden',
                  minWidth: 0,
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: D_BG3 }} />
                      <div style={{ width: 44, height: 26, background: D_BG3, borderRadius: 4 }} />
                    </div>
                    <div style={{ height: 13, width: '70%', background: D_BG3, borderRadius: 2, marginTop: 12 }} />
                    <div style={{ height: 10.5, width: '85%', background: D_BG3, borderRadius: 2, marginTop: 6 }} />
                  </>
                ) : (
                  <>
                    {/* top row: icon chip + value */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: 'var(--hcp-bg-2)',
                          border: '1px solid var(--hcp-line)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          boxSizing: 'border-box',
                        }}
                      >
                        {Icon && <Icon size={15} color="var(--hcp-t-60)" strokeWidth={2.2} />}
                      </div>
                      <span
                        style={{
                          fontSize: 30,
                          fontWeight: 300,
                          color: isEmpty ? 'var(--hcp-t-30)' : (tile.valueColor ?? D_T100),
                          fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '-0.04em',
                          lineHeight: 0.85,
                        }}
                      >
                        {tile.value}
                      </span>
                    </div>

                    {/* label */}
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: D_T100,
                        letterSpacing: '-0.005em',
                        marginTop: 12,
                      }}
                    >
                      {tile.eyebrow}
                    </div>

                    {/* context (course · date) */}
                    {tile.caption && (
                      <div
                        style={{
                          fontSize: 10.5,
                          color: D_T60,
                          marginTop: 2,
                          fontWeight: 600,
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {tile.caption}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PersonalBests;
