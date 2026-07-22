import { useNavigate } from 'react-router-dom';
import { useHardestHoles } from '@/hooks/gam/useHardestHoles';
import { SectionHead } from './SectionHead';
import { FONT } from './gamingLightTokens';

const RED = '#D2222D';
const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.45)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const MAX = 12;

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

const numFmt = (n: number | null | undefined, d = 1) =>
  n == null || Number.isNaN(Number(n)) ? '–' : Number(n).toFixed(d);

function HardestCard({
  courseId,
  courseName,
  holeNo,
  par,
  playsTo,
  rounds,
}: {
  courseId: string;
  courseName: string;
  holeNo: number;
  par: number;
  playsTo: number;
  rounds: number;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${courseId}`, { state: { activeTab: 'holes' } })}
      className="text-left active:scale-[0.99] transition-transform"
      style={{
        flexShrink: 0,
        width: 156,
        minHeight: 138,
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
        className="tabular-nums"
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        {ordinal(holeNo)}
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
          fontSize: 11,
          fontWeight: 600,
          color: RED,
          letterSpacing: '0.02em',
          lineHeight: 1.2,
        }}
      >
        Par {par} · plays to {numFmt(playsTo, 1)}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: MUTE,
          lineHeight: 1.2,
        }}
      >
        {rounds} rounds
      </div>
    </button>
  );
}

export function HardestHolesRail() {
  const { data } = useHardestHoles();
  const rows = (data ?? []).slice(0, MAX);
  if (rows.length === 0) return null;
  return (
    <section style={{ marginTop: 32 }}>
      <SectionHead overline="The hardest holes" title="Where scorecards go to die" />
      <div
        className="flex overflow-x-auto scrollbar-hide"
        style={{ padding: '0 16px', gap: 10 }}
      >
        {rows.map((h) => (
          <HardestCard
            key={`${h.course_id}-${h.hole_no}`}
            courseId={h.course_id}
            courseName={h.course_name}
            holeNo={h.hole_no}
            par={h.par}
            playsTo={h.plays_to}
            rounds={h.rounds}
          />
        ))}
      </div>
    </section>
  );
}

export default HardestHolesRail;
