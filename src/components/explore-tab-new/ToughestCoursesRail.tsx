import { useNavigate } from 'react-router-dom';
import { useNotableDifficultCourses } from '@/hooks/gam/useNotableDifficultCourses';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { SPACE } from '@/lib/spacing';
import { FONT } from './gamingLightTokens';

const numFmt = (n: number | null | undefined, digits = 1) =>
  n == null || Number.isNaN(Number(n)) ? '–' : Number(n).toFixed(digits);

function ToughCard({
  rank,
  courseId,
  courseName,
  avgOverPar,
  totalRounds,
  thumbnail,
}: {
  rank: number;
  courseId: string;
  courseName: string;
  avgOverPar: number;
  totalRounds: number;
  thumbnail: string | null;
}) {
  const navigate = useNavigate();
  const label = rank === 1 ? '#1 TOUGHEST' : `#${rank}`;
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${courseId}`, { state: { activeTab: 'holes' } })}
      className="text-left active:scale-[0.99] transition-transform"
      style={{
        flexShrink: 0,
        width: 210,
        borderRadius: 16,
        background: '#fff',
        border: '1px solid rgba(15,23,42,0.07)',
        padding: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 72,
          background: thumbnail
            ? undefined
            : 'linear-gradient(150deg, #6b8a5a, #3a4a2f)',
        }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            left: 8,
            bottom: 8,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(10,12,16,0.65)',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#fff',
            lineHeight: 1,
          }}
        >
          {label}
        </div>
      </div>
      <div style={{ padding: '11px 14px 13px' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.01em',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {courseName}
        </div>
        <div
          style={{
            marginTop: 7,
            fontSize: 23,
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            color: '#dc2626',
            lineHeight: 1,
          }}
        >
          +{numFmt(avgOverPar, 1)}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            color: '#94A3B8',
            lineHeight: 1.3,
          }}
        >
          avg per round · {totalRounds} rounds
        </div>
      </div>
    </button>
  );
}

export function ToughestCoursesRail() {
  const { data } = useNotableDifficultCourses();
  const rows = data ?? [];
  if (rows.length === 0) return null;
  return (
    <section style={{ marginTop: SPACE.sectionSection }}>
      <DiscoverSectionHeader
        eyebrow="Toughest courses"
        title="Where scores go to die"
      />
      <div
        className="flex overflow-x-auto scrollbar-hide"
        style={{ padding: '0 16px', gap: 9 }}
      >
        {rows.map((c, i) => (
          <ToughCard
            key={c.course_id}
            rank={i + 1}
            courseId={c.course_id}
            courseName={c.course_name}
            avgOverPar={c.avg_over_par}
            totalRounds={c.total_rounds}
            thumbnail={c.thumbnail_image ?? null}
          />
        ))}
      </div>
    </section>
  );
}

export default ToughestCoursesRail;

