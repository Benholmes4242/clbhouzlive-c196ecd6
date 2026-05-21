import React from 'react';
import { Users, Activity, BarChart3, MapPin, type LucideIcon } from 'lucide-react';
import type { CourseMeta } from '@/hooks/gam/useCourseMeta';

interface Props {
  meta: CourseMeta | undefined;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const MetaCell: React.FC<{
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}> = ({ icon: Icon, label, value, sub, highlight }) => (
  <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 9,
        fontWeight: 800,
        color: 'var(--hcp-t-40)',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        marginBottom: 4,
      }}
    >
      <Icon size={10} strokeWidth={2.5} />
      {label}
    </div>
    <div
      style={{
        fontSize: 20,
        fontWeight: 900,
        color: highlight ? '#F7931E' : 'var(--hcp-t-100)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          fontSize: 10,
          color: 'var(--hcp-t-60)',
          marginTop: 3,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

const Divider: React.FC = () => (
  <div style={{ width: 1, background: 'var(--hcp-line)', alignSelf: 'stretch', flexShrink: 0 }} />
);

export const CourseMetaStrip: React.FC<Props> = ({ meta }) => {
  const friendRounds = meta?.friend_rounds ?? '—';
  const yourRounds = meta?.your_rounds ?? '—';
  const yourBest = meta?.your_best != null ? `best ${meta.your_best}` : 'no rounds yet';
  const avgOverPar =
    meta?.avg_over_par != null ? `+${Number(meta.avg_over_par).toFixed(1)}` : '—';
  const cr = meta?.course_cr != null ? `CR ${meta.course_cr}` : 'CR —';
  const hardestHole = meta?.hardest_hole;
  const hardestValue = hardestHole ? `H${hardestHole.hole_no}` : '—';
  const hardestSub = hardestHole ? `par ${hardestHole.par} · SI 1` : 'no hole data';

  return (
    <div
      style={{
        margin: '16px 16px 0',
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 14,
        padding: '12px 14px',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: '1px solid var(--hcp-line)',
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <MetaCell icon={Users} label="Friend rounds" value={friendRounds} sub="across community" />
        <Divider />
        <MetaCell
          icon={Activity}
          label="Your rounds"
          value={yourRounds}
          sub={yourBest}
          highlight
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <MetaCell
          icon={BarChart3}
          label="Plays"
          value={avgOverPar}
          sub={`over par · ${cr}`}
        />
        <Divider />
        <MetaCell icon={MapPin} label="Hardest" value={hardestValue} sub={hardestSub} />
      </div>
    </div>
  );
};
