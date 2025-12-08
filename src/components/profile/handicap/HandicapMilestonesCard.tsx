import React from 'react';
import { Trophy, TrendingDown, Award } from 'lucide-react';
import type { HandicapMilestones } from '@/lib/mockHandicapData';

interface HandicapMilestonesCardProps {
  milestones: HandicapMilestones;
}

const HandicapMilestonesCard: React.FC<HandicapMilestonesCardProps> = ({ milestones }) => {
  const items = [
    milestones.singleFigure?.achieved && {
      icon: Award,
      label: 'Single-figure achieved',
      value: milestones.singleFigure.index.toFixed(1),
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
    milestones.personalBest && {
      icon: Trophy,
      label: 'Personal best',
      value: `${milestones.personalBest.index.toFixed(1)} on ${new Date(milestones.personalBest.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    milestones.biggestDrop && {
      icon: TrendingDown,
      label: 'Biggest drop',
      value: `${milestones.biggestDrop.delta.toFixed(1)} in ${milestones.biggestDrop.period}`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string; color: string; bgColor: string }[];

  if (items.length === 0) return null;

  return (
    <section className="bg-background border border-border rounded-sq-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Handicap Milestones</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your achievements and personal bests
        </p>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-muted/50 border border-border rounded-sq-md px-4 py-4 flex items-start gap-3"
            >
              <div className={`${item.bgColor} ${item.color} p-2 rounded-sq-sm`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
                <div className="text-sm font-semibold text-foreground mt-0.5 truncate">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HandicapMilestonesCard;
