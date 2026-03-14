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

  const completedResults = results.filter(r => {
    const s = r.status?.toUpperCase();
    return r.position !== null && s !== 'CUT' && s !== 'MC' && s !== 'WD';
  });

  // All recent results were cuts — show a specific indicator
  if (completedResults.length === 0) {
    const cutCount = results.filter(r => r.status?.toUpperCase() === 'CUT').length;
    if (cutCount === 0) return null;
    return (
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'hsl(var(--muted) / 0.2)',
          borderLeft: '3px solid hsl(var(--muted-foreground) / 0.3)',
          borderBottom: '1px solid hsl(var(--border) / 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <TrendingDown style={{ width: 16, height: 16, color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
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
  let bgColor: string;
  let borderColor: string;
  let Icon: React.ElementType;

  if (avgPosition <= 5) {
    formLabel = 'On fire';
    textColor = 'hsl(var(--accent-amber))';
    bgColor = 'hsl(var(--accent-amber) / 0.08)';
    borderColor = 'hsl(var(--accent-amber))';
    Icon = TrendingUp;
  } else if (avgPosition <= 10) {
    formLabel = 'In form';
    textColor = 'hsl(var(--accent-amber))';
    bgColor = 'hsl(var(--accent-amber) / 0.08)';
    borderColor = 'hsl(var(--accent-amber))';
    Icon = TrendingUp;
  } else if (avgPosition <= 25) {
    formLabel = 'Steady';
    textColor = 'hsl(var(--muted-foreground))';
    bgColor = 'hsl(var(--muted) / 0.2)';
    borderColor = 'hsl(var(--muted-foreground) / 0.3)';
    Icon = Minus;
  } else {
    formLabel = 'Out of form';
    textColor = 'hsl(var(--muted-foreground))';
    bgColor = 'hsl(var(--muted) / 0.2)';
    borderColor = 'hsl(var(--muted-foreground) / 0.3)';
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
        {formLabel} · avg. finish: {avgPosition} over last {completedResults.length} {completedResults.length === 1 ? 'event' : 'events'}
      </span>
    </div>
  );
}
