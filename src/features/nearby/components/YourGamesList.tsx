import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Game } from '../types';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { channelManager } from '@/utils/supabaseChannelManager';
import { GameCard } from './your-games/GameCard';
import { EmptyState } from './your-games/EmptyState';
import { Segmented, SegmentItem } from './Segmented';
import { TapButton } from '@/components/ui/TapButton';
import { SkeletonRow } from '@/components/ui/SkeletonRow';

interface YourGamesListProps {
  onCancelGame?: (gameId: string) => void;
  onLeaveGame?: (gameId: string) => void;
  onCountChange?: (count: number) => void;
  onCreateGame?: () => void;
  onFindGame?: () => void;
}

export function YourGamesList({ 
  onCancelGame, 
  onLeaveGame, 
  onCountChange, 
  onCreateGame,
  onFindGame 
}: YourGamesListProps) {
  const { user } = useSupabaseSession();
  const [hostedGames, setHostedGames] = useState<Game[]>([]);
  const [joinedGames, setJoinedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hosting' | 'joined'>('hosting');

  const fetchYourGames = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      setHostedGames([]);
      setJoinedGames([]);
      if (onCountChange) onCountChange(0);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const nowIso = new Date().toISOString();
      console.log('[YourGames] Fetching at:', nowIso);
      console.log('[YourGames] User ID:', user.id);

      // Fetch games you're hosting - show future games based on start_time
      const { data: hosted, error: hostedError } = await supabase
        .from('games')
        .select('id, course_name, course_id, start_time, expires_at, status, slots_open, slots_total, note, created_at, host_user_id, visibility, updated_at')
        .eq('host_user_id', user.id)
        .eq('status', 'active')
        .gte('start_time', nowIso) // Changed from expires_at to start_time
        .order('start_time', { ascending: true });

      console.log('[YourGames] Hosted games query result:', {
        count: hosted?.length || 0,
        error: hostedError,
        data: hosted
      });

      if (hostedError) {
        console.error('Error fetching hosted games:', hostedError);
      }

      // Fetch games you've joined (as participant) - show future games based on start_time
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
        .gte('games.start_time', nowIso); // Changed from expires_at to start_time

      console.log('[YourGames] Joined games query result:', {
        count: participants?.length || 0,
        error: participantsError,
        data: participants
      });

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
      const hostedFiltered = allGames.filter(g => g.host_user_id === user.id);
      const joinedFiltered = allGames.filter(g => g.host_user_id !== user.id);
      
      setHostedGames(hostedFiltered);
      setJoinedGames(joinedFiltered);

      // Notify parent of total count for badge
      if (onCountChange) {
        onCountChange(allGames.length);
      }

      console.log('[YourGames] Fetched:', {
        total: allGames.length,
        hosted: hosted?.length || 0,
        joined: participants?.length || 0,
        deduped: allGames.length,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, onCountChange]);

  useEffect(() => {
    fetchYourGames();
  }, [fetchYourGames]);

  // Listen for game-created events to trigger immediate refetch
  useEffect(() => {
    const handleGameCreated = (e: any) => {
      console.log('[YourGames] game-created event received:', e.detail);
      // Add small delay to ensure DB write completes and RLS catches up
      setTimeout(() => {
        fetchYourGames();
      }, 100);
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

  const segmentItems: SegmentItem[] = [
    { 
      value: 'hosting', 
      label: `Hosting (${hostedGames.length})`,
      ariaLabel: `Hosting ${hostedGames.length} games`
    },
    { 
      value: 'joined', 
      label: `Joined (${joinedGames.length})`,
      ariaLabel: `Joined ${joinedGames.length} games`
    },
  ];

  const currentGames = activeTab === 'hosting' ? hostedGames : joinedGames;
  const isHostingTab = activeTab === 'hosting';

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
        <SkeletonRow count={3} className="grid-flow-row auto-rows-[120px]" />
      </div>
    );
  }

  // If no games found at all
  if (hostedGames.length === 0 && joinedGames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-5xl mb-3">⛳</div>
        <h3 className="text-lg font-semibold text-white/90 mb-2">No games yet</h3>
        <p className="text-sm text-white/60 max-w-xs mb-4">
          You haven't hosted or joined any games. Create one to get started!
        </p>
        {onCreateGame && (
          <TapButton
            onClick={onCreateGame}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/14 active:bg-white/18 border border-white/15 text-sm font-medium text-white/90"
          >
            Create a Game
          </TapButton>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Segmented tabs */}
      <Segmented
        items={segmentItems}
        value={activeTab}
        onChange={(val) => setActiveTab(val as 'hosting' | 'joined')}
        columns={2}
        ariaLabel="Your games view"
        className="mb-3"
      />

      {/* Create a Game CTA */}
      {isHostingTab && onCreateGame && (
        <TapButton
          onClick={onCreateGame}
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/14 active:bg-white/18 border border-white/15 text-sm font-medium text-white/90 transition-colors"
        >
          Create a Game
        </TapButton>
      )}

      {/* Games list */}
      {currentGames.length === 0 ? (
        <EmptyState 
          type={activeTab}
          onCreateGame={isHostingTab ? onCreateGame : undefined}
          onFindGame={!isHostingTab ? onFindGame : undefined}
        />
      ) : (
        <div className="space-y-3">
          {currentGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isHosting={isHostingTab}
              onCancel={() => handleCancel(game.id)}
              onLeave={() => handleLeave(game.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
