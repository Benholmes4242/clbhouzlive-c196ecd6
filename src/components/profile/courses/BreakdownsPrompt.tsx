import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDayMonthYearShortGB } from '@/i18n/format';
import { type RatedCourseData } from './my-ratings/myRatingsTiers';
import { A, SANS, LABEL, Panel, Action } from '@/features/courses/components/holes/analytical/tokens';

interface BreakdownsPromptProps {
  missingCount: number;
  courses: RatedCourseData[];
  onTap: (from: 'preview' | 'action') => void;
  variant?: 'breakdowns' | 'review';
}

const TILE_W = 96;
const TILE_H = 68;

/**
 * Page-level "still to rate" prompt at the top of AllCoursesList.
 * Recognition is the prompt: it shows the first three courses rather than a
 * bare count. Analytical panel - no gradient, no glyph tile, no filled pill.
 */
const BreakdownsPrompt: React.FC<BreakdownsPromptProps> = ({
  missingCount,
  courses,
  onTap,
  variant = 'breakdowns',
}) => {
  const { t } = useTranslation('courses');
  if (missingCount === 0) return null;

  const preview = courses.slice(0, 3);
  const remainder = missingCount - preview.length;

  const kicker = t('toRate.kicker', { defaultValue: 'STILL TO RATE' });
  const count = t('toRate.count', {
    count: missingCount,
    defaultValue: '{{count}} courses',
  });

  return (
    <Panel kicker={variant === 'review' ? kicker : kicker} aside={count} style={{ fontFamily: SANS }}>
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: 2,
        }}
      >
        {preview.map((c) => {
          const played = c.last_played_at ? formatDayMonthYearShortGB(new Date(c.last_played_at)) : null;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onTap('preview')}
              style={{
                flex: `0 0 ${TILE_W}px`,
                background: 'transparent',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: SANS,
              }}
            >
              <div
                style={{
                  width: TILE_W,
                  height: TILE_H,
                  borderRadius: 10,
                  background: c.thumbnail_image ? `url(${c.thumbnail_image})` : A.TRACK,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: A.INK,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: TILE_W,
                }}
              >
                {c.name}
              </div>
              {played && (
                <div style={{ ...LABEL, marginTop: 2, letterSpacing: '0.10em' }}>
                  {t('toRate.playedAgo', { ago: played, defaultValue: '{{ago}}' })}
                </div>
              )}
            </button>
          );
        })}

        {remainder > 0 && (
          <button
            type="button"
            onClick={() => onTap('preview')}
            style={{
              flex: `0 0 ${TILE_W}px`,
              height: TILE_H,
              borderRadius: 10,
              border: `1px dashed ${A.DIM}`,
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: SANS,
              ...LABEL,
              color: A.MUTE,
            }}
          >
            {t('toRate.more', { count: remainder, defaultValue: '+{{count}} more' })}
          </button>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <Action
          align="left"
          label={t('toRate.action', { defaultValue: 'Rate them' })}
          onClick={() => onTap('action')}
        />
      </div>
    </Panel>
  );
};

export default BreakdownsPrompt;
