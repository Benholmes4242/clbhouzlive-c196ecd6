/**
 * DarkHorsesSection - Compact outsider picks with hook labels
 * Purple-themed cards without redundant "DARK HORSE" labels
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';

interface DarkHorse {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  pgaTourId: string | null;
  worldRanking: number;
  reason: string;
  icon: string;
}

interface DarkHorsesSectionProps {
  darkHorses: DarkHorse[];
}

const DarkHorseCard = ({ horse }: { horse: DarkHorse }) => {
  const navigate = useNavigate();
  const photoUrl = resolvePhotoUrl(horse.photoUrl, horse.pgaTourId);
  
  // Get last name for compact display
  const lastName = horse.playerName.split(' ').pop() || horse.playerName;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${horse.playerId}`)}
      className={cn(
        "flex-shrink-0 w-[130px] p-3 rounded-xl text-left",
        "bg-gradient-to-br from-purple-50 to-indigo-50",
        "border border-purple-100 shadow-sm",
        "hover:shadow-md transition-shadow"
      )}
      whileTap={{ scale: 0.97 }}
    >
      {/* Player row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex-shrink-0 shadow-sm">
          {photoUrl ? (
            <img src={photoUrl} alt={horse.playerName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-bold">
              {horse.playerName.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 text-sm truncate">{lastName}</p>
          <p className="text-[10px] text-slate-500">#{horse.worldRanking}</p>
        </div>
      </div>

      {/* Reason with icon */}
      <div className="flex items-start gap-1.5">
        <span className="text-sm flex-shrink-0">{horse.icon}</span>
        <p className="text-[11px] text-purple-600 line-clamp-2 leading-tight">
          {horse.reason}
        </p>
      </div>
    </motion.button>
  );
};

export const DarkHorsesSection = ({ darkHorses }: DarkHorsesSectionProps) => {
  if (!darkHorses || darkHorses.length === 0) return null;

  return (
    <div className="mt-4">
      {/* Header with icon */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 mb-2 flex items-center gap-1.5">
        <span>🐴</span>
        Dark Horses
      </h3>

      {/* Horizontal scroll */}
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1">
        {darkHorses.map((horse, i) => (
          <motion.div
            key={horse.playerId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
          >
            <DarkHorseCard horse={horse} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
