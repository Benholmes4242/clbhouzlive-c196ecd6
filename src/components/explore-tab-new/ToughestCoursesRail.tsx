import { useNavigate } from 'react-router-dom';
import { useNotableDifficultCourses } from '@/hooks/gam/useNotableDifficultCourses';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { FONT } from './gamingLightTokens';

const numFmt = (n: number | null | undefined, digits = 1) =>
  n == null || Number.isNaN(Number(n)) ? '–' : Number(n).toFixed(digits);

function ToughCard({
  rank,
  courseId,
  courseName,
  avgOverPar,
  totalRounds,
}: {
  rank: number;
  courseId: string;
  courseName: string;
  avgOverPar: number;
  totalRounds: number;
}) {
  const navigate = useNavigate();
  const label = rank === 1 ? '#1 TOUGHEST' : `#${rank}`;
  const watermarkSize = rank >= 10 ? 84 : 104;
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${courseId}`, { state: { activeTab: 'holes' } })}
      className="text-left active:scale-[0.99] transition-transform"
      style={{
        position: 'relative',
        flexShrink: 0,
        width: 210,
        height: 150,
        borderRadius: 16,
        background: '#fff',
        border: '1px solid rgba(15,23,42,0.07)',
        overflow: 'hidden',
        padding: '13px 14px',
        cursor: 'pointer',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -18,
          right: -6,
          fontSize: watermarkSize,
          fontWeight: 900,
          color: 'rgba(220,38,38,0.07)',
          letterSpacing: '-0.05em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          pointerEvents: 'none',
        }}
      >
        {rank}
      </div>
      <div
        style={{
          position: 'relative',
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#94A3B8',
          lineHeight: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: 4,
          fontSize: 13.5,
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
          position: 'relative',
          marginTop: 'auto',
          fontSize: 24,
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
          position: 'relative',
          marginTop: 2,
          fontSize: 10,
          color: '#94A3B8',
          lineHeight: 1.3,
        }}
      >
        avg per round · {totalRounds} rounds
      </div>
    </button>
  );
}

export function ToughestCoursesRail() {
  const { data } = useNotableDifficultCourses();
  const rows = data ?? [];
  if (rows.length === 0) return null;
  return (
    <section style={{ marginTop: 4 }}>
      <DiscoverSectionHeader
        eyebrow="Toughest courses"
        title="The sternest tests in golf"
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
          />
        ))}
      </div>
    </section>
  );
}

export default ToughestCoursesRail;

