import React, { useState } from 'react';

type Tab = { key: 'index' | 'threeRoundAvg' | 'best' | 'rounds'; label: string };

export default function AnalyticsTabs({
  tabs, renderChart
}: {
  tabs: Tab[];
  renderChart: (key: Tab['key']) => React.ReactNode;
}) {
  const [active, setActive] = useState<Tab['key']>('index');
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`px-3 py-1 rounded-full text-sm ${active === t.key ? 'bg-foreground text-background' : 'bg-muted-foreground/10'}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {renderChart(active)}
    </div>
  );
}