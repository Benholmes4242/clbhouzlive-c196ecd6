import { useUserExplorationStatus } from '@/hooks/leaderboards';
import { Globe, Map, Flag } from 'lucide-react';

interface ExplorationProgressStripProps {
  userId?: string;
}

export function ExplorationProgressStrip({ userId }: ExplorationProgressStripProps) {
  const { data: status, isLoading } = useUserExplorationStatus({ userId });

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <div className="h-12 bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!status || status.countries_count === 0) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-2 p-4 bg-teal-50 rounded-xl border border-teal-100">
          <Globe className="w-5 h-5 text-teal-600" />
          <span className="text-sm text-teal-700">
            Log a course abroad to start your journey
          </span>
        </div>
      </div>
    );
  }

  // Determine next milestone
  const getNextMilestone = () => {
    const milestones = [5, 10, 20, 50, 100, 150, 195];
    const next = milestones.find(m => m > status.countries_count);
    if (next) {
      return `${next - status.countries_count} more to ${next} countries`;
    }
    return 'All countries explored!';
  };

  return (
    <div className="px-4 py-3">
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100/50">
        <div className="flex items-center justify-center gap-8">
          {/* Countries */}
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-teal-600" />
            <div>
              <div className="text-sm font-semibold text-foreground">
                {status.countries_count}
              </div>
              <div className="text-[10px] text-muted-foreground">Countries</div>
            </div>
          </div>

          {/* Continents */}
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-teal-600" />
            <div>
              <div className="text-sm font-semibold text-foreground">
                {status.continents_count} / 6
              </div>
              <div className="text-[10px] text-muted-foreground">Continents</div>
            </div>
          </div>
        </div>

        {/* Next milestone hint */}
        <div className="mt-3 pt-3 border-t border-teal-200/50">
          <div className="text-xs text-teal-700 text-center">
            🎯 {getNextMilestone()}
          </div>
        </div>
      </div>
    </div>
  );
}
