/**
 * SeasonDashboardV3 - World No.1 feature card + clean stat strip (Apple-grade)
 * Only ONE premium card, stats are just numbers
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useOverviewStats, useWorldRankingsTop } from '../../hooks/useOverviewData';
import CountryFlag from '@/components/ui/country-flag';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

export function SeasonDashboardV3() {
  const { data: stats, isLoading: statsLoading } = useOverviewStats();
  const { data: worldRankings, isLoading: rankingsLoading } = useWorldRankingsTop(1);
  
  const isLoading = statsLoading || rankingsLoading;
  const worldNo1 = worldRankings?.[0];

  if (isLoading) {
    return (
      <section className="px-4 py-6 bg-[#F8FAFC]">
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse mb-6" />
        <div className="h-20 bg-slate-50 rounded animate-pulse" />
      </section>
    );
  }

  return (
    <section className="px-4 py-6 bg-[#F8FAFC]">
      <h2 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-4">
        Pro Golf Stats
      </h2>
      
      {/* World No. 1 Feature Card - The ONE premium card */}
      {worldNo1 && (
        <motion.div 
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold text-amber-600 tracking-wider uppercase mb-3">
            World No. 1
          </p>
          <div className="flex items-center gap-4">
            {/* Photo */}
            <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-amber-400 ring-offset-2 bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0">
              {worldNo1.photoUrl ? (
                <img 
                  src={worldNo1.photoUrl} 
                  alt={worldNo1.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-400">
                    {getInitials(worldNo1.firstName, worldNo1.lastName)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Info */}
            <div>
              <h3 className="text-xl font-bold text-slate-900">{worldNo1.fullName}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                <CountryFlag country={worldNo1.country} size="sm" />
                <span>{worldNo1.country}</span>
              </p>
              {worldNo1.avgPoints && (
                <p className="text-sm text-amber-600 font-medium mt-1">
                  {worldNo1.avgPoints.toFixed(2)} avg points
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Stats Row - NO CARDS, just numbers */}
      <motion.div 
        className="flex justify-between text-center py-4 border-t border-slate-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats?.totalTournaments || 0}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Tournaments</p>
        </div>
        
        <div>
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats?.liveTournaments || 0}
            </p>
            {(stats?.liveTournaments || 0) > 0 && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Live Now</p>
        </div>
        
        <div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats?.rankedPlayers || 0}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Ranked</p>
        </div>
        
        <div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats?.uniqueCourses || 0}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Courses</p>
        </div>
      </motion.div>
    </section>
  );
}
