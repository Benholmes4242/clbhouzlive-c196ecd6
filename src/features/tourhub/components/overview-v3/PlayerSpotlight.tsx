/**
 * PlayerSpotlight - Featured player highlight
 * Premium gradient card with player photo and key stat (light theme)
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { usePlayerSpotlight } from '../../hooks/useOverviewModules';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import CountryFlag from '@/components/ui/country-flag';
import { Skeleton } from '@/components/ui/skeleton';

export function PlayerSpotlight() {
  const navigate = useNavigate();
  const { data: spotlight, isLoading } = usePlayerSpotlight();

  if (isLoading) {
    return (
      <section className="px-4 py-6 border-t border-slate-100">
        <Skeleton className="h-3 w-28 mb-3" />
        <Skeleton className="h-[140px] rounded-2xl" />
      </section>
    );
  }

  if (!spotlight) return null;

  // Use amber/gold gradient for World No. 1, emerald for others
  const isWorldNo1 = spotlight.label === 'World No. 1';
  const gradientClass = isWorldNo1
    ? 'from-amber-500 via-amber-600 to-orange-700'
    : 'from-emerald-600 via-emerald-700 to-emerald-900';

  return (
    <section className="px-4 py-6 border-t border-slate-100">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Player Spotlight
      </p>

      <motion.button
        onClick={() => navigate(`/tourhub/player/${spotlight.playerId}`)}
        className={`w-full rounded-2xl overflow-hidden relative shadow-sm border border-black/5`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />

        {/* Content */}
        <div className="relative z-10 p-5 flex items-center gap-4">
          {/* Player Photo */}
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/20 flex-shrink-0 ring-2 ring-white/30 shadow-lg">
            {(() => {
              const photoUrl = getPlayerHeadshotUrl(`${spotlight.firstName} ${spotlight.lastName}`, 'pga');
              return photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${spotlight.firstName} ${spotlight.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white/80">
                    {spotlight.firstName[0]}{spotlight.lastName[0]}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-left">
            {/* Label Badge */}
            <span className={`text-xs font-semibold uppercase tracking-wider ${isWorldNo1 ? 'text-amber-100' : 'text-emerald-100'}`}>
              {spotlight.label}
            </span>

            {/* Name */}
            <h3 className="text-xl font-bold text-white mt-1">
              {spotlight.firstName} {spotlight.lastName}
            </h3>

            {/* Country */}
            <div className="flex items-center gap-2 mt-1">
              {spotlight.country && (
                <>
                  <CountryFlag country={spotlight.country} size="sm" />
                  <span className="text-sm text-white/80">{spotlight.country}</span>
                </>
              )}
            </div>

            {/* Stat Badge */}
            <div className="mt-2 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
              <span className="text-xs text-white/70">{spotlight.statLabel}</span>
              <span className="text-sm font-bold text-white">{spotlight.statValue}</span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-white/50 flex-shrink-0" />
        </div>
      </motion.button>
    </section>
  );
}
