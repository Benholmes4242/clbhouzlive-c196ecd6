import React, { useState, useEffect } from 'react';
import { useSpotlightCourse } from '@/hooks/useSpotlightCourse';

interface CourseSeasonSpotlightProps {
  onCourseClick: (courseId: string) => void;
}

export const CourseSeasonSpotlight: React.FC<CourseSeasonSpotlightProps> = ({ onCourseClick }) => {
  const { data: spotlight, isLoading } = useSpotlightCourse();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (spotlight) {
      const timer = setTimeout(() => setRevealed(true), 200);
      return () => clearTimeout(timer);
    }
  }, [spotlight]);

  if (isLoading || !spotlight) return null;

  const location = [spotlight.city, spotlight.country].filter(Boolean).join(', ');

  return (
    <>
      <style>{`
        @keyframes shimmerAmber {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes stampIn {
          0% { opacity: 0; transform: scale(1.2) rotate(-3deg); }
          60% { transform: scale(0.97) rotate(1deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <button
        onClick={() => onCourseClick(spotlight.course_id)}
        className="active:scale-[0.98] transition-transform"
        style={{
          display: 'block',
          width: '100%',
          borderRadius: 20,
          overflow: 'hidden',
          height: 220,
          position: 'relative',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Background image */}
        {spotlight.image_url ? (
          <img
            src={spotlight.image_url}
            alt={spotlight.course_name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #1a3a2a, #0d1f15)',
            }}
          />
        )}

        {/* Bottom gradient for text readability */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

        {/* Stamp badge */}
        {revealed && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              background: 'hsl(var(--accent-amber))',
              borderRadius: 8,
              padding: '5px 12px',
              display: 'inline-flex',
              gap: 6,
              alignItems: 'center',
              animation: 'stampIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',
            }}
          >
            <span style={{ fontSize: 12 }}>🔥</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#1a0e00', textTransform: 'uppercase' }}>
              This Season's Hottest
            </span>
          </div>
        )}

        {/* Bottom content */}
        {revealed && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              animation: 'fadeUp 0.4s ease 0.4s both',
            }}
          >
            <p style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 4 }}>
              {spotlight.course_name}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
              {location}
            </p>

            {/* HUD glass stat chips */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                🏌️ {spotlight.total_rounds} plays this season
              </div>
              <div
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                ⭐ {spotlight.avg_rating.toFixed(1)} ({spotlight.rating_count})
              </div>
            </div>
          </div>
        )}
      </button>
    </>
  );
};
