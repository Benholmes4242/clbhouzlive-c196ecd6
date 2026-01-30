/**
 * SeasonLeaders - Tour-specific leaders in Wins, Earnings, Scoring
 * Tabbed interface with leader cards
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonLeaders } from '../../hooks/useOverviewModules';
import { TourId, TOUR_CONFIG } from '../../hooks/useOverviewData';
import { getTourLogo } from '../../utils/tourLogos';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const TOUR_TABS: TourId[] = ['pga', 'euro', 'lpga', 'liv'];

function LeaderCard({
  label,
  bgClass,
  textClass,
  leader,
}: {
  label: string;
  bgClass: string;
  textClass: string;
  leader: { firstName: string; lastName: string; photoUrl: string | null; value: number } | null;
}) {
  if (!leader) {
    return (
      <div className={cn("rounded-xl p-3 text-center", bgClass)}>
        <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", textClass)}>
          {label}
        </p>
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 mb-2" />
        <p className="text-sm text-slate-400">—</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl p-3 text-center", bgClass)}>
      <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", textClass)}>
        {label}
      </p>
      <div className="w-12 h-12 mx-auto rounded-full overflow-hidden bg-slate-200 mb-2">
        {leader.photoUrl ? (
          <img src={leader.photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-300">
            <span className="text-sm font-bold text-slate-500">
              {leader.firstName[0]}{leader.lastName[0]}
            </span>
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-900 truncate">
        {leader.lastName}
      </p>
      <p className={cn("text-lg font-bold", textClass)}>
        {label === 'Earnings' 
          ? `$${(leader.value / 1000000).toFixed(1)}M` 
          : label === 'Scoring'
            ? leader.value.toFixed(2)
            : leader.value}
      </p>
    </div>
  );
}

export function SeasonLeaders() {
  const [selectedTour, setSelectedTour] = useState<TourId>('pga');
  const { data: leaders, isLoading } = useSeasonLeaders(selectedTour);

  const currentYear = new Date().getFullYear();

  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {currentYear} Season
        </p>
        <h2 className="text-lg font-bold text-slate-900">Tour Leaders</h2>
      </div>

      {/* Tour Tabs */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {TOUR_TABS.map((tourId) => (
          <button
            key={tourId}
            onClick={() => setSelectedTour(tourId)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              selectedTour === tourId
                ? "bg-slate-900"
                : "bg-slate-100"
            )}
          >
            <img
              src={getTourLogo(tourId)}
              alt={TOUR_CONFIG[tourId]?.name}
              className={cn(
                "h-4 w-auto",
                selectedTour === tourId && "brightness-0 invert"
              )}
            />
          </button>
        ))}
      </div>

      {/* Leader Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTour}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="px-4 grid grid-cols-3 gap-3"
        >
          {isLoading ? (
            <>
              <Skeleton className="h-[140px] rounded-xl" />
              <Skeleton className="h-[140px] rounded-xl" />
              <Skeleton className="h-[140px] rounded-xl" />
            </>
          ) : (
            <>
              <LeaderCard
                label="Wins"
                bgClass="bg-amber-50"
                textClass="text-amber-600"
                leader={leaders?.winsLeader || null}
              />
              <LeaderCard
                label="Earnings"
                bgClass="bg-emerald-50"
                textClass="text-emerald-600"
                leader={leaders?.earningsLeader || null}
              />
              <LeaderCard
                label="Scoring"
                bgClass="bg-blue-50"
                textClass="text-blue-600"
                leader={leaders?.scoringLeader || null}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
