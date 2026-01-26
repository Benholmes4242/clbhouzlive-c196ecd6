import { Flag, Globe, Target } from 'lucide-react';
import { useUserExplorationStatus } from '@/hooks/leaderboards';

interface PassportStripProps {
  userId?: string;
}

interface Milestone {
  count: number;
  title: string;
}

const COUNTRY_MILESTONES: Milestone[] = [
  { count: 5, title: 'Explorer' },
  { count: 10, title: 'Traveller' },
  { count: 20, title: 'Globetrotter' },
  { count: 50, title: 'World Class' },
  { count: 100, title: 'Elite Explorer' },
  { count: 195, title: 'Worldwide Legend' },
];

const getNextMilestone = (currentCount: number): Milestone | null => {
  return COUNTRY_MILESTONES.find(m => m.count > currentCount) || null;
};

export function PassportStrip({ userId }: PassportStripProps) {
  const { data: status, isLoading } = useUserExplorationStatus({ userId });

  if (isLoading) {
    return (
      <div className="mx-4 mt-3">
        <div className="h-24 bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!status || status.countries_count === 0) {
    return (
      <div className="mx-4 mt-3">
        <div className="flex items-center justify-center gap-2 p-5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100/50">
          <Globe className="w-5 h-5 text-teal-600" />
          <span className="text-sm text-teal-700">
            Log a course abroad to start your journey
          </span>
        </div>
      </div>
    );
  }

  const nextMilestone = getNextMilestone(status.countries_count);
  const milestoneDelta = nextMilestone ? nextMilestone.count - status.countries_count : 0;

  return (
    <div className="mx-4 mt-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100/50 p-3 relative overflow-hidden">
      {/* Subtle stamp pattern background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <circle cx="30" cy="30" r="20" stroke="currentColor" fill="none" strokeWidth="2" className="text-teal-600" />
          <circle cx="170" cy="70" r="15" stroke="currentColor" fill="none" strokeWidth="2" className="text-teal-600" />
          <rect x="80" y="20" width="40" height="30" rx="4" stroke="currentColor" fill="none" strokeWidth="2" className="text-teal-600" />
          <circle cx="100" cy="80" r="12" stroke="currentColor" fill="none" strokeWidth="2" className="text-teal-600" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Stats row - two columns, centered */}
        <div className="flex justify-center gap-8 mb-2">
          {/* Countries */}
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-teal-500" />
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">
                {status.countries_count}
                <span className="text-sm font-normal text-slate-400 ml-1">/ 195</span>
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Countries</p>
            </div>
          </div>

          {/* Continents */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-500" />
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">
                {status.continents_count}
                <span className="text-sm font-normal text-slate-400 ml-1">/ 7</span>
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Continents</p>
            </div>
          </div>
        </div>

        {/* Milestone row */}
        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-teal-100/50">
          <Target className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-xs text-slate-600">
            {nextMilestone ? (
              <>
                <span className="font-semibold">{milestoneDelta} more</span> to {nextMilestone.count} countries{' '}
                <span className="text-teal-600 font-semibold">({nextMilestone.title})</span>
              </>
            ) : (
              <span className="font-semibold text-teal-600">All countries explored!</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
