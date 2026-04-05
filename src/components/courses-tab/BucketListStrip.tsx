import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useBucketListCourses } from '@/hooks/useBucketListCourses';

export function BucketListStrip() {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useBucketListCourses();

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          borderTop: '0.5px solid hsl(var(--border) / 0.15)',
          borderBottom: '0.5px solid hsl(var(--border) / 0.15)',
          padding: '10px 0',
          marginBottom: 4,
        }}
      >
        <div
          style={{
            padding: '0 16px 8px',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#006747',
          }}
        >
          YOUR BUCKET LIST
        </div>
        <div
          className="flex overflow-x-auto"
          style={{ padding: '0 16px', gap: 10, scrollbarWidth: 'none' }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted animate-pulse shrink-0"
              style={{ width: 120, height: 80, borderRadius: 10 }}
            />
          ))}
        </div>
      </div>
    );
  }

  const items = (courses ?? []).slice(0, 8);
  const isEmpty = items.length === 0;

  return (
    <div
      style={{
        background: 'white',
        borderTop: '0.5px solid hsl(var(--border) / 0.15)',
        borderBottom: '0.5px solid hsl(var(--border) / 0.15)',
        padding: '10px 0',
        marginBottom: 4,
      }}
    >
      {/* Section label */}
      <div
        style={{
          padding: '0 16px 8px',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: '#006747',
        }}
      >
        YOUR BUCKET LIST
      </div>

      {/* Horizontal scroll */}
      <div
        className="flex overflow-x-auto"
        style={{
          padding: '0 16px',
          gap: 10,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {isEmpty ? (
          <div
            className="shrink-0 flex flex-col items-center justify-center"
            style={{
              width: 120,
              height: 80,
              borderRadius: 10,
              border: '1.5px dashed hsl(var(--border))',
              gap: 4,
            }}
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span
              style={{
                fontSize: 10,
                color: 'hsl(var(--muted-foreground))',
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              Start your bucket list
            </span>
          </div>
        ) : (
          <>
            {items.map((row: any) => {
              const course = row.golf_courses;
              if (!course) return null;
              const img = course.thumbnail_image;
              const name = course.name;
              const location = course.sub_country || course.country || '';

              return (
                <button
                  key={row.course_id}
                  onClick={() => navigate(`/courses/${row.course_id}`)}
                  className="shrink-0 text-left active:scale-[0.97] transition-transform"
                  style={{ width: 120 }}
                >
                  {/* Image */}
                  <div
                    className="overflow-hidden"
                    style={{ width: 120, height: 80, borderRadius: 10 }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a2a0d] to-[#0d1508]" />
                    )}
                  </div>

                  {/* Body */}
                  <p
                    className="line-clamp-2"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'hsl(var(--foreground))',
                      lineHeight: 1.3,
                      marginTop: 5,
                    }}
                  >
                    {name}
                  </p>
                  {location && (
                    <p
                      style={{
                        fontSize: 10,
                        color: 'hsl(var(--muted-foreground))',
                        marginTop: 1,
                      }}
                    >
                      {location}
                    </p>
                  )}
                </button>
              );
            })}

            {/* "Add more" link */}
            <button
              onClick={() => navigate('/courses')}
              className="shrink-0 self-center active:scale-[0.97] transition-transform"
              style={{
                fontSize: 11,
                color: '#F7931E',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Add more →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
