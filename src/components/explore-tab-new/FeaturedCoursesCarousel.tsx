import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useCourseOfTheWeek } from './hooks/useCourseOfTheWeek';

interface FeaturedCoursesCarouselProps {
  onRegionSelect: (slug: string) => void;
}

export function FeaturedCoursesCarousel({ onRegionSelect }: FeaturedCoursesCarouselProps) {
  const navigate = useNavigate();
  const { data: course, isLoading } = useCourseOfTheWeek();

  if (isLoading) {
    return <div className="w-full h-[280px] sm:h-[310px] bg-muted animate-pulse" />;
  }

  if (!course) return null;

  const location = [course.sub_country, course.country].filter(Boolean).join(', ');

  return (
    <div
      className="relative w-full h-[280px] sm:h-[310px] overflow-hidden"
      style={{ background: '#1a1a1a' }}
    >
      {/* Hero image */}
      <img
        src={course.thumbnail_image}
        alt={course.course_name}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay — lighter */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

      {/* Course of the Week eyebrow — canonical liquid-glass */}
      <div className="absolute top-0 left-0 right-0 p-4">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass"
          style={{ border: '1px solid rgba(255,255,255,0.12)', transform: 'rotate(-2deg)' }}
        >
          <span style={{ fontSize: 10 }}>⛳</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
            Course of the Week
          </span>
        </div>
      </div>

      {/* Content — bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1.5">
        {/* Global rank if present */}
        {course.global_rank && (
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>
            #{course.global_rank} in the world
          </p>
        )}

        {/* Course name */}
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
          {course.course_name}
        </h2>

        {/* Location */}
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
          {location}
        </p>

        {/* Bottom row — text rating + explore button (unified visual language) */}
        <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
          {course.avg_rating && (
            <div className="flex items-center gap-1.5">
              <Star className="w-[13px] h-[13px]" style={{ color: '#F7931E', fill: '#F7931E' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
                {Number(course.avg_rating).toFixed(1)}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                ({course.review_count} {course.review_count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          {/* Explore button */}
          <button
            onClick={() => navigate(`/courses/${course.course_id}`)}
            className="active:scale-[0.97] transition-transform liquid-glass"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 18px',
              fontSize: 13,
              fontWeight: 700,
              color: 'white',
              borderRadius: 9999,
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
            }}
          >
            View course →
          </button>
        </div>
      </div>
    </div>
  );
}
