import { useState, useEffect } from 'react';
import { Trophy, TrendingDown, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardScopeSelector } from '../shared';
import { ClubSearchBar } from '../exploration/ClubSearchBar';
import { LowestHandicapLeaderboard } from './LowestHandicapLeaderboard';
import { HandicapImprovementLeaderboard } from './HandicapImprovementLeaderboard';
import { SeasonImprovementLeaderboard } from './SeasonImprovementLeaderboard';
import type { LeaderboardScope } from '@/types/leaderboards';

type HandicapMode = 'lowest' | 'improved' | 'season';

const MODES = [
  { value: 'lowest' as const, label: 'Lowest', icon: Trophy },
  { value: 'improved' as const, label: 'Most Improved', icon: TrendingDown },
  { value: 'season' as const, label: 'Season', icon: Calendar },
];

export function HandicapTab() {
  const { user } = useSupabaseSession();
  const [activeMode, setActiveMode] = useState<HandicapMode>('lowest');
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);

  // Fetch user's home club
  useEffect(() => {
    async function fetchUserHomeClub() {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('user_profiles')
        .select('primary_club_id, golf_clubs!user_profiles_primary_club_id_fkey(name)')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data?.primary_club_id) {
        setUserHomeClubId(data.primary_club_id);
        setUserHomeClubName((data.golf_clubs as any)?.name || null);
        // Default to user's home club when switching to club scope
        if (!selectedClubId) {
          setSelectedClubId(data.primary_club_id);
          setSelectedClubName((data.golf_clubs as any)?.name || null);
        }
      }
    }
    fetchUserHomeClub();
  }, [user?.id]);

  // When switching to club scope, default to user's home club
  useEffect(() => {
    if (scope === 'club' && !selectedClubId && userHomeClubId) {
      setSelectedClubId(userHomeClubId);
      setSelectedClubName(userHomeClubName);
    }
  }, [scope, selectedClubId, userHomeClubId, userHomeClubName]);

  const handleClubSelect = (clubId: string | null, clubName: string | null) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
  };

  return (
    <div className="space-y-4">
      {/* Mode Selector - Pill toggle style matching other tabs */}
      <div className="px-4">
        <div className="flex p-1 bg-[#e2e8f0]/50 rounded-full border border-[#e2e8f0]">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => setActiveMode(mode.value)}
                className={cn(
                  'flex-1 py-2 px-3 text-xs font-medium rounded-full transition-all flex items-center justify-center gap-1.5',
                  isActive
                    ? 'bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
                    : 'text-[#64748b] hover:text-[#1e293b]'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope Selector */}
      <div className="px-4">
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
      </div>

      {/* Club Search (only visible in club scope) */}
      {scope === 'club' && (
        <div className="px-4">
          <ClubSearchBar
            selectedClubId={selectedClubId}
            selectedClubName={selectedClubName}
            userHomeClubId={userHomeClubId}
            userHomeClubName={userHomeClubName}
            onClubSelect={handleClubSelect}
          />
        </div>
      )}

      {/* Content based on mode */}
      <div>
        {activeMode === 'lowest' && (
          <LowestHandicapLeaderboard 
            scope={scope} 
            clubId={scope === 'club' ? selectedClubId : null}
            clubName={scope === 'club' ? selectedClubName : null}
          />
        )}
        {activeMode === 'improved' && (
          <HandicapImprovementLeaderboard 
            days={30} 
            scope={scope}
            clubId={scope === 'club' ? selectedClubId : null}
            clubName={scope === 'club' ? selectedClubName : null}
          />
        )}
        {activeMode === 'season' && (
          <SeasonImprovementLeaderboard 
            scope={scope}
            clubId={scope === 'club' ? selectedClubId : null}
            clubName={scope === 'club' ? selectedClubName : null}
          />
        )}
      </div>
    </div>
  );
}
