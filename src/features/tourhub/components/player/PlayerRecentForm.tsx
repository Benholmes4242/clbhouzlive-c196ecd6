/**
 * PlayerRecentForm - Stat strip showing form label + avg finish + dot sparkline.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePlayerResults } from '../../hooks/usePlayerResults';

interface PlayerRecentFormProps {
  playerId: string;
}

export function PlayerRecentForm({ playerId }: PlayerRecentFormProps) {
  const { data: results, isLoading } = usePlayerResults(playerId, 5);

  if (isLoading || !results || results.length === 0) return null;

  const completedResults = results.filter(r => {
    const s = r.status?.toUpperCase();
    return r.position !== null && s !== 'CUT' && s !== 'MC' && s !== 'WD';
  });

  if (completedResults.length === 0) {
    const cutCount = results.filter(r => r.status?.toUpperCase() === 'CUT').length;
    if (cutCount === 0) return null;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 20px',
        background: '#F8FAFC',
        borderBottom: '0.5px solid rgba(15,23,42,0.07)',
      }}>
        <TrendingDown style={{ width: 16, height: 16, color: '#94A3B8', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#94A3B8', letterSpacing: '-0.02em' }}>Out of form</div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: 1 }}>
            missed last {cutCount} {cutCount === 1 ? 'cut' : 'cuts'}
          </div>
        </div>
      </div>
    );
  }

  const avgPosition = Math.round(
    completedResults.reduce((sum, r) => sum + (r.position || 0), 0) / completedResults.length
  );

  let formLabel: string;
  let textColor: string;
  let Icon: React.ElementType;
  let bgChip: string;

  if (avgPosition <= 5) {
    formLabel = 'On fire';
    textColor = '#F7931E';
    Icon = TrendingUp;
    bgChip = 'rgba(247,147,30,0.1)';
  } else if (avgPosition <= 10) {
    formLabel = 'In form';
    textColor = '#F7931E';
    Icon = TrendingUp;
    bgChip = 'rgba(247,147,30,0.1)';
  } else if (avgPosition <= 25) {
    formLabel = 'Steady';
    textColor = '#94A3B8';
    Icon = Minus;
    bgChip = 'rgba(15,23,42,0.06)';
  } else {
    formLabel = 'Out of form';
    textColor = '#DC2626';
    Icon = TrendingDown;
    bgChip = 'rgba(220,38,38,0.08)';
  }

  const getDotColor = (pos: number) => {
    if (pos <= 10) return '#F7931E';
    if (pos <= 25) return '#94A3B8';
    return '#DC2626';
  };

  return (
    <div style={{
      padding: '12px 20px',
      background: '#F8FAFC',
      borderBottom: '0.5px solid rgba(15,23,42,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left — icon + label + avg */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon style={{ width: 16, height: 16, color: textColor, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: textColor, letterSpacing: '-0.02em' }}>
              {formLabel}
            </div>
            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: 1 }}>
              avg. finish T{avgPosition} · last {completedResults.length} events
            </div>
          </div>
        </div>

        {/* Right — dot sparkline of recent finishes */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
          {completedResults.map((r, i) => {
            const pos = r.position || 0;
            const dotColor = getDotColor(pos);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
                <div style={{ fontSize: '7px', fontWeight: 700, color: dotColor, fontVariantNumeric: 'tabular-nums' }}>
                  {pos <= 9 ? `T${pos}` : String(pos)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
