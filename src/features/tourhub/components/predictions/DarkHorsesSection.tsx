/**
 * DarkHorsesSection - White cards matching Contenders style
 * Clean, compact outsider picks with hook labels
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';

interface DarkHorse {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  pgaTourId: string | null;
  worldRanking: number;
  reason: string;
  icon: string;
  hook?: { label: string };
}

interface DarkHorsesSectionProps {
  darkHorses: DarkHorse[];
}

const DarkHorseCard = ({ horse }: { horse: DarkHorse }) => {
  const navigate = useNavigate();
  const photoUrl = resolvePhotoUrl(horse.photoUrl, horse.pgaTourId);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${horse.playerId}`)}
      className="flex-shrink-0 w-20 bg-white rounded-xl border border-gray-200 shadow-sm p-2 text-center hover:shadow-md transition-shadow"
      whileTap={{ scale: 0.95 }}
    >
      {/* Avatar */}
      <div className="relative mx-auto w-12 h-12 mb-1.5">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={horse.playerName} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-xs font-medium text-gray-500">
                {horse.playerName.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Name - just last name for compact display */}
      <p className="text-xs font-semibold text-gray-900 truncate">
        {horse.playerName.split(' ').pop()}
      </p>
      
      {/* World ranking */}
      <p className="text-[10px] text-gray-500 mb-0.5">
        #{horse.worldRanking}
      </p>
      
      {/* Hook/insight - use the hook label or truncated reason */}
      <p className="text-[10px] text-emerald-600 font-medium truncate">
        {horse.hook?.label || horse.reason}
      </p>
    </motion.button>
  );
};

export const DarkHorsesSection = ({ darkHorses }: DarkHorsesSectionProps) => {
  if (!darkHorses || darkHorses.length === 0) return null;

  return (
    <div className="mt-3">
      {/* Header - simple and clean */}
      <div className="flex items-center gap-2 mb-2 px-4">
        <span className="text-base">🐴</span>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Dark Horses
        </h3>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1">
        {darkHorses.map((horse, i) => (
          <motion.div
            key={horse.playerId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
          >
            <DarkHorseCard horse={horse} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
