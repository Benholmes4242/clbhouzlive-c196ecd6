import React from 'react';
import type { RegionInsight } from '@/lib/top100ProgressSelectors';

interface Top100RegionInsightProps {
  insight: RegionInsight | null;
  title?: string;
}

export function Top100RegionInsight({ insight, title = 'Your journey by region' }: Top100RegionInsightProps) {
  return (
    <div className="mt-6 mb-1 flex items-center justify-between">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {insight && (
        <div className="text-xs text-muted-foreground">
          Strongest in{' '}
          <span className="font-semibold text-foreground">
            {insight.region.label}
          </span>
        </div>
      )}
    </div>
  );
}
