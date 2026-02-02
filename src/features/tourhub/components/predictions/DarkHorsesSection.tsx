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
      className="flex-shrink-0 w-44 bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 hover:shadow-md transition-shadow"
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-100">
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

        {/* Text content */}
        <div className="flex-1 min-w-0 text-left">
          {/* Name and ranking */}
          <div className="flex items-baseline gap-1.5">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {horse.playerName.split(' ').pop()}
            </p>
            <span className="text-[10px] text-gray-400">#{horse.worldRanking}</span>
          </div>
          
          {/* Hook/insight - full text visible */}
          <p className="text-[11px] text-emerald-600 font-medium leading-snug mt-0.5">
            {horse.hook?.label || horse.reason}
          </p>
        </div>
      </div>
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
