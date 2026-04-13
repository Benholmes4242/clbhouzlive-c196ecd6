/**
 * PlayerRecentForm - Dispatch left-rule strip showing recent form.
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

  // All recent results were cuts
  if (completedResults.length === 0) {
    const cutCount = results.filter(r => r.status?.toUpperCase() === 'CUT').length;
    if (cutCount === 0) return null;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 14px',
        background: 'rgba(15,23,42,0.03)',
        borderLeft: '3px solid rgba(15,23,42,0.15)',
        borderBottom: '0.5px solid rgba(15,23,42,0.07)',
      }}>
        <TrendingDown style={{ width: 14, height: 14, color: '#94A3B8', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
          Out of form · missed last {cutCount} {cutCount === 1 ? 'cut' : 'cuts'}
        </span>
      </div>
    );
  }

  const avgPosition = Math.round(
    completedResults.reduce((sum, r) => sum + (r.position || 0), 0) / completedResults.length
  );

  let formLabel: string;
  let textColor: string;
  let Icon: React.ElementType;

  if (avgPosition <= 5) {
    formLabel = 'On fire';
    textColor = '#F7931E';
    Icon = TrendingUp;
  } else if (avgPosition <= 10) {
    formLabel = 'In form';
    textColor = '#F7931E';
    Icon = TrendingUp;
  } else if (avgPosition <= 25) {
    formLabel = 'Steady';
    textColor = '#94A3B8';
    Icon = Minus;
  } else {
    formLabel = 'Out of form';
    textColor = '#94A3B8';
    Icon = TrendingDown;
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 14px',
      background: avgPosition <= 10 ? 'rgba(247,147,30,0.05)' : 'rgba(15,23,42,0.03)',
      borderLeft: `3px solid ${avgPosition <= 10 ? '#F7931E' : 'rgba(15,23,42,0.15)'}`,
      borderBottom: '0.5px solid rgba(15,23,42,0.07)',
    }}>
      <Icon style={{ width: 14, height: 14, color: textColor, flexShrink: 0 }} />
      <span style={{ fontSize: '12px', fontWeight: 700, color: textColor }}>
        {formLabel}
      </span>
      <span style={{ fontSize: '12px', color: '#64748B' }}>
        · avg. finish: {avgPosition} over last {completedResults.length} events
      </span>
    </div>
  );
}
