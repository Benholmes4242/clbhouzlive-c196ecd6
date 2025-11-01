import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Game } from '../types';
import { MapPin, Users, Clock, AlertCircle } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { channelManager } from '@/utils/supabaseChannelManager';

interface YourGamesListProps {
  onCancelGame?: (gameId: string) => void;
  onLeaveGame?: (gameId: string) => void;
}

export function YourGamesList({ onCancelGame, onLeaveGame }: YourGamesListProps) {
  const { user } = useSupabaseSession();
  const [hostedGames, setHostedGames] = useState<Game[]>([]);
  const [joinedGames, setJoinedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchYourGames = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      const nowIso = new Date().toISOString();

      // Fetch games you're hosting
      const { data: hosted, error: hostedError } = await supabase
        .from('games')
        .select('id, course_name, course_id, start_time, expires_at, status, slots_open, slots_total, note, created_at, host_user_id, visibility, updated_at')
        .eq('host_user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', nowIso) // Use gt instead of gte
        .order('start_time', { ascending: true });

      if (hostedError) {
        console.error('Error fetching hosted games:', hostedError);
      }

      // Fetch games you've joined (as participant)
      const { data: participants, error: participantsError } = await supabase
        .from('game_participants')
        .select(`
          game_id,
          games!inner(
            id, 
            course_name, 
            course_id, 
            start_time, 
            expires_at, 
            status, 
            slots_open, 
            slots_total, 
            note,
            created_at,
            host_user_id,
            visibility,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('games.status', 'active')
        .gt('games.expires_at', nowIso); // Use gt instead of gte

      if (participantsError) {
        console.error('Error fetching joined games:', participantsError);
      }

      // Merge hosted and joined games, deduplicating by id
      const byId = new Map<string, Game>();
      
      // Add hosted games first
      (hosted || []).forEach((g: any) => byId.set(g.id, g as Game));
      
      // Add joined games (won't overwrite if already hosted)
      (participants || [])
        .map((p: any) => p.games)
        .filter((g: any) => g && g.id)
        .forEach((g: any) => {
          if (!byId.has(g.id)) {
            byId.set(g.id, g as Game);
          }
        });

      // Separate into hosted and joined for display
      const allGames = Array.from(byId.values());
      setHostedGames(allGames.filter(g => g.host_user_id === user.id));
      setJoinedGames(allGames.filter(g => g.host_user_id !== user.id));

      console.log('[YourGames] Fetched:', {
        total: allGames.length,
        hosted: hosted?.length || 0,
        joined: participants?.length || 0,
        deduped: allGames.length,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYourGames();
  }, [user?.id]);

  // Listen for game-created events to trigger immediate refetch
  useEffect(() => {
    const handleGameCreated = (e: any) => {
      console.log('[YourGames] game-created event received:', e.detail);
      fetchYourGames();
    };
    window.addEventListener('game-created', handleGameCreated);
    return () => window.removeEventListener('game-created', handleGameCreated);
  }, [fetchYourGames]);

  // Refetch on window focus (safety net)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[YourGames] Refetch on focus');
      fetchYourGames();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchYourGames]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to games you host
    const hostedChannel = channelManager.createChannel(`your_hosted_games_${user.id}`);
    hostedChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `host_user_id=eq.${user.id}`,
      }, () => fetchYourGames())
      .subscribe();

    // Subscribe to your participant changes
    const participantsChannel = channelManager.createChannel(`your_joined_games_${user.id}`);
    participantsChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_participants',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchYourGames())
      .subscribe();

    return () => {
      channelManager.removeChannel(`your_hosted_games_${user.id}`);
      channelManager.removeChannel(`your_joined_games_${user.id}`);
    };
  }, [user?.id]);

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleCancel = async (gameId: string) => {
    if (onCancelGame) {
      onCancelGame(gameId);
    }
  };

  const handleLeave = async (gameId: string) => {
    if (onLeaveGame) {
      onLeaveGame(gameId);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center flex flex-col items-center justify-center min-h-[240px]">
        <div className="text-[15px] font-medium text-white/90">Loading your games…</div>
        <div className="text-[13px] text-white/60 mt-1">Just a moment</div>
      </div>
    );
  }

  const hasNoGames = hostedGames.length === 0 && joinedGames.length === 0;

  if (hasNoGames) {
    return (
      <div className="py-12 text-center flex flex-col items-center justify-center min-h-[240px]">
        <div className="text-[15px] font-medium text-white/90">No active games</div>
        <div className="text-[13px] text-white/60 mt-1">Create or join a game to get started</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hosting section */}
      {hostedGames.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Hosting ({hostedGames.length})
          </h3>
          <div className="space-y-2">
            {hostedGames.map((game) => (
              <div
                key={game.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    {game.course_name && (
                      <div className="flex items-center gap-2 text-white/90">
                        <MapPin className="w-4 h-4 text-white/50" />
                        <span className="text-sm font-medium">{game.course_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/70">
                      <Users className="w-4 h-4 text-white/40" />
                      <span className="text-sm">
                        {game.slots_total - game.slots_open}/{game.slots_total} filled
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Clock className="w-4 h-4 text-white/40" />
                      <span className="text-sm">Expires in {getTimeRemaining(game.expires_at)}</span>
                    </div>
                  </div>
                </div>
                {game.note && (
                  <div className="text-xs text-white/50 pt-2 border-t border-white/5">
                    {game.note}
                  </div>
                )}
                <button
                  onClick={() => handleCancel(game.id)}
                  className="w-full mt-2 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg font-medium transition-colors"
                >
                  Cancel Game
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Joined section */}
      {joinedGames.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Joined ({joinedGames.length})
          </h3>
          <div className="space-y-2">
            {joinedGames.map((game) => (
              <div
                key={game.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    {game.course_name && (
                      <div className="flex items-center gap-2 text-white/90">
                        <MapPin className="w-4 h-4 text-white/50" />
                        <span className="text-sm font-medium">{game.course_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/70">
                      <Users className="w-4 h-4 text-white/40" />
                      <span className="text-sm">
                        {game.slots_total - game.slots_open}/{game.slots_total} filled
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Clock className="w-4 h-4 text-white/40" />
                      <span className="text-sm">Expires in {getTimeRemaining(game.expires_at)}</span>
                    </div>
                  </div>
                </div>
                {game.note && (
                  <div className="text-xs text-white/50 pt-2 border-t border-white/5">
                    {game.note}
                  </div>
                )}
                <button
                  onClick={() => handleLeave(game.id)}
                  className="w-full mt-2 py-2 px-3 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-lg font-medium transition-colors"
                >
                  Leave Game
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
