/**
 * PlayerSpotlight - Featured player highlight
 * Dark premium card with player photo and key stat
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { usePlayerSpotlight } from '../../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';
import { Skeleton } from '@/components/ui/skeleton';

export function PlayerSpotlight() {
  const navigate = useNavigate();
  const { data: spotlight, isLoading } = usePlayerSpotlight();

  if (isLoading) {
    return (
      <section className="px-4 py-6 border-t border-slate-100">
        <Skeleton className="h-3 w-28 mb-3" />
        <Skeleton className="h-[140px] rounded-2xl bg-slate-800" />
      </section>
    );
  }

  if (!spotlight) return null;

  return (
    <section className="px-4 py-6 border-t border-slate-100">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Player Spotlight
      </p>

      <motion.button
        onClick={() => navigate(`/tourhub/player/${spotlight.playerId}`)}
        className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-left"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
            {spotlight.photoUrl ? (
              <img
                src={spotlight.photoUrl}
                alt={`${spotlight.firstName} ${spotlight.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-500">
                  {spotlight.firstName[0]}{spotlight.lastName[0]}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Label Badge */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                {spotlight.label}
              </span>
            </div>

            {/* Name */}
            <h3 className="text-xl font-bold text-white">
              {spotlight.firstName} {spotlight.lastName}
            </h3>

            {/* Country */}
            <div className="flex items-center gap-2 mt-1">
              {spotlight.country && (
                <>
                  <CountryFlag country={spotlight.country} size="sm" />
                  <span className="text-sm text-white/70">{spotlight.country}</span>
                </>
              )}
            </div>

            {/* Stat Badge */}
            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
              <span className="text-xs text-white/60">{spotlight.statLabel}</span>
              <span className="text-sm font-bold text-emerald-400">{spotlight.statValue}</span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
        </div>
      </motion.button>
    </section>
  );
}
