import React from 'react';
import { useTranslation } from 'react-i18next';
import { type RatedCourseData } from './my-ratings/myRatingsTiers';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';

interface BreakdownsPromptProps {
  missingCount: number;
  courses: RatedCourseData[];
  onTap: (from: 'preview' | 'action') => void;
  variant?: 'breakdowns' | 'review';
}

const TILE = 48;

/**
 * Page-level "still to rate" prompt at the top of AllCoursesList, in the
 * signed-off mock's compact form: a section head with the count in the title,
 * then one row of three thumbnails, a "+n" tile and the action. Names and dates
 * live in the picker sheet, not here.
 */
const BreakdownsPrompt: React.FC<BreakdownsPromptProps> = ({ missingCount, courses, onTap }) => {
  const { t } = useTranslation('courses');
  if (missingCount === 0) return null;

  const preview = courses.slice(0, 3);
  const remainder = missingCount - preview.length;

  return (
    <section data-testid="still-to-rate" style={{ fontFamily: SANS }}>
      <SectionHeader
        tone="amber"
        kicker={t('toRate.kicker', { defaultValue: 'STILL TO RATE' })}
        title={`${missingCount} ${missingCount === 1 ? 'course is' : 'courses are'} waiting`}
      />
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {preview.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-label={c.name}
              onClick={() => onTap('preview')}
              style={{
                width: TILE,
                height: TILE,
                borderRadius: 9,
                border: 0,
                padding: 0,
                cursor: 'pointer',
                background: c.thumbnail_image ? `url(${c.thumbnail_image})` : A.TRACK,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ))}
          {remainder > 0 && (
            <button
              type="button"
              onClick={() => onTap('preview')}
              style={{
                width: TILE,
                height: TILE,
                borderRadius: 9,
                border: '1px dashed rgba(255,255,255,0.22)',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: A.DIM,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {`+${remainder}`}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onTap('action')}
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            fontWeight: 700,
            color: A.AMBER,
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {`${t('toRate.action', { defaultValue: 'Rate them' })} \u203A`}
        </button>
      </div>
    </section>
  );
};

export default BreakdownsPrompt;
