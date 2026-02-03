/**
 * DangerousProfilesRow - Chapter 5: Threat cards
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { DangerousProfile } from './types';

interface DangerousProfilesRowProps {
  profiles: DangerousProfile[];
}

export const DangerousProfilesRow = memo(function DangerousProfilesRow({
  profiles,
}: DangerousProfilesRowProps) {
  const navigate = useNavigate();

  if (profiles.length === 0) return null;

  const handlePlayerClick = (playerId: string) => {
    navigate(`/tourhub/player/${playerId}`);
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <h3 className="text-base font-semibold text-slate-900 mb-3">Dangerous Profiles</h3>

      {/* Horizontal Scroll */}
      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {profiles.map((profile) => (
          <motion.button
            key={profile.id}
            onClick={() => handlePlayerClick(profile.id)}
            className="flex-shrink-0 w-[200px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left"
            style={{ scrollSnapAlign: 'start' }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Content */}
            <div className="p-3">
              {/* Avatar + Name Row */}
              <div className="flex items-center gap-2.5 mb-2">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-10 h-10 rounded-full object-cover bg-slate-100 flex-shrink-0"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">
                    {profile.name}
                  </h4>
                  {profile.worldRankText && (
                    <p className="text-xs text-slate-400">{profile.worldRankText}</p>
                  )}
                </div>
              </div>

              {/* Trait Label - allow wrapping */}
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide leading-tight mb-1.5 line-clamp-2">
                {profile.traitLabel}
              </p>

              {/* One-liner - proper line clamp */}
              <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                {profile.oneLiner}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
});
