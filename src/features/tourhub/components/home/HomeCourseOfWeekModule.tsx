/**
 * HomeCourseOfWeekModule — Phase 2.
 * Reuses useEditorialCards.courseOfWeekCard data; renders a card-on-light-surface module.
 */
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Star } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useEditorialCards } from '@/components/media-system/hooks/useEditorialCards';

const AMBER = '#F7931E';
const INK = '#0F172A';
const INK_SOFT = 'rgba(15,23,42,0.62)';
const INK_FAINT = 'rgba(15,23,42,0.45)';
const HAIRLINE = 'rgba(15,23,42,0.10)';
const AMBER_SOFT = 'rgba(247,147,30,0.12)';

export function HomeCourseOfWeekModule() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const { courseOfWeekCard } = useEditorialCards(session?.user?.id);

  if (!courseOfWeekCard?.cardData?.course) return null;
  const c = courseOfWeekCard.cardData.course;

  const goCourse = () => navigate(`/courses/${c.id}`);

  return (
    <section style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10.5,
            fontWeight: 800,
            color: AMBER,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <MapPin size={11} strokeWidth={2.4} />
          Course of the Week
        </span>
        <button
          onClick={goCourse}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 12,
            fontWeight: 700,
            color: AMBER,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          View course
          <ChevronRight size={14} strokeWidth={2.4} />
        </button>
      </div>

      <button
        onClick={goCourse}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          textAlign: 'left',
          background: '#FFFFFF',
          borderRadius: 14,
          border: `0.5px solid ${HAIRLINE}`,
          padding: 12,
          cursor: 'pointer',
        }}
      >
        {c.thumbnailImage ? (
          <img
            src={c.thumbnailImage}
            alt=""
            style={{ width: 80, height: 80, borderRadius: 18, objectFit: 'cover', flexShrink: 0, background: '#eee' }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 18,
              background: AMBER_SOFT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MapPin size={24} color={AMBER} strokeWidth={2} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: INK, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {c.name}
          </div>
          <div style={{ marginTop: 3, fontSize: 12, color: INK_SOFT, fontWeight: 500 }}>
            {[c.subCountry, c.country].filter(Boolean).join(' · ')}
          </div>
          {c.communityRating != null && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Star size={12} fill={AMBER} stroke={AMBER} />
              <span style={{ fontSize: 13, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                {c.communityRating.toFixed(1)}
              </span>
              <span style={{ fontSize: 11, color: INK_FAINT, fontWeight: 400 }}>
                ({c.reviewCount} review{c.reviewCount === 1 ? '' : 's'})
              </span>
            </div>
          )}
        </div>
      </button>
    </section>
  );
}

export default HomeCourseOfWeekModule;
