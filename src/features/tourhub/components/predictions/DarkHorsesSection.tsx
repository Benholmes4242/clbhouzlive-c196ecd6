/**
 * DarkHorsesSection - Landscape cards for dark horse picks
 * Horizontal layout with avatar, name, ranking, and hook text
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
      className="flex-shrink-0 w-48 bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex items-center gap-3 text-left hover:shadow-md transition-shadow"
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
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

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">
          {horse.playerName}
        </p>
        <p className="text-xs text-gray-500">
          #{horse.worldRanking}
        </p>
        <p className="text-xs text-emerald-600 font-medium mt-0.5 truncate">
          {horse.hook?.label || horse.reason}
        </p>
      </div>
    </motion.button>
  );
};

export const DarkHorsesSection = ({ darkHorses }: DarkHorsesSectionProps) => {
  if (!darkHorses || darkHorses.length === 0) return null;

  return (
    <div>
      {/* Header - simple, no emoji */}
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Dark Horses
      </h3>

      {/* Horizontal scroll - landscape cards */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
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
