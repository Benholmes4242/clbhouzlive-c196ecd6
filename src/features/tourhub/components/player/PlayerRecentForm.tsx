/**
 * PlayerRecentForm - Full-width tinted strip with trend icon
 * showing recent form assessment from last 5 results.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePlayerResults } from '../../hooks/usePlayerResults';

interface PlayerRecentFormProps {
  playerId: string;
}

export function PlayerRecentForm({ playerId }: PlayerRecentFormProps) {
  const { data: results, isLoading } = usePlayerResults(playerId, 5);

  if (isLoading || !results || results.length === 0) return null;

  const completedResults = results.filter(r => r.position !== null && r.status !== 'cut' && r.status !== 'MC');
  if (completedResults.length === 0) return null;

  const avgPosition = Math.round(
    completedResults.reduce((sum, r) => sum + (r.position || 0), 0) / completedResults.length
  );

  let formLabel: string;
  let textColor: string;
  let bgColor: string;
  let borderColor: string;
  let Icon: React.ElementType;

  if (avgPosition <= 10) {
    formLabel = avgPosition <= 5 ? 'Excellent' : 'Strong';
    textColor = '#22C55E';
    bgColor = 'rgba(34,197,94,0.08)';
    borderColor = '#22C55E';
    Icon = TrendingUp;
  } else if (avgPosition <= 25) {
    formLabel = 'Steady';
    textColor = 'hsl(var(--muted-foreground))';
    bgColor = 'hsl(var(--muted) / 0.2)';
    borderColor = 'hsl(var(--muted-foreground) / 0.3)';
    Icon = Minus;
  } else {
    formLabel = 'Struggling';
    textColor = '#DC2626';
    bgColor = 'rgba(220,38,38,0.08)';
    borderColor = '#DC2626';
    Icon = TrendingDown;
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: bgColor,
        borderLeft: `3px solid ${borderColor}`,
        borderBottom: '1px solid hsl(var(--border) / 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <Icon style={{ width: '16px', height: '16px', color: textColor, flexShrink: 0 }} />
      <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
        {formLabel} · avg. T{avgPosition} in last {completedResults.length} events
      </span>
    </div>
  );
}
