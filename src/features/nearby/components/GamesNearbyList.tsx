import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { GameBeacon } from '../hooks/useGameBeacon';
import { supabase } from '@/integrations/supabase/client';
import { AnonymousGameCard } from './AnonymousGameCard';
import { HostGameView } from './HostGameView';
import { useGameJoinRequests } from '../hooks/useGameJoinRequests';
import { ClubSearchInput } from './ClubSearchInput';

interface GamesNearbyListProps {
  beacons: GameBeacon[];
  isLoading: boolean;
  onJoinBeacon: (beaconId: string) => void;
  onCancelBeacon: (beaconId: string) => void;
  onCreateGame: (clubData?: { id: string; name: string }) => void;
}

export function GamesNearbyList({
  beacons,
  isLoading,
  onJoinBeacon,
  onCancelBeacon,
  onCreateGame,
}: GamesNearbyListProps) {
  const [selectedClub, setSelectedClub] = useState<{ id: string; name: string } | null>(null);
  const [clubGames, setClubGames] = useState<GameBeacon[]>([]);
  const [isLoadingClubGames, setIsLoadingClubGames] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [requestedGames, setRequestedGames] = useState<Set<string>>(new Set());
  const { createRequest, acceptedGameIds } = useGameJoinRequests();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Fetch games at selected club
  useEffect(() => {
    if (!selectedClub) {
      setClubGames([]);
      return;
    }

    const fetchClubGames = async () => {
      setIsLoadingClubGames(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        const { data, error } = await supabase
          .from('game_beacons')
          .select('*')
          .eq('course_name', selectedClub.name)
          .eq('is_active', true)
          .gte('expires_at', new Date().toISOString());

        if (error) throw error;

        const gamesWithHostFlag = (data || []).map(beacon => ({
          ...beacon,
          isHost: beacon.host_user_id === currentUserId,
        }));

        setClubGames(gamesWithHostFlag);
      } catch (error) {
        console.error('Error fetching club games:', error);
        setClubGames([]);
      } finally {
        setIsLoadingClubGames(false);
      }
    };

    fetchClubGames();
  }, [selectedClub]);

  const handleClubSelect = (club: { id: string; name: string; country: string; region?: string }) => {
    setSelectedClub({ id: club.id, name: club.name });
  };

  const handleClearSearch = () => {
    setSelectedClub(null);
    setClubGames([]);
  };

  const handleRequestJoin = async (gameId: string) => {
    setRequestedGames(prev => new Set(prev).add(gameId));
    await createRequest(gameId);
  };

  if (isLoading) {
    return (
      <div className="space-y-5 pb-4">
        <div>
          <ClubSearchInput
            onClubSelect={handleClubSelect}
            onClear={handleClearSearch}
            selectedClub={selectedClub}
          />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="space-y-3">
          <div className="px-2 text-center">
            <h3 className="text-sm font-semibold text-white/95">Games Near You</h3>
          </div>
          <div className="py-6 text-center">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-neutral-800/30 rounded-xl p-4 h-24" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayGames = selectedClub ? clubGames : beacons;
  const myGames = displayGames.filter(b => b.host_user_id === currentUserId);
  const otherGames = displayGames.filter(b => b.host_user_id !== currentUserId);

  return (
    <div className="space-y-5 pb-4">
      {/* SECTION 1: Find a Game (Search) */}
      <div>
        <ClubSearchInput
          onClubSelect={handleClubSelect}
          onClear={handleClearSearch}
          selectedClub={selectedClub}
        />
      </div>

      {/* Subtle divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* SECTION 2: My Games */}
      {myGames.length > 0 && (
        <div className="space-y-3">
          <div className="px-2 text-center">
            <h3 className="text-sm font-semibold text-white/95">Your Games</h3>
          </div>
          {myGames.map(game => (
            <HostGameView
              key={game.id}
              game={game}
              onCancelBeacon={onCancelBeacon}
            />
          ))}
        </div>
      )}

      {/* Divider if both sections exist */}
      {myGames.length > 0 && otherGames.length > 0 && (
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}

      {/* SECTION 3: Available Games */}
      <div className="space-y-3">
        <div className="px-2 text-center">
          <h3 className="text-sm font-semibold text-white/95">
            {selectedClub ? `Games at ${selectedClub.name}` : 'Games Near You'}
          </h3>
        </div>

        {/* Loading state */}
        {isLoadingClubGames ? (
          <div className="py-6 text-center">
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-neutral-800/30 rounded-xl p-4 h-24" />
              ))}
            </div>
          </div>
        ) : otherGames.length === 0 ? (
          // Empty state
          <div className="py-6 text-center space-y-2">
            <MapPin className="w-10 h-10 mx-auto text-neutral-600" />
            <p className="text-sm text-neutral-300">
              {selectedClub 
                ? `No active games at ${selectedClub.name}`
                : 'No games nearby'}
            </p>
            <p className="text-xs text-neutral-500">Be the first to start one!</p>
          </div>
        ) : (
          // Game cards
          <div className="space-y-3">
            {otherGames.map(game => (
              <AnonymousGameCard
                key={game.id}
                game={{
                  id: game.id,
                  course_name: game.course_name,
                  tee_time: game.tee_time || game.start_time,
                  game_type: game.game_type,
                  players_needed: game.players_needed,
                  host_handicap: game.host_handicap || null,
                  other_player_handicaps: game.other_player_handicaps || null,
                  host_user_id: game.host_user_id,
                }}
                onRequestJoin={handleRequestJoin}
                hasRequested={requestedGames.has(game.id)}
                isAccepted={acceptedGameIds.has(game.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Subtle divider before CTA */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* SECTION 4: Create a Game CTA - Centered */}
      <div className="text-center space-y-3 py-2 flex flex-col items-center">
        <p className="text-xs text-white/60">
          Can't find a game that suits you?
        </p>
        <button
          onClick={() => onCreateGame(selectedClub)}
          className="px-6 py-2.5 bg-white/20 hover:bg-white/30 active:bg-white/30 text-white rounded-xl font-medium backdrop-blur border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset] active:shadow-[0_24px_54px_rgba(0,0,0,0.9),_0_0_40px_rgba(255,255,255,0.28)] transition-all"
        >
          Create a Game
        </button>
      </div>
    </div>
  );
}
