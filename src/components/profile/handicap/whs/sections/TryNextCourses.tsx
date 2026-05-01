import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTryNextCourses, type TryNextCourse } from '@/lib/whs/hooks';
import SectionHeader from './SectionHeader';

interface Props {
  userId: string;
  countryCode?: string | null;
}

const HAIRLINE = '1px solid rgba(15,23,42,0.10)';
const SURFACE_TONE = '#FAFAF7';
const AMBER = '#F7931E';
const AMBER_DEEP = '#9A6116';

const COUNTRY_NAMES: Record<string, string> = {
  GB: 'UK',
  IE: 'Ireland',
  US: 'US',
  AU: 'Australia',
};

function countryName(code: string | null | undefined): string {
  if (!code) return 'top';
  return COUNTRY_NAMES[code] ?? code;
}

const SkeletonTile: React.FC = () => (
  <div
    className="animate-pulse"
    style={{
      flex: '0 0 200px',
      height: 100,
      borderRadius: 12,
      background: 'rgba(15,23,42,0.06)',
    }}
  />
);

export const TryNextCourses: React.FC<Props> = ({ userId, countryCode = 'GB' }) => {
  const { data, isLoading } = useTryNextCourses(userId, countryCode);

  if (!isLoading && (!data || data.length === 0)) return null;

  const sub = isLoading
    ? 'Loading...'
    : `Top-ranked ${countryName(countryCode)} courses you haven't played yet`;

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        eyebrow="Try Next"
        title="Courses worth chasing"
        sub={sub}
      />
      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 10,
          padding: '0 20px 8px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonTile key={i} />)
          : (data ?? []).map((c: TryNextCourse) => {
              const whyText = c.course_type
                ? `${c.course_type.charAt(0).toUpperCase()}${c.course_type.slice(1)} · Top 100`
                : 'Top 100 in country';
              return (
                <div
                  key={c.id}
                  style={{
                    flex: '0 0 200px',
                    padding: '14px 14px 12px',
                    borderRadius: 12,
                    background: SURFACE_TONE,
                    border: HAIRLINE,
                    position: 'relative',
                    scrollSnapAlign: 'start',
                  }}
                >
                  {c.country_rank !== null && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        fontSize: 9,
                        fontWeight: 900,
                        color: AMBER,
                        letterSpacing: '0.10em',
                      }}
                    >
                      #{c.country_rank}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      fontFamily: 'Georgia, serif',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.15,
                      color: '#0F172A',
                      paddingRight: 36,
                      marginBottom: 4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.name}
                  </div>
                  {c.region && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#64748B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.region}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      gap: 5,
                      alignItems: 'center',
                    }}
                  >
                    <Sparkles size={10} color={AMBER} fill={AMBER} />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: AMBER_DEEP,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {whyText}
                    </span>
                  </div>
                </div>
              );
            })}
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
};

export default TryNextCourses;
