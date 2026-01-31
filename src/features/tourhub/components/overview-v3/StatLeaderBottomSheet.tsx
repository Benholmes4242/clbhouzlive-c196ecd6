/**
 * StatLeaderBottomSheet - Detail modal for Season Stats Leaders
 * Shows expanded player stats with all category rankings
 */

import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { cn } from '@/lib/utils';
import { STAT_CATEGORIES, GRADIENT_OVERLAY } from './statLeaderStyles';

interface PlayerStat {
  playerId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  value: number;
  displayValue: string;
}

interface AllCategoriesData {
  [categoryId: string]: PlayerStat[];
}

interface StatLeaderBottomSheetProps {
  open: boolean;
  onClose: () => void;
  player: PlayerStat | null;
  currentCategory: string;
  allCategories: AllCategoriesData;
}

export function StatLeaderBottomSheet({ 
  open, 
  onClose, 
  player, 
  currentCategory,
  allCategories,
}: StatLeaderBottomSheetProps) {
  const navigate = useNavigate();
  
  if (!player) return null;

  const currentCategoryDef = STAT_CATEGORIES.find(c => c.id === currentCategory);
  
  // Find this player's rank in current category
  const currentCategoryPlayers = allCategories[currentCategory] || [];
  const currentRank = currentCategoryPlayers.findIndex(p => p.playerId === player.playerId) + 1;
  
  // Find this player's ranks in other categories
  const playerRanksInOtherCategories = STAT_CATEGORIES
    .filter(cat => cat.id !== currentCategory)
    .map(cat => {
      const categoryPlayers = allCategories[cat.id] || [];
      const playerInCategory = categoryPlayers.find(p => p.playerId === player.playerId);
      const rank = playerInCategory 
        ? categoryPlayers.findIndex(p => p.playerId === player.playerId) + 1 
        : null;
      
      return {
        categoryId: cat.id,
        categoryLabel: cat.fullLabel,
        categoryIcon: cat.icon,
        unit: cat.unit,
        rank,
        value: playerInCategory?.displayValue || null,
      };
    })
    .filter(item => item.rank !== null && item.rank <= 10);

  const handleViewProfile = () => {
    onClose();
    navigate(`/tourhub/player/${player.playerId}`);
  };

  return (
    <BottomSheet 
      open={open} 
      onClose={onClose}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,1) 100%)',
        backdropFilter: 'blur(50px) saturate(180%)',
        WebkitBackdropFilter: 'blur(50px) saturate(180%)',
      }}
    >
      <div className="px-6 pb-8 overflow-y-auto max-h-[80vh]">
        {/* Hero Image */}
        <div className="relative h-48 -mx-6 mb-4 overflow-hidden">
          {player.photoUrl ? (
            <img 
              src={player.photoUrl}
              alt={`${player.firstName} ${player.lastName}`}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <span className="text-6xl font-bold text-white/30">
                {player.firstName?.[0]}{player.lastName?.[0]}
              </span>
            </div>
          )}
          <div 
            className="absolute inset-0"
            style={{ background: GRADIENT_OVERLAY.textLegibility }}
          />
          <div className="absolute bottom-4 left-6">
            <h3 className="text-white font-bold text-2xl drop-shadow-lg">
              {player.firstName} {player.lastName}
            </h3>
          </div>
        </div>

        {/* Current Stat Highlight */}
        <div className="bg-amber-50 rounded-2xl p-4 mb-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{currentCategoryDef?.icon}</span>
            <span className="text-sm text-amber-600 font-medium">
              {currentCategoryDef?.fullLabel} Leader
            </span>
          </div>
          <div className="text-3xl font-bold text-amber-700">
            {player.displayValue}
            {currentCategoryDef?.unit && (
              <span className="text-lg font-normal text-amber-600 ml-1">
                {currentCategoryDef.unit}
              </span>
            )}
          </div>
          <div className="text-sm text-amber-600/70 mt-1">
            #{currentRank} on Tour
          </div>
        </div>

        {/* Other Top 10 Appearances */}
        {playerRanksInOtherCategories.length > 0 && (
          <>
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Also in Top 10
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {playerRanksInOtherCategories.map(item => (
                <div 
                  key={item.categoryId} 
                  className="bg-slate-50 rounded-xl p-3 border border-slate-100"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{item.categoryIcon}</span>
                    <span className="text-xs text-slate-500 truncate">
                      {item.categoryLabel}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {item.value}
                    {item.unit && (
                      <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    #{item.rank}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* View Full Profile Button */}
        <button 
          className="w-full py-3.5 bg-slate-900 text-white rounded-full font-medium active:scale-[0.98] transition-transform"
          onClick={handleViewProfile}
        >
          View Full Profile
        </button>
      </div>
    </BottomSheet>
  );
}
