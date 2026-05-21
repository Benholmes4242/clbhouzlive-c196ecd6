import React, { useMemo } from 'react';
import { ChevronLeft, Crown } from 'lucide-react';
import { useCourseLegends } from '@/hooks/gam/useCourseLegends';
import { GamCard, Skeleton, EmptyStub, RetryStub } from '../../../gam/_shared/GamAtoms';
import {
  legendCategoryLabel,
  legendCategoryIcon,
  formatLegendValue,
  rankEmoji,
} from '@/lib/gam/visuals';
import type { LegendCategory } from '@/lib/gam/types';
import { CourseEyebrow } from './_shared/CourseEyebrow';
import type { CourseSelection } from './types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const AMBER = '#F7931E';

const CATEGORIES_ORDER: LegendCategory[] = [
  'best_score_diff',
  'lowest_gross',
  'most_birdies_90d',
  'best_stableford_90d',
  'most_rounds_90d',
];

interface Props {
  state: CourseSelection;
  onBack: () => void;
}

export const CourseLegendsDrilldown: React.FC<Props> = ({ state, onBack }) => {
  const { data, isLoading, isError, refetch } = useCourseLegends(state.courseId);

  const grouped = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = new Map<LegendCategory, any[]>();
    (data ?? []).forEach((row) => {
      const list = m.get(row.category) ?? [];
      list.push(row);
      m.set(row.category, list);
    });
    return m;
  }, [data]);

  return (
    <div>
      {/* HEADER */}
      <div style={{ padding: '20px 16px 0' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: 'var(--hcp-t-60)',
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          <ChevronLeft size={16} />
          All courses
        </button>
        <CourseEyebrow
          type={state.courseType}
          region={state.courseRegion}
          country={state.courseCountry}
        />
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}
        >
          {state.courseName}
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} radius={12} />
          ))}
        </div>
      )}

      {isError && (
        <div style={{ padding: '20px 16px' }}>
          <RetryStub message="Couldn't load Course Legends" onRetry={() => refetch()} />
        </div>
      )}

      {!isLoading && !isError && (data ?? []).length === 0 && (
        <div style={{ padding: '20px 16px' }}>
          <EmptyStub
            icon={<Crown size={48} color={AMBER} style={{ opacity: 0.5 }} />}
            title="No legends yet"
            body="Once anyone posts a round here, the leaderboards spin up."
          />
        </div>
      )}

      {!isLoading && !isError && (data ?? []).length > 0 && (
        <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {CATEGORIES_ORDER.map((cat) => {
            const rows = (grouped.get(cat) ?? []).slice(0, 5);
            if (rows.length === 0) return null;
            return (
              <GamCard key={cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  {(() => {
                    const Icon = legendCategoryIcon[cat];
                    return (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: 'var(--hcp-bg-3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: 'var(--hcp-t-80)',
                        }}
                      >
                        <Icon size={16} strokeWidth={2.2} />
                      </div>
                    );
                  })()}
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--hcp-t-100)',
                    }}
                  >
                    {legendCategoryLabel[cat]}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {rows.map((r: any, i: number) => {
                    const displayName = r.user_display_name ?? r.display_name ?? 'Player';
                    const subtitle = r.user_home_club ?? r.home_club ?? null;
                    const photo = r.user_photo_url ?? null;
                    return (
                      <div
                        key={`${cat}-${r.user_id}-${i}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontFamily: FONT,
                          fontSize: 13,
                          color: 'var(--hcp-t-100)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            minWidth: 22,
                            fontWeight: 700,
                            color: 'var(--hcp-t-60)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {rankEmoji(r.rank)}
                        </span>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '34%',
                            overflow: 'hidden',
                            background:
                              'linear-gradient(135deg, var(--hcp-bg-3), var(--hcp-bg-2))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'var(--hcp-t-60)',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {photo ? (
                            <img
                              src={photo}
                              alt=""
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          ) : (
                            (displayName?.[0] ?? '?').toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontWeight: r.is_self ? 700 : 600,
                              color: r.is_self ? AMBER : 'var(--hcp-t-100)',
                              lineHeight: 1.25,
                            }}
                          >
                            {displayName}
                            {r.is_self ? ' (you)' : ''}
                          </div>
                          {subtitle && (
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--hcp-t-60)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.3,
                                marginTop: 1,
                              }}
                            >
                              {subtitle}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            fontVariantNumeric: 'tabular-nums',
                            color: 'var(--hcp-t-60)',
                            fontSize: 12,
                          }}
                        >
                          {formatLegendValue(cat, r.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GamCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseLegendsDrilldown;
