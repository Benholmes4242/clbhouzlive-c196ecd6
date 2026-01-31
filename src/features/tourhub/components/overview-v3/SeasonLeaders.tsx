/**
 * SeasonLeaders - Tour-specific leaders in Wins, Earnings, Scoring
 * Tabbed interface with larger tour logos and leader cards
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonLeaders } from '../../hooks/useOverviewModules';
import { TourId, TOUR_CONFIG } from '../../hooks/useOverviewData';
import { getTourLogo } from '../../utils/tourLogos';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ResolvedHeadshot } from '../ResolvedHeadshot';

const TOUR_TABS: { id: TourId; name: string }[] = [
  { id: 'pga', name: 'PGA Tour' },
  { id: 'euro', name: 'DP World' },
  { id: 'lpga', name: 'LPGA' },
  { id: 'liv', name: 'LIV Golf' },
];

function LeaderCard({
  label,
  bgClass,
  textClass,
  leader,
}: {
  label: string;
  bgClass: string;
  textClass: string;
  leader:
    | {
        playerId: string;
        firstName: string;
        lastName: string;
        photoUrl: string | null;
        value: number;
      }
    | null;
}) {
  if (!leader) {
    return (
      <div className={cn("rounded-xl p-4 text-center shadow-sm border border-black/5", bgClass)}>
        <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", textClass)}>
          {label}
        </p>
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-200/50 mb-2 flex items-center justify-center">
          <span className="text-slate-300 text-lg">—</span>
        </div>
        <p className="text-xs text-slate-400">Coming soon</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl p-3 text-center shadow-sm border border-black/5", bgClass)}>
      <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", textClass)}>
        {label}
      </p>
      <ResolvedHeadshot
        photoUrl={leader.photoUrl}
        alt={`${leader.firstName} ${leader.lastName}`}
        fallback={`${leader.firstName?.[0] ?? ''}${leader.lastName?.[0] ?? ''}`.toUpperCase() || '?'}
        className="w-12 h-12 mx-auto rounded-full mb-2 ring-2 ring-white/50"
        fallbackClassName="text-sm"
      />
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

  // Use the year from data, or current year as fallback
  const displayYear = leaders?.year || new Date().getFullYear();

  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {displayYear} Season
        </p>
        <h2 className="text-lg font-bold text-slate-900">Tour Leaders</h2>
      </div>

      {/* Tour Tabs - Larger Logos */}
      <div className="flex gap-3 px-4 mb-4 overflow-x-auto scrollbar-hide -webkit-overflow-scrolling-touch">
        {TOUR_TABS.map((tour) => (
          <button
            key={tour.id}
            onClick={() => setSelectedTour(tour.id)}
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-2xl transition-all flex-shrink-0 shadow-sm",
              selectedTour === tour.id
                ? "bg-slate-900 ring-2 ring-slate-900 ring-offset-2"
                : "bg-slate-100 hover:bg-slate-200"
            )}
          >
            <img
              src={getTourLogo(tour.id)}
              alt={tour.name}
              className={cn(
                "w-10 h-8 object-contain",
                selectedTour === tour.id && "brightness-0 invert"
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

