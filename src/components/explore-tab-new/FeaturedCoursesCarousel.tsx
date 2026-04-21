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
    return (
      <section style={{ padding: '24px 16px 0' }}>
        <div style={{ padding: '0 0 12px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
            Course of the week
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)', margin: '2px 0 0', fontWeight: 500 }}>
            Editorial pick
          </p>
        </div>
        <div className="w-full h-[260px] sm:h-[290px] bg-muted animate-pulse rounded-[12px]" />
      </section>
    );
  }

  if (!course) return null;

  const location = [course.sub_country, course.country].filter(Boolean).join(', ');

  return (
    <section style={{ padding: '24px 16px 0' }}>
      <div style={{ padding: '0 0 12px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
          Course of the week
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)', margin: '2px 0 0', fontWeight: 500 }}>
          Editorial pick
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/courses/${course.course_id}`)}
        className="relative w-full h-[260px] sm:h-[290px] overflow-hidden block text-left active:scale-[0.99] transition-transform"
        style={{ background: '#1a1a1a', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)' }}
      >
        <img
          src={course.thumbnail_image}
          alt={course.course_name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1.5">
          {course.global_rank && (
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>
              #{course.global_rank} in the world
            </p>
          )}

          <h3 style={{ fontSize: 26, fontWeight: 700, color: 'white', lineHeight: 1.2, letterSpacing: '-0.03em', margin: 0 }}>
            {course.course_name}
          </h3>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 400, margin: 0 }}>
            {location}
          </p>

          {course.avg_rating && (
            <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
              <Star className="w-[13px] h-[13px]" style={{ color: '#F7931E', fill: '#F7931E' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
                {Number(course.avg_rating).toFixed(1)}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                ({course.review_count} {course.review_count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
      </button>
    </section>
  );
}
