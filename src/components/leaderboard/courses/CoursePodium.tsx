import React from 'react';

interface Course {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_url: string | null;
  avg_rating: number | null;
  times_played: number;
  rank_change: number;
}

interface Props {
  courses: Course[];
  sort: 'most_played' | 'highest_rated' | 'rising';
  seasonColor?: string;
  onCourseClick: (courseId: string) => void;
}

const location = (c: Course) => {
  const parts = [c.sub_country, c.country].filter(Boolean);
  return parts.join(', ') || '';
};

export const CoursePodium: React.FC<Props> = ({ courses, sort, seasonColor, onCourseClick }) => {
  if (courses.length < 3) return null;

  const first = courses[0];
  const second = courses[1];
  const third = courses[2];

  const metricLabel = sort === 'most_played' ? 'played' : 'rating';

  const getMetric = (c: Course, s: typeof sort) => {
    if (s === 'most_played') return c.times_played;
    if (s === 'rising' && c.rank_change > 0) return `+${c.rank_change}`;
    return c.avg_rating?.toFixed(1) || '-';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 12px' }}>
      {/* 1st place — full-width hero card */}
      <button
        onClick={() => onCourseClick(first.course_id)}
        style={{
          display: 'block', width: '100%', borderRadius: 16, overflow: 'hidden',
          position: 'relative', height: 'clamp(180px,48vw,220px)',
          cursor: 'pointer', textAlign: 'left', border: 'none', padding: 0,
          background: '#1a1a2e',
        }}
        className="active:scale-[0.98] transition-transform"
      >
        {first.thumbnail_url ? (
          <img
            src={first.thumbnail_url}
            alt={first.course_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#2d2d30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#666', fontSize: 12 }}>No image</span>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Rank badge top-left */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          width: 'clamp(26px,7vw,32px)', height: 'clamp(26px,7vw,32px)',
          borderRadius: '50%', background: '#F7931E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 'clamp(13px,3.5vw,16px)',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          1
        </div>

        {/* Crown top-right */}
        <div style={{
          position: 'absolute', top: 8, right: 10,
          fontSize: 'clamp(22px,6vw,28px)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}>
          👑
        </div>

        {/* Course name + location bottom-left */}
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 96 }}>
          <div style={{
            color: '#fff', fontSize: 'clamp(16px,4.5vw,20px)', fontWeight: 800,
            lineHeight: 1.2, fontFamily: 'DM Sans, system-ui, sans-serif',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {first.course_name}
          </div>
          <div style={{ marginTop: 2, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(11px,3vw,13px)' }}>
              {location(first)}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'clamp(10px,2.6vw,12px)', marginTop: 1 }}>
              Played by {first.times_played}
            </div>
          </div>
        </div>

        {/* Rating bottom-right */}
        <div style={{
          position: 'absolute', bottom: 12, right: 14,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        }}>
          <span style={{
            color: '#F7931E', fontSize: 'clamp(22px,6vw,28px)', fontWeight: 800,
            fontFamily: 'DM Sans, system-ui, sans-serif',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)', lineHeight: 1,
          }}>
            {getMetric(first, sort)}
          </span>
          {metricLabel === 'rating' && (
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 }}>/10</span>
          )}
        </div>
      </button>

      {/* 2nd + 3rd — side by side */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { course: second, rank: 2, badgeBg: '#9CA3AF' },
          { course: third, rank: 3, badgeBg: '#C4956A' },
        ].map(({ course, rank, badgeBg }) => (
          <button
            key={course.course_id}
            onClick={() => onCourseClick(course.course_id)}
            style={{
              flex: 1, borderRadius: 14, overflow: 'hidden', position: 'relative',
              height: 'clamp(130px,35vw,160px)', cursor: 'pointer',
              border: 'none', padding: 0, background: '#1a1a2e', textAlign: 'left',
            }}
            className="active:scale-[0.97] transition-transform"
          >
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.course_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#2d2d30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#666', fontSize: 11 }}>No image</span>
              </div>
            )}

            {/* Bottom gradient */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
              pointerEvents: 'none',
            }} />

            {/* Rank badge */}
            <div style={{
              position: 'absolute', top: 8, left: 8,
              width: 'clamp(20px,5.5vw,25px)', height: 'clamp(20px,5.5vw,25px)',
              borderRadius: '50%', background: badgeBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 'clamp(10px,2.8vw,13px)',
              fontFamily: 'DM Sans, system-ui, sans-serif',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            }}>
              {rank}
            </div>

            {/* Name + location */}
            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 48 }}>
              <div style={{
                color: '#fff', fontSize: 'clamp(12px,3.3vw,14px)', fontWeight: 700,
                lineHeight: 1.2, fontFamily: 'DM Sans, system-ui, sans-serif',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {course.course_name.split('(')[0].trim()}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(10px,2.6vw,11px)',
                marginTop: 1, fontFamily: 'DM Sans, system-ui, sans-serif',
              }}>
                {location(course)}
              </div>
            </div>

            {/* Rating bottom-right */}
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
            }}>
              <span style={{
                color: '#F7931E', fontSize: 'clamp(15px,4vw,18px)', fontWeight: 800,
                fontFamily: 'DM Sans, system-ui, sans-serif',
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}>
                {getMetric(course, sort)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
