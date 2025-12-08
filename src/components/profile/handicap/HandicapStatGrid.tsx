import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, hint }) => {
  return (
    <div className="bg-background border border-border rounded-sq-lg shadow-sm px-4 py-4 h-[100px] flex flex-col justify-center">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-2xl font-bold text-foreground tabular-nums mt-1">
        {value}
      </span>
      <span className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1">
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
