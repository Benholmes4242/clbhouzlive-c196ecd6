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
  const [yourGameIds, setYourGameIds] = useState<Set<string>>(new Set());
  const { createRequest, acceptedGameIds } = useGameJoinRequests();

  // Get current user ID and fetch their games
  useEffect(() => {
    const fetchUserGames = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      
      if (!user) return;

      const nowIso = new Date().toISOString();
      
      // Fetch hosted games
      const { data: hosted } = await supabase
        .from('games')
        .select('id')
        .eq('host_user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', nowIso);

      // Fetch joined games
      const { data: participants } = await supabase
        .from('game_participants')
        .select('game_id')
        .eq('user_id', user.id);

      const ids = new Set<string>();
      (hosted || []).forEach((g: any) => ids.add(g.id));
      (participants || []).forEach((p: any) => ids.add(p.game_id));
      
      setYourGameIds(ids);
    };

    fetchUserGames();

    // Listen for game-created events to refetch
    const handleGameCreated = () => fetchUserGames();
    window.addEventListener('game-created', handleGameCreated);
    
    return () => window.removeEventListener('game-created', handleGameCreated);
  }, []);

  // Fetch games at selected club
  useEffect(() => {
    if (!selectedClub?.id) {
      setClubGames([]);
      return;
    }

    const fetchClubGames = async () => {
      setIsLoadingClubGames(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        // Normalize search term for fuzzy matching
        const normalized = selectedClub.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ');

        const { data, error } = await supabase
          .from('games')
          .select('id, host_user_id, course_id, course_name, lat, lng, start_time, expires_at, status, slots_total, slots_open, visibility, note, created_at, updated_at')
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .or(`course_id.eq.${selectedClub.id},course_name_normalized.ilike.%${normalized}%`) as { data: any[] | null, error: any };

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

    // Club-scoped realtime subscription for instant updates
    const channel = supabase
      .channel(`club_games_${selectedClub.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `course_id=eq.${selectedClub.id}`,
      }, () => fetchClubGames())
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [selectedClub?.id]);

  const handleClubSelect = (club: { id: string; name: string; country: string; region?: string }) => {
    setSelectedClub({ id: club.id, name: club.name });
  };

  const handleClearSearch = () => {
    setSelectedClub(null);
    setClubGames([]);
  };

  const handleRequestJoin = async (gameId: string) => {
    // Optimistic update
    setRequestedGames(prev => {
      const next = new Set(prev);
      next.add(gameId);
      return next;
    });
    await createRequest(gameId);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pb-4">
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
  // Filter out games the user is hosting or has joined
  const discoverableGames = displayGames.filter(b => !yourGameIds.has(b.id));

  return (
    <div className="space-y-3 pb-4">
      {/* SECTION 1: Discoverable Games */}
      <div className="space-y-3">
        <div className="px-2 text-center">
          <h3 className="text-sm font-semibold text-white/95">
            {selectedClub ? `Games at ${selectedClub.name}` : 'Games Near You'}
          </h3>
        </div>

        {/* Loading state */}
        {isLoadingClubGames ? (
          <div className="text-center">
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-neutral-800/30 rounded-xl p-4 h-24" />
              ))}
            </div>
          </div>
        ) : discoverableGames.length === 0 ? (
          // Empty state
          <div className="text-center space-y-2">
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
            {discoverableGames.map(game => (
              <AnonymousGameCard
                key={game.id}
                game={{
                  id: game.id,
                  course_name: game.course_name,
                  start_time: game.start_time,
                  slots_open: game.slots_open || 0,
                  slots_total: game.slots_total || 4,
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

      {/* Subtle divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* SECTION 2: Find a Game (Search) */}
      <div>
        <ClubSearchInput
          onClubSelect={handleClubSelect}
          onClear={handleClearSearch}
          selectedClub={selectedClub}
        />
      </div>

      {/* Subtle divider before CTA */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* SECTION 3: Create a Game CTA - Centered */}
      <div className="text-center space-y-3 flex flex-col items-center">
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
