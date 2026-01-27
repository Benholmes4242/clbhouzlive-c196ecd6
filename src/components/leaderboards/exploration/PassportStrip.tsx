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
        <div className="flex items-center justify-center gap-2 p-5 bg-gradient-to-br from-[#334E3D]/5 to-[#334E3D]/10 rounded-xl border border-[#334E3D]/10">
          <Globe className="w-5 h-5 text-[#334E3D]" />
          <span className="text-sm text-[#334E3D]">
            Log a course abroad to start your journey
          </span>
        </div>
      </div>
    );
  }

  const nextMilestone = getNextMilestone(status.countries_count);
  const milestoneDelta = nextMilestone ? nextMilestone.count - status.countries_count : 0;

  return (
    <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Stats Row */}
      <div className="flex divide-x divide-gray-100">
        {/* Countries Stat */}
        <div className="flex-1 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flag className="w-4 h-4 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900">
              {status.countries_count}
            </span>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Countries
          </p>
        </div>
        
        {/* Globe Divider Icon */}
        <div className="flex items-center justify-center px-3">
          <Globe className="w-5 h-5 text-gray-300" />
        </div>
        
        {/* Continents Stat */}
        <div className="flex-1 p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-2xl font-bold text-gray-900">
              {status.continents_count}
            </span>
            <span className="text-lg text-gray-400">
              / 7
            </span>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Continents
          </p>
        </div>
      </div>
      
      {/* Next Milestone */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-sm text-gray-600">
            {nextMilestone ? (
              <>
                <span className="font-medium text-emerald-600">
                  {milestoneDelta} more
                </span>
                {' '}to {nextMilestone.count} countries ({nextMilestone.title})
              </>
            ) : (
              <span className="font-semibold text-emerald-600">All countries explored!</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
