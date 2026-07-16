import { useNavigate } from 'react-router-dom';
import { useNotableDifficultCourses } from '@/hooks/gam/useNotableDifficultCourses';
import { SectionHead } from './SectionHead';
import { FONT } from './gamingLightTokens';

const RED = '#D2222D';
const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.45)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const MAX = 8;

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
  const isTop = rank === 1;
  const label = isTop ? '#1 TOUGHEST' : `#${rank}`;
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${courseId}`, { state: { activeTab: 'holes' } })}
      className="text-left active:scale-[0.99] transition-transform"
      style={{
        flexShrink: 0,
        width: 148,
        minHeight: 130,
        borderRadius: 12,
        background: CARD_BG,
        border: `0.5px solid ${HAIRLINE}`,
        boxShadow: CARD_SHADOW,
        padding: '11px 12px 10px',
        cursor: 'pointer',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: isTop ? RED : MUTE,
          lineHeight: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 12.5,
          fontWeight: 600,
          color: INK,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          minHeight: 30,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {courseName}
      </div>
      <div
        className="tabular-nums"
        style={{
          marginTop: 'auto',
          fontSize: 20,
          fontWeight: 700,
          color: RED,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        +{numFmt(avgOverPar, 1)}
      </div>
      <div
        style={{
          marginTop: 5,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: MUTE,
          lineHeight: 1.2,
        }}
      >
        AVG · {totalRounds} ROUNDS
      </div>
    </button>
  );
}

export function ToughestIndex() {
  const { data } = useNotableDifficultCourses();
  const rows = (data ?? []).slice(0, MAX);
  if (rows.length === 0) return null;
  return (
    <section style={{ marginTop: 32 }}>
      <SectionHead overline="Course index" title="The sternest tests" />
      <div
        className="flex overflow-x-auto scrollbar-hide"
        style={{ padding: '0 16px', gap: 10 }}
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

export default ToughestIndex;
