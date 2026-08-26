import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAllScores } from '@/lib/whs/hooks';
import { fmtDiff } from '@/lib/whs/format';
import { isReasonableGross, isReasonableDiff } from '@/lib/whs/handicapMath';
import { DarkSectionHeader, DARK_ROW_TITLE } from '../_shared/darkAtoms';
import { Skeleton } from '@/components/ui/skeleton';
import type { WhsScore } from '@/lib/whs/types';
import { formatDay2MonthYearShortGB, formatMonthYearLongGB } from '@/i18n/format';

interface Props {
  connectionId: string;
  currentHandicap: number | null;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const D_BG = 'var(--hcp-bg-1)';
const D_LINE = 'var(--hcp-line)';
const D_T100 = 'var(--hcp-t-100)';
const D_T60 = 'var(--hcp-t-60)';



interface Tile {
  eyebrow: string;
  value: string | null;
  caption: string | null;
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

function isEighteenHoleRound(s: WhsScore): boolean {
  return !s.is_nine_hole && s.total_holes === 18;
}

export const PersonalBests: React.FC<Props> = ({ connectionId, currentHandicap, viewMode = 'owner', ownerFirstName = null }) => {
  const { t } = useTranslation('common');
  const { data: scores, isLoading: fetching, isFetched, isError, refetch } = useAllScores(connectionId);
  // Settled is not "not loading": useAllScores is gated on connectionId.
  const isLoading = !isFetched || fetching;

  const tiles: Tile[] = useMemo(() => {
    const list = scores ?? [];
    const empty = (eyebrow: string): Tile => ({ eyebrow, value: null, caption: null });

    if (list.length === 0) {
      return [
        empty('Best Gross'),
        empty('Best Diff'),
        empty('Best Stableford Score'),
        empty('Best vs HCP'),
        empty('Most Rounds in a Month'),
      ];
    }

    const eighteenHoleList = list.filter(isEighteenHoleRound);

    // #1 Lowest gross (sanity-filtered to exclude impossible rounds)
    const grossList = eighteenHoleList.filter(isReasonableGross);
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
    const diffList = eighteenHoleList.filter(isReasonableDiff);
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
    const stableList = eighteenHoleList.filter((s) => s.stableford_points != null);
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

    // #4 Best vs handicap — rounds with no course par cannot be scored against
    // par, so they are excluded rather than defaulted to a guessed par.
    let bestVsHcp: Tile = empty('Best vs HCP');
    if (currentHandicap != null && grossList.length) {
      const scored = grossList
        .filter((s): s is WhsScore & { adjusted_gross: number; course_par: number } =>
          typeof s.adjusted_gross === 'number' && typeof s.course_par === 'number',
        )
        .map((s) => {
          const overPar = s.adjusted_gross - s.course_par;
          return { s, vsHcp: overPar - currentHandicap };
        })
        ;

      if (scored.length) {
        const best = scored.reduce((a, b) => (a.vsHcp <= b.vsHcp ? a : b));
        const sign = best.vsHcp <= 0 ? '' : '+';
        bestVsHcp = {
          eyebrow: 'Best vs HCP',
          value: `${sign}${best.vsHcp.toFixed(1)}`,
          caption: fmtCourseDate(best.s),
        };
      }
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

  const allEmpty = tiles.every((x) => x.value == null);

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
        {/* ONE panel of aligned rows. The figures share a right edge, which is
            what makes five records comparable. No per-row rule, no span. */}
        <div
          style={{
            background: D_BG,
            border: `1px solid ${D_LINE}`,
            borderRadius: 16,
            padding: '3px 14px',
          }}
        >
          {(isLoading ? Array.from({ length: 5 }) : tiles).map((t, i) => {
            const tile = t as Tile;
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) 68px',
                  gap: 12,
                  alignItems: 'baseline',
                  padding: '13px 0',
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{ minWidth: 0 }}>
                      <Skeleton variant="dark" style={{ height: 13, width: '58%', borderRadius: 2 }} />
                      <Skeleton
                        variant="dark"
                        style={{ height: 12, width: '80%', borderRadius: 2, marginTop: 5 }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Skeleton variant="dark" style={{ height: 20, width: 44, borderRadius: 2 }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ ...DARK_ROW_TITLE, overflowWrap: 'anywhere' }}>
                        {tile.eyebrow}
                      </div>
                      {tile.caption && (
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 400,
                            color: D_T60,
                            lineHeight: 1.35,
                            marginTop: 3,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {tile.caption}
                        </div>
                      )}
                    </div>
                    {/* Absent renders NOTHING; the slot keeps its height so the
                        rows above and below stay aligned. */}
                    <div
                      style={{
                        minHeight: 20,
                        textAlign: 'right',
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: '-0.04em',
                        color: D_T100,
                        fontVariantNumeric: 'tabular-nums lining-nums',
                        lineHeight: 1,
                      }}
                    >
                      {tile.value}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {!isLoading && allEmpty && (
            <div
              style={{
                fontSize: 12,
                color: D_T60,
                lineHeight: 1.4,
                padding: '0 0 13px',
              }}
            >
              {t('common:handicap.records.emptyHint')}
            </div>
          )}
        </div>
      </div>

    </section>
  );
};

export default PersonalBests;
