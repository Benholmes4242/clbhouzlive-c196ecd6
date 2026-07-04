import React from 'react';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import type { TrajectoryHole } from './TrajectoryLine';
import type { ScorecardTheme } from './scorecardTheme';

const GEIST = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const NUM: React.CSSProperties = {
  fontFamily: GEIST,
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"zero" 0',
};

interface NineGridProps {
  holes: TrajectoryHole[];
  label: 'OUT' | 'IN';
  startAt: number;
  surface: 'light' | 'dark';
  theme: ScorecardTheme;
}

function HoleCell({ h, theme, surface }: { h: TrajectoryHole; theme: ScorecardTheme; surface: 'light' | 'dark' }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <div style={{ ...NUM, fontSize: 9.5, fontWeight: 700, color: theme.faint }}>{h.holeNo}</div>
      <div style={{ ...NUM, fontSize: 9.5, fontWeight: 600, color: theme.ghost }}>{h.par ?? '-'}</div>
      <ScoreMark
        strokes={h.strokes ?? null}
        par={h.par ?? 4}
        size={32}
        fontFamily={GEIST}
        surface={surface}
      />
    </div>
  );
}

export const NineGrid: React.FC<NineGridProps> = ({ holes, label, startAt, surface, theme }) => {
  // Ensure exactly 9 slots when possible; fall back to what we have.
  const cells: TrajectoryHole[] = [];
  for (let i = 0; i < 9; i++) {
    const holeNo = startAt + i;
    const found = holes.find((h) => h.holeNo === holeNo);
    cells.push(found ?? { holeNo, par: null, strokes: null });
  }

  const totalPar = holes.reduce((a, h) => a + (h.par ?? 0), 0);
  const totalStrokes = holes.reduce((a, h) => a + (h.strokes ?? 0), 0);
  const anyPlayed = holes.some((h) => h.strokes != null);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
      <div style={{ display: 'flex', flex: 1, gap: 2 }}>
        {cells.map((h) => <HoleCell key={h.holeNo} h={h} theme={theme} surface={surface} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 34, flexShrink: 0 }}>
        <div style={{ ...NUM, fontSize: 9.5, fontWeight: 800, color: theme.dim, letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ ...NUM, fontSize: 9.5, fontWeight: 600, color: theme.ghost }}>{totalPar || '-'}</div>
        <div style={{
          width: 34, height: 30, borderRadius: 9, background: theme.cellBg, border: `1px solid ${theme.cellLine}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...NUM, fontSize: 14, fontWeight: 800, color: anyPlayed ? theme.ink : theme.ghost,
        }}>
          {anyPlayed ? totalStrokes : '·'}
        </div>
      </div>
    </div>
  );
};

export default NineGrid;
