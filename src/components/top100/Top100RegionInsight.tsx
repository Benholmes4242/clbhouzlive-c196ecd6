import React from 'react';
import type { RegionInsight } from '@/lib/top100ProgressSelectors';

interface Top100RegionInsightProps {
  insight: RegionInsight | null;
  title?: string;
}

export function Top100RegionInsight({ insight, title = 'Your journey by region' }: Top100RegionInsightProps) {
  return (
    <div className="mt-6 mb-3">
      <h3 className="text-base font-semibold text-foreground">
        {title}
      </h3>
    </div>
  );
}
