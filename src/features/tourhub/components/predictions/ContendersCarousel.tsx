/**
 * ContendersCarousel - Horizontal scroll chips for positions 4-8
 * Compact pill-style display with photo, name, and win probability
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';

interface Contender {
  rank: number;
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  pgaTourId: string | null;
  winProbability: number;
}

interface ContendersCarouselProps {
  contenders: Contender[];
}

const ContenderChip = ({ contender }: { contender: Contender }) => {
  const navigate = useNavigate();
  const photoUrl = resolvePhotoUrl(contender.photoUrl, contender.pgaTourId);
  
  // Get last name for compact display
  const lastName = contender.playerName.split(' ').pop() || contender.playerName;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${contender.playerId}`)}
      className={cn(
        "flex-shrink-0 flex items-center gap-2 pl-1 pr-3 py-1",
        "rounded-full bg-white border border-slate-100 shadow-sm",
        "hover:shadow-md transition-shadow"
      )}
      whileTap={{ scale: 0.95 }}
    >
      {/* Rank badge */}
      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-500">#{contender.rank}</span>
      </div>

      {/* Photo */}
      <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 -ml-1">
        {photoUrl ? (
          <img src={photoUrl} alt={contender.playerName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px] font-bold">
            {contender.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-xs font-medium text-slate-700 max-w-[80px] truncate">
        {lastName}
      </span>

      {/* Probability */}
      <span className="text-xs font-bold text-emerald-600">
        {contender.winProbability}%
      </span>
    </motion.button>
  );
};

export const ContendersCarousel = ({ contenders }: ContendersCarouselProps) => {
  if (!contenders || contenders.length === 0) return null;

  return (
    <div className="mt-4">
      {/* Header */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 mb-2">
        Contenders
      </h3>

      {/* Horizontal scroll */}
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1">
        {contenders.map((contender, i) => (
          <motion.div
            key={contender.playerId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
          >
            <ContenderChip contender={contender} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
