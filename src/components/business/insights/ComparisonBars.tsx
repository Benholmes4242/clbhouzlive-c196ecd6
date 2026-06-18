import { memo } from 'react';
import { BIZ } from '@/components/business/businessTokens';

interface ComparisonRow {
  label: string;
  value: number;
}

interface ComparisonBarsProps {
  rows: ComparisonRow[];
  emptyCopy?: string;
}

function ComparisonBarsInner({ rows, emptyCopy = 'No activity yet in this period' }: ComparisonBarsProps) {
  const total = rows.reduce((acc, r) => acc + (r.value ?? 0), 0);
  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center py-8"
        style={{ color: BIZ.inkMute, fontSize: '0.85rem' }}
      >
        {emptyCopy}
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => r.value ?? 0), 1);

  return (
    <div className="space-y-3 pt-1">
      {rows.map((r) => {
        const pct = ((r.value ?? 0) / max) * 100;
        return (
          <div key={r.label}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[0.8rem]" style={{ color: BIZ.ink }}>
                {r.label}
              </span>
              <span
                className="text-[0.85rem] font-semibold tabular-nums"
                style={{ color: BIZ.ink, fontFeatureSettings: '"kern" 1, "liga" 1' }}
              >
                {(r.value ?? 0).toLocaleString()}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: BIZ.fill }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: BIZ.amber }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(ComparisonBarsInner);
