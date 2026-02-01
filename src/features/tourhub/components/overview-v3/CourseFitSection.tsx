/**
 * CourseFitSection - "What It Takes To Win Here"
 * 
 * Design: Inline stat bars on slate-50 background, no card wrapper
 * Per redesign brief: Monochromatic bars with importance labels
 */

import { useNextTournamentPredictions } from '../../hooks/useTournamentPredictions';
import { cn } from '@/lib/utils';

/** Individual stat weight bar */
const StatBar = ({ 
  label, 
  weight, 
  icon 
}: { 
  label: string; 
  weight: number; 
  icon: string;
}) => {
  // Determine importance level text
  const getImportanceLabel = (w: number): { text: string; className: string } => {
    if (w >= 0.35) return { text: 'Critical', className: 'font-bold text-slate-900' };
    if (w >= 0.25) return { text: 'Important', className: 'font-semibold text-slate-700' };
    if (w >= 0.15) return { text: 'Moderate', className: 'font-medium text-slate-500' };
    return { text: 'Minor', className: 'font-normal text-slate-400' };
  };
  
  const importance = getImportanceLabel(weight);
  
  return (
    <div className="flex items-center gap-3 py-2.5">
      {/* Label */}
      <div className="w-24 flex items-center gap-1.5 text-sm text-slate-700">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      
      {/* Bar Track */}
      <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
        <div 
          className="h-full bg-slate-800 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(weight * 100 * 2.5, 100)}%` }}
        />
      </div>
      
      {/* Importance Label */}
      <span className={cn("w-16 text-right text-[12px]", importance.className)}>
        {importance.text}
      </span>
    </div>
  );
};

/** Loading skeleton */
const CourseFitSkeleton = () => (
  <section className="py-8 bg-slate-50">
    <div className="px-4">
      <div className="h-6 w-52 bg-slate-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-6" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
            <div className="flex-1 h-2 bg-slate-200 rounded-full animate-pulse" />
            <div className="w-16 h-4 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export function CourseFitSection() {
  const { data, isLoading } = useNextTournamentPredictions();
  
  if (isLoading) {
    return <CourseFitSkeleton />;
  }
  
  if (!data?.courseProfile) {
    return null;
  }
  
  const { courseProfile, tournament } = data;
  const { statWeights } = courseProfile;
  
  // Sort stats by weight (highest first)
  const sortedStats = [
    { label: 'Distance', weight: statWeights.distance, icon: '💪' },
    { label: 'Accuracy', weight: statWeights.accuracy, icon: '🎯' },
    { label: 'Scrambling', weight: statWeights.scrambling, icon: '🛡️' },
    { label: 'Putting', weight: statWeights.putting, icon: '🕳️' },
  ].sort((a, b) => b.weight - a.weight);
  
  return (
    <section className="py-8 bg-slate-50">
      <div className="px-4">
        {/* Header */}
        <h2 className="text-xl font-bold text-slate-900 mb-1">What It Takes To Win Here</h2>
        <p className="text-[13px] text-slate-500 mb-6">
          Course demands for {tournament.venueName}
        </p>
        
        {/* Stat Bars */}
        <div className="divide-y divide-slate-100">
          {sortedStats.map((stat) => (
            <StatBar
              key={stat.label}
              label={stat.label}
              weight={stat.weight}
              icon={stat.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CourseFitSection;
