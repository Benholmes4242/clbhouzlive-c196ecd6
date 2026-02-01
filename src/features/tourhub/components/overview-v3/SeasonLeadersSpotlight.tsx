/**
 * SeasonLeadersSpotlight - Merged Season Leaders + Player Spotlight
 * 
 * Design: Unified section with podium display and spotlight card
 * Per redesign brief: Merged contextual section with stat tabs
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useSeasonLeaders, usePlayerSpotlight } from '../../hooks/useOverviewModules';
import { TourId } from '../../hooks/useOverviewData';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { cn } from '@/lib/utils';
import CountryFlag from '@/components/ui/country-flag';

// Stat category tabs
const STAT_TABS: { key: 'distance' | 'accuracy' | 'scrambling' | 'putting'; label: string }[] = [
  { key: 'distance', label: 'Distance' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'scrambling', label: 'Scrambling' },
  { key: 'putting', label: 'Putting' },
];

/** Podium display for top 3 */
const PodiumDisplay = ({ 
  leaders,
  statKey,
  onPlayerTap,
}: { 
  leaders: any[];
  statKey: string;
  onPlayerTap: (id: string) => void;
}) => {
  if (!leaders || leaders.length < 3) return null;
  
  // Reorder: 2nd, 1st, 3rd
  const podiumOrder = [leaders[1], leaders[0], leaders[2]];
  const heights = ['h-16', 'h-20', 'h-12'];
  const positions = ['2', '1', '3'];
  
  return (
    <div className="flex items-end justify-center gap-2 mb-6">
      {podiumOrder.map((leader, idx) => {
        if (!leader) return null;
        const isFirst = idx === 1;
        
        return (
          <motion.button
            key={leader.playerId || idx}
            onClick={() => leader.playerId && onPlayerTap(leader.playerId)}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.2 }}
          >
            {/* Avatar */}
            <div className={cn(
              "rounded-full overflow-hidden bg-slate-100 mb-2",
              isFirst ? "w-14 h-14 ring-2 ring-amber-400 ring-offset-2" : "w-11 h-11"
            )}>
              {resolvePhotoUrl(leader.photoUrl) ? (
                <img 
                  src={resolvePhotoUrl(leader.photoUrl)!} 
                  alt={leader.lastName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  {leader.firstName?.[0]}{leader.lastName?.[0]}
                </div>
              )}
            </div>
            
            {/* Name */}
            <span className={cn(
              "text-center truncate max-w-[80px]",
              isFirst ? "text-sm font-bold text-slate-900" : "text-xs font-semibold text-slate-700"
            )}>
              {leader.lastName}
            </span>
            
            {/* Position Badge */}
            <span className={cn(
              "text-xs font-bold mt-1",
              isFirst ? "text-amber-500" : "text-slate-400"
            )}>
              {positions[idx]}
            </span>
            
            {/* Podium Bar */}
            <div className={cn(
              "w-16 rounded-t-lg mt-2",
              heights[idx],
              isFirst ? "bg-amber-400" : "bg-slate-200"
            )} />
          </motion.button>
        );
      })}
    </div>
  );
};

/** Spotlight card for active stat leader */
const SpotlightCard = ({
  leader,
  statLabel,
  statValue,
  statUnit,
  onTap,
}: {
  leader: any;
  statLabel: string;
  statValue: string;
  statUnit?: string;
  onTap: () => void;
}) => (
  <button
    onClick={onTap}
    className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
  >
    {/* Photo */}
    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
      {resolvePhotoUrl(leader.photoUrl) ? (
        <img 
          src={resolvePhotoUrl(leader.photoUrl)!} 
          alt={`${leader.firstName} ${leader.lastName}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
          {leader.firstName?.[0]}{leader.lastName?.[0]}
        </div>
      )}
    </div>
    
    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 mb-0.5">Spotlight: {statLabel} Leader</p>
      <p className="font-bold text-slate-900 truncate">
        {leader.firstName} {leader.lastName}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-lg font-bold text-slate-900 font-mono">{statValue}</span>
        {statUnit && <span className="text-xs text-slate-500">{statUnit}</span>}
      </div>
    </div>
    
    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
  </button>
);

/** Loading skeleton */
const SeasonLeadersSkeleton = () => (
  <section className="py-8">
    <div className="px-4 mb-4">
      <div className="h-6 w-36 bg-slate-100 rounded animate-pulse" />
    </div>
    <div className="px-4">
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 w-24 bg-slate-100 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="flex items-end justify-center gap-4 mb-6">
        <div className="w-11 h-11 rounded-full bg-slate-100 animate-pulse" />
        <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse" />
        <div className="w-11 h-11 rounded-full bg-slate-100 animate-pulse" />
      </div>
      <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
    </div>
  </section>
);

export function SeasonLeadersSpotlight() {
  const navigate = useNavigate();
  const [selectedStat, setSelectedStat] = useState<'distance' | 'accuracy' | 'scrambling' | 'putting'>('distance');
  
  // For now, use PGA Tour data
  const { data: leaders, isLoading } = useSeasonLeaders('pga' as TourId);
  const { data: spotlight } = usePlayerSpotlight();
  
  if (isLoading) {
    return <SeasonLeadersSkeleton />;
  }
  
  const handlePlayerTap = (playerId: string) => {
    navigate(`/tourhub/player/${playerId}`);
  };
  
  // Mock data for podium based on selected stat (would come from a real hook)
  const mockLeaders = [
    { playerId: '1', firstName: 'Scottie', lastName: 'Scheffler', photoUrl: null, value: 320.4 },
    { playerId: '2', firstName: 'Rory', lastName: 'McIlroy', photoUrl: null, value: 318.2 },
    { playerId: '3', firstName: 'Jon', lastName: 'Rahm', photoUrl: null, value: 315.7 },
  ];
  
  const statLabels: Record<string, { label: string; unit: string }> = {
    distance: { label: 'Driving Distance', unit: 'yds' },
    accuracy: { label: 'Driving Accuracy', unit: '%' },
    scrambling: { label: 'Scrambling', unit: '%' },
    putting: { label: 'Putting Average', unit: '' },
  };
  
  const currentStat = statLabels[selectedStat];

  return (
    <section className="py-8">
      {/* Header */}
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold text-slate-900">Season Leaders</h2>
      </div>
      
      {/* Stat Tabs */}
      <div className="flex gap-2 px-4 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {STAT_TABS.map(({ key, label }) => {
          const isSelected = selectedStat === key;
          
          return (
            <button
              key={key}
              onClick={() => setSelectedStat(key)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[40px]",
                isSelected 
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      
      {/* Podium */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStat}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <PodiumDisplay 
              leaders={mockLeaders} 
              statKey={selectedStat}
              onPlayerTap={handlePlayerTap}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Spotlight Card */}
        {mockLeaders[0] && (
          <SpotlightCard
            leader={mockLeaders[0]}
            statLabel={currentStat.label}
            statValue={mockLeaders[0].value.toString()}
            statUnit={currentStat.unit}
            onTap={() => handlePlayerTap(mockLeaders[0].playerId)}
          />
        )}
      </div>
      
      {/* Bottom divider */}
      <div className="h-px bg-slate-100 mt-6" />
    </section>
  );
}

export default SeasonLeadersSpotlight;
