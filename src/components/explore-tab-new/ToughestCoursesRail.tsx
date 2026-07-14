import { useNavigate } from 'react-router-dom';
import { useNotableDifficultCourses } from '@/hooks/gam/useNotableDifficultCourses';
import { CARD_BORDER, CARD_RADIUS, FONT } from './gamingLightTokens';

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
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${courseId}`, { state: { activeTab: 'holes' } })}
      className="text-left active:scale-[0.99] transition-transform"
      style={{
        flexShrink: 0,
        width: 200,
        borderRadius: CARD_RADIUS,
        background: '#fff',
        border: CARD_BORDER,
        padding: '13px 14px',
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
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
          marginTop: 6,
          fontSize: 13,
          fontWeight: 800,
          color: '#0F172A',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {courseName}
      </div>
      <div
        style={{
          marginTop: 10,
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
    </button>
  );
}

export function ToughestCoursesRail() {
  const { data } = useNotableDifficultCourses();
  const rows = data ?? [];
  if (rows.length === 0) return null;
  return (
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
  );
}

export default ToughestCoursesRail;
