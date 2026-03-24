import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBucketListCourses } from '@/hooks/useBucketListCourses';

interface BucketListStripProps {
  onCourseClick: (courseId: string) => void;
}

export const BucketListStrip: React.FC<BucketListStripProps> = ({ onCourseClick }) => {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useBucketListCourses();

  if (isLoading || !courses || courses.length === 0) return null;

  return (
    <div
      style={{
        borderTop: '1px solid hsl(var(--border))',
        borderBottom: '1px solid hsl(var(--border))',
        background: 'hsl(var(--accent-amber) / 0.02)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p
            className="uppercase text-muted-foreground"
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}
          >
            On Your Radar
          </p>
          <p className="text-foreground" style={{ fontSize: 17, fontWeight: 800 }}>
            Bucket List 🎯
          </p>
        </div>
        <button
          onClick={() => navigate('/top100?tab=explore')}
          style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--accent-amber))' }}
        >
          See all ({courses.length}) →
        </button>
      </div>

      {/* Scrollable cards */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          padding: '0 16px 16px',
        }}
      >
        {courses.map((item: any) => {
          const course = item.golf_courses;
          if (!course) return null;
          const agg = Array.isArray(course.course_rating_aggregates)
            ? course.course_rating_aggregates[0]
            : course.course_rating_aggregates;
          const avgScore = agg?.avg_overall_score;
          const location = course.sub_country || course.country || '';

          return (
            <button
              key={item.course_id}
              onClick={() => onCourseClick(item.course_id)}
              className="active:scale-[0.97] transition-transform"
              style={{
                width: 140,
                flexShrink: 0,
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                textAlign: 'left',
                background: 'hsl(var(--card))',
              }}
            >
              {/* Thumbnail */}
              <div style={{ width: 140, height: 90, overflow: 'hidden' }}>
                {course.thumbnail_image ? (
                  <img
                    src={course.thumbnail_image}
                    alt={course.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="bg-muted flex items-center justify-center"
                    style={{ width: '100%', height: '100%' }}
                  >
                    <span className="text-muted-foreground" style={{ fontSize: 9 }}>No img</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '8px 10px 10px' }}>
                <p
                  className="text-foreground"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {course.name}
                </p>
                <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 2 }}>
                  {location}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                  {avgScore != null && (
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'hsl(var(--accent-amber))' }}>
                      {Number(avgScore).toFixed(1)}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'hsl(var(--accent-amber))',
                      background: 'hsl(var(--accent-amber) / 0.1)',
                      borderRadius: 4,
                      padding: '1px 5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Saved
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {/* Add more tile */}
        <button
          onClick={() => navigate('/courses')}
          className="active:scale-[0.97] transition-transform"
          style={{
            width: 100,
            minHeight: 130,
            flexShrink: 0,
            borderRadius: 14,
            border: '1.5px dashed hsl(var(--accent-amber) / 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 22, opacity: 0.5 }}>+</span>
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            Explore courses
          </span>
        </button>
      </div>
    </div>
  );
};
