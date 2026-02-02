/**
 * ContendersCarousel - Vertical chip cards for positions 4-8
 * Each chip: avatar with rank badge, name below, percentage at bottom
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
      className="flex-shrink-0 w-20 bg-white rounded-xl border border-gray-200 p-2 text-center shadow-sm hover:shadow-md transition-shadow"
      whileTap={{ scale: 0.95 }}
    >
      {/* Avatar with rank badge */}
      <div className="relative mx-auto w-12 h-12 mb-1.5">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
          {photoUrl ? (
            <img src={photoUrl} alt={contender.playerName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
              {contender.playerName.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
        
        {/* Rank badge */}
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
          {contender.rank}
        </span>
      </div>

      {/* Name */}
      <p className="text-xs font-semibold text-slate-900 truncate mb-0.5">
        {lastName}
      </p>

      {/* Probability */}
      <p className="text-xs font-bold text-emerald-600">
        {contender.winProbability}%
      </p>
    </motion.button>
  );
};

export const ContendersCarousel = ({ contenders }: ContendersCarouselProps) => {
  if (!contenders || contenders.length === 0) return null;

  return (
    <div className="mt-3">
      {/* Header */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 mb-2">
        Contenders
      </h3>

      {/* Horizontal scroll */}
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1">
        {contenders.map((contender, i) => (
          <motion.div
            key={contender.playerId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
          >
            <ContenderChip contender={contender} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
