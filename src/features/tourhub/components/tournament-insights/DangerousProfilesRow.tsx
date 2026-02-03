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
    // NO SECTION TITLE - removed "Dangerous Profiles" header
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
          className="flex-shrink-0 w-[175px] bg-white rounded-xl border border-slate-200 shadow-sm p-3 text-left"
          style={{ scrollSnapAlign: 'start' }}
          whileTap={{ scale: 0.98 }}
        >
          {/* NO GREY TOP LINE - removed */}

          {/* Avatar + Name + Danger Badge Row */}
          <div className="flex items-start gap-2.5 mb-2">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-10 h-10 rounded-full object-cover bg-slate-100 flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 truncate mb-0.5">
                {profile.name}
              </h4>
              {/* Danger Badge */}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 border border-red-100">
                <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                  Danger
                </span>
              </span>
            </div>
          </div>

          {/* Trait Label - NO truncation, text is limited at data level */}
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide leading-tight mb-1">
            {profile.traitLabel}
          </p>

          {/* One-liner - NO truncation, text is limited at data level */}
          <p className="text-xs text-slate-500 leading-snug">
            {profile.oneLiner}
          </p>
        </motion.button>
      ))}
    </div>
  );
});
