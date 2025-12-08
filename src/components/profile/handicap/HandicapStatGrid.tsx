import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, hint }) => {
  return (
    <div className="bg-muted border border-border rounded-sq-md px-4 py-4 flex flex-col justify-center">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </span>
      <span className="text-2xl font-bold text-foreground tabular-nums">
        {value}
      </span>
      <span className="text-xs text-muted-foreground mt-0.5">
        {hint}
      </span>
    </div>
  );
};

interface HandicapStatGridProps {
  currentIndex: number;
  bestIndex: number;
  threeRoundAverage: number;
  roundsCounted: number;
}

const HandicapStatGrid: React.FC<HandicapStatGridProps> = ({
  currentIndex,
  bestIndex,
  threeRoundAverage,
  roundsCounted,
}) => {
  return (
    <section className="grid grid-cols-2 gap-3">
      <StatCard
        label="Current Handicap"
        value={currentIndex.toFixed(1)}
        hint="Based on last 20 scores"
      />
      <StatCard
        label="Best Handicap"
        value={bestIndex.toFixed(1)}
        hint="Personal best"
      />
      <StatCard
        label="3-Round Average"
        value={threeRoundAverage.toFixed(1)}
        hint="Recent form"
      />
      <StatCard
        label="Rounds Counted"
        value={roundsCounted.toString()}
        hint="Used in index"
      />
    </section>
  );
};

export default HandicapStatGrid;
