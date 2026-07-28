/**
 * Top100VerdictExplainerSheet — opened by tapping the verdict band.
 *
 * Required, not optional: the band makes a claim, so a member must be able
 * to see how it was reached. The sheet states the two facts and lets the
 * member draw the conclusion. No formula is shown, no publication is named.
 *
 * Uses the shared BottomSheet primitive; no new sheet primitive.
 *
 * Analytics callsite: top100_rate_prompt_tapped { course_id, source }
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  AMBER,
  HAIRLINE_INK_8,
  INK,
  INK_MUTE,
} from '@/features/courses/_shared/tokens';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

/** Score bands used for the distribution bars. */
const BANDS: { label: string; min: number; max: number }[] = [
  { label: '9-10', min: 9, max: 10.01 },
  { label: '8-9', min: 8, max: 9 },
  { label: '7-8', min: 7, max: 8 },
  { label: '6-7', min: 6, max: 7 },
  { label: '<6', min: -1, max: 6 },
];

interface Props {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  listLabel: string;
  rank: number;
  rating: number;
  ratingCount: number;
  /** Viewer has a tracked round here but has not rated it. */
  canRate: boolean;
  onRate: () => void;
}

export const Top100VerdictExplainerSheet: React.FC<Props> = ({
  open,
  onClose,
  courseId,
  courseName,
  listLabel,
  rank,
  rating,
  ratingCount,
  canRate,
  onRate,
}) => {
  const { t } = useTranslation('courses');

  const { data: distribution = [] } = useQuery({
    queryKey: ['top100-verdict-distribution', courseId],
    enabled: open,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('rating')
        .eq('course_id', courseId)
        .not('rating', 'is', null);
      if (error) throw error;
      const counts = BANDS.map(() => 0);
      for (const row of (data ?? []) as any[]) {
        const value = Number(row.rating);
        const idx = BANDS.findIndex((b) => value >= b.min && value < b.max);
        if (idx >= 0) counts[idx] += 1;
      }
      return counts;
    },
  });

  const maxBand = Math.max(1, ...distribution);

  return (
    <BottomSheet open={open} onClose={onClose} maxHeight="75dvh">
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(75dvh - 30px)' }}>
        <div style={{ padding: '4px 16px 12px', borderBottom: `1px solid ${HAIRLINE_INK_8}` }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>
            {t('top100.verdictSheet.title')}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: INK_MUTE, marginTop: 3 }}>
            {courseName}
          </div>
        </div>

        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, padding: '14px 16px 20px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div
              style={{
                flex: 1,
                border: `1px solid ${HAIRLINE_INK_8}`,
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 19,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.035em',
                }}
              >
                {`#${rank}`}
              </div>
              <div
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(15,23,42,0.42)',
                  marginTop: 4,
                }}
              >
                {listLabel}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                border: `1px solid ${HAIRLINE_INK_8}`,
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 19,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.035em',
                }}
              >
                {rating.toFixed(1)}
              </div>
              <div
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(15,23,42,0.42)',
                  marginTop: 4,
                }}
              >
                {t('top100.verdictSheet.memberRating', { count: ratingCount })}
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: INK,
              lineHeight: 1.5,
              letterSpacing: '-0.005em',
              margin: '14px 0 0',
            }}
          >
            {t('top100.verdictSheet.explanation', {
              rank,
              rating: rating.toFixed(1),
              count: ratingCount,
            })}
          </p>

          {distribution.some((n) => n > 0) && (
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: AMBER,
                  marginBottom: 8,
                }}
              >
                {t('top100.verdictSheet.distribution')}
              </div>
              {BANDS.map((band, i) => (
                <div
                  key={band.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: INK_MUTE,
                      width: 30,
                      flexShrink: 0,
                    }}
                  >
                    {band.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      background: 'rgba(15,23,42,0.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${((distribution[i] ?? 0) / maxBand) * 100}%`,
                        height: '100%',
                        background: AMBER,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: INK_MUTE,
                      width: 18,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {distribution[i] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}

          {canRate && (
            <button
              type="button"
              onClick={() => {
                analyticsEvents.track('top100_rate_prompt_tapped', {
                  course_id: courseId,
                  source: 'verdict_sheet',
                });
                onClose();
                onRate();
              }}
              style={{
                marginTop: 18,
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                background: INK,
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              {t('top100.verdictSheet.rateCta')}
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default Top100VerdictExplainerSheet;
