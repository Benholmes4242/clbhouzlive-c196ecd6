/**
 * CourseOfTheWeekV4 — full-width photo card with bottom scrim + amber score
 * pill. Data source: useEditorialCards.courseOfWeekCard.
 * Does NOT mount HomeCourseOfWeekModule.
 */

import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useEditorialCards } from '@/components/media-system/hooks/useEditorialCards';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';

export function CourseOfTheWeekV4() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const { courseOfWeekCard } = useEditorialCards(session?.user?.id);
  if (!courseOfWeekCard?.cardData?.course) return null;
  const c = courseOfWeekCard.cardData.course;

  return (
    <SectionShell eyebrow="Course of the week" linkLabel="View course" onLinkClick={() => navigate(`/courses/${c.id}`)}>
      <div style={{ padding: '0 20px' }}>
        <button
          onClick={() => navigate(`/courses/${c.id}`)}
          style={{
            position: 'relative',
            width: '100%',
            height: 168,
            borderRadius: V4.cardRadius,
            overflow: 'hidden',
            border: `0.5px solid ${V4.cardBorder}`,
            boxShadow: V4.cardShadow,
            padding: 0,
            cursor: 'pointer',
            background: c.thumbnailImage ? `url(${c.thumbnailImage}) center/cover` : '#15171F',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.72) 100%)',
            }}
          />
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, textAlign: 'left' }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: '#FBD38D', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Feature
            </div>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 19, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.name}
              </div>
              {c.communityRating != null ? (
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', borderRadius: 999,
                    background: V4.amber, color: V4.ink,
                    fontSize: 12, fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <Star size={11} fill={V4.ink} stroke={V4.ink} />
                  {c.communityRating.toFixed(1)}
                </span>
              ) : null}
            </div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>
              {[c.subCountry, c.country].filter(Boolean).join(' · ')}
            </div>
          </div>
        </button>
      </div>
    </SectionShell>
  );
}
