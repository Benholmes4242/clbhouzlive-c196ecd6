/**
 * SeasonDashboardV3 - World No.1 feature card + clean stat row (Apple-grade)
 * Only ONE premium card, stats are clean numbers with no backgrounds
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOverviewStats, useWorldRankingsTop } from '../../hooks/useOverviewData';
import CountryFlag from '@/components/ui/country-flag';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

export function SeasonDashboardV3() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useOverviewStats();
  const { data: worldRankings, isLoading: rankingsLoading } = useWorldRankingsTop(1);
  
  const isLoading = statsLoading || rankingsLoading;
  const worldNo1 = worldRankings?.[0];

  if (isLoading) {
    return (
      <section className="px-4 py-6 bg-[#F8FAFC]">
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="h-28 bg-slate-100 rounded-2xl animate-pulse mb-6" />
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
        <motion.button
          onClick={() => navigate(`/tourhub/player/${worldNo1.playerId}`)}
          className="w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 mb-6 text-left hover:from-amber-100/80 hover:to-orange-100/80 active:scale-[0.99] transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold text-amber-600 tracking-wider uppercase mb-3">
            World No. 1
          </p>
          <div className="flex items-center gap-4">
            {/* Photo */}
            <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-amber-400 ring-offset-2 bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0">
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
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900">{worldNo1.fullName}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CountryFlag country={worldNo1.country} size="sm" />
                <span className="text-sm text-slate-500">{worldNo1.country}</span>
              </div>
            </div>
            
            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
          </div>
        </motion.button>
      )}
      
      {/* Stats Row - NO CARDS, clean numbers */}
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
