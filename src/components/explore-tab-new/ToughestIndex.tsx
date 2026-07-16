import { useNavigate } from 'react-router-dom';
import { useNotableDifficultCourses } from '@/hooks/gam/useNotableDifficultCourses';
import { SectionHead } from './SectionHead';
import { FONT } from './gamingLightTokens';

const RED = '#D2222D';
const INK = '#0F172A';
const MUTE = '#94A3B8';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
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
        borderRadius: 14,
        background: CARD_BG,
        border: `0.5px solid ${HAIRLINE}`,
        boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
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
          fontWeight: 800,
          letterSpacing: '0.1em',
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
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.005em',
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
          fontSize: 21,
          fontWeight: 900,
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
          fontSize: 8.5,
          fontWeight: 800,
          letterSpacing: '0.1em',
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
