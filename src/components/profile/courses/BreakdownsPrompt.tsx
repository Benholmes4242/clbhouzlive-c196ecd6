import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { type RatedCourseData } from './my-ratings/myRatingsTiers';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { Button } from '@/components/ui/button';
import { playDateStandalone } from '@/components/explore-tab-new/courseled/discoverWhen';

interface BreakdownsPromptProps {
  missingCount: number;
  courses: RatedCourseData[];
  onTap: (from: 'preview' | 'action') => void;
  variant?: 'breakdowns' | 'review';
}

export const STILL_TO_RATE_CAP = 12;

/**
 * Named tiles, scrolled. The photograph alone could not tell a member which
 * course it was — eleven unrated courses and not one of them identifiable. The
 * name and the date played are the information here; the picture is
 * decoration. Every unrated course is in the scroller up to the cap, so there
 * is no remainder tile to place.
 */
const BreakdownsPrompt: React.FC<BreakdownsPromptProps> = ({ missingCount, courses, onTap }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  if (missingCount === 0) return null;

  const tiles = courses.slice(0, STILL_TO_RATE_CAP);
  const capped = missingCount > STILL_TO_RATE_CAP;

  return (
    <section data-testid="still-to-rate">
      <SectionHeader
        className="archive-heading"
        tone="amber"
        kicker={t('toRate.kicker', { defaultValue: 'STILL TO RATE' })}
        title={`${missingCount} ${missingCount === 1 ? 'course is' : 'courses are'} waiting`}
      />
      <div
        className="still-to-rate-scroller"
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style>{`.still-to-rate-scroller::-webkit-scrollbar{display:none}`}</style>
        {tiles.map((c) => (
          <button
            key={c.id}
            type="button"
            data-testid="still-to-rate-tile"
            aria-label={c.name}
            // Same destination as the matching row in BreakdownsPickerSheet.
            onClick={() => navigate(`/courses/${c.id}/rate`)}
            style={{ width: 100, flexShrink: 0, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <div
              style={{
                width: 100,
                height: 68,
                borderRadius: 9,
                backgroundImage: c.thumbnail_image ? `url(${c.thumbnail_image})` : undefined,
                backgroundColor: A.TRACK,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                fontWeight: 700,
                color: A.INK,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {c.name}
            </div>
            <div style={{ marginTop: 2, fontSize: 10, color: A.DIM }}>
              {playDateStandalone(c.review_date ?? c.last_played_at)}
            </div>
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        className="archive-control"
        type="button"
        onClick={() => onTap('action')}
        style={{
          marginTop: 12,
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
        {capped ? `Rate all ${missingCount} \u203A` : `${t('toRate.action', { defaultValue: 'Rate them' })} \u203A`}
      </Button>
    </section>
  );
};

export default BreakdownsPrompt;
