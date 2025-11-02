import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Game } from '../types';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { channelManager } from '@/utils/supabaseChannelManager';
import { GameCard } from './your-games/GameCard';
import { EmptyState } from './your-games/EmptyState';
import { Segmented, SegmentItem } from './Segmented';
import { TapButton } from '@/components/ui/TapButton';
import { YourGamesSkeleton } from './your-games/YourGamesSkeleton';
import { HostApprovalSheet } from './HostApprovalSheet';
import type { Game as CardGame, Participant } from './your-games/types';
import { EVT_GAME_CREATED } from '../constants';

interface YourGamesListProps {
  activeTab?: 'golfers' | 'games' | 'your-games';
  onCancelGame?: (gameId: string) => void;
  onLeaveGame?: (gameId: string) => void;
  onCountChange?: (count: number) => void;
  onCreateGame?: () => void;
  onFindGame?: () => void;
}

export function YourGamesList({ 
  activeTab: activeTabFromParent,
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
  const [approvalSheetGameId, setApprovalSheetGameId] = useState<string | null>(null);

  const fetchYourGames = useCallback(async () => {
    // Resolve user id reliably (avoid race with session hook)
    let userId = user?.id;
    if (!userId) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      userId = authUser?.id ?? undefined;
    }

    if (!userId) {
      // No authenticated user; clear state and exit
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

      // Fetch games you're hosting - show active games based on expires_at
      const { data: hosted, error: hostedError } = await supabase
        .from('games')
        .select(`
          id, course_name, course_id, start_time, expires_at, status,
          slots_open, slots_total, note, created_at, host_user_id, visibility, updated_at,
          game_participants(
            id,
            user_id,
            guest_name,
            role,
            state,
            reserves_slot,
            user_profiles(
              id,
              display_name,
              username,
              profile_photo_url,
              home_club,
              eg_handicap_index
            )
          )
        `)
        .eq('host_user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', nowIso)
        .order('start_time', { ascending: true, nullsFirst: true });

      console.log('[YourGames] Hosted games query result:', {
        count: hosted?.length || 0,
        error: hostedError,
        data: hosted
      });

      if (hostedError) {
        console.error('Error fetching hosted games:', hostedError);
      }

      // Fetch games you've joined (as participant) - show active games based on expires_at
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
            updated_at,
            game_participants(
              id,
              user_id,
              guest_name,
              role,
              state,
              reserves_slot,
              user_profiles(
                id,
                display_name,
                username,
                profile_photo_url,
                home_club,
                eg_handicap_index
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('games.status', 'active')
        .gte('games.expires_at', nowIso);

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

  // Refetch whenever Your Games tab becomes active
  useEffect(() => {
    if (activeTabFromParent === 'your-games') {
      console.log('[YourGames] Tab activated, refetching...');
      fetchYourGames();
    }
  }, [activeTabFromParent, fetchYourGames]);

  // Listen for game-created events to trigger immediate refetch
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log('[YourGames] game-created event received:', detail);
      // Primary refetch at 400ms
      setTimeout(() => fetchYourGames(), 400);
      // Secondary safety refetch at 1500ms for read-after-write consistency
      setTimeout(() => fetchYourGames(), 1500);
    };
    window.addEventListener(EVT_GAME_CREATED, handler as EventListener);
    return () => window.removeEventListener(EVT_GAME_CREATED, handler as EventListener);
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

  // Map Game to CardGame format
  const toCardGame = (g: Game): CardGame => ({
    id: g.id,
    course_name: g.course_name || 'Course TBD',
    course_id: g.course_id,
    start_time: g.start_time,
    expires_at: g.expires_at,
    status: g.status,
    slots_total: g.slots_total,
    slots_open: g.slots_open,
    host_user_id: g.host_user_id,
    visibility: g.visibility,
    note: g.note,
  });

  // Helper: Extract host participant with profile data
  const extractHost = (game: Game): Participant | null => {
    const hostParticipant = (game as any).game_participants?.find((p: any) => p.role === 'host');
    if (!hostParticipant) return null;

    return {
      user_id: hostParticipant.user_id,
      username: hostParticipant.user_profiles?.username,
      display_name: hostParticipant.user_profiles?.display_name,
      profile_photo_url: hostParticipant.user_profiles?.profile_photo_url,
      home_club: hostParticipant.user_profiles?.home_club,
      eg_handicap_index: hostParticipant.user_profiles?.eg_handicap_index,
      role: 'host' as const,
    };
  };

  // Helper: Extract members (players + guests) with profile data
  const extractMembers = (game: Game): Participant[] => {
    const participants = (game as any).game_participants?.filter((p: any) => 
      (p.role === 'player' && p.state === 'accepted') || p.guest_name
    ) || [];

    return participants.map((p: any) => ({
      user_id: p.user_id,
      username: p.user_profiles?.username,
      display_name: p.user_profiles?.display_name ?? p.guest_name ?? 'Guest',
      profile_photo_url: p.user_profiles?.profile_photo_url,
      home_club: p.user_profiles?.home_club,
      eg_handicap_index: p.user_profiles?.eg_handicap_index,
      role: 'player' as const,
    }));
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
    return <YourGamesSkeleton count={3} />;
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
              game={toCardGame(game)}
              variant={isHostingTab ? 'hosting' : 'joined'}
              host={extractHost(game)}
              members={extractMembers(game)}
              onCancel={() => handleCancel(game.id)}
              onLeave={() => handleLeave(game.id)}
              onViewRequests={isHostingTab ? (gameId) => setApprovalSheetGameId(gameId) : undefined}
            />
          ))}
        </div>
      )}

      {/* Host Approval Sheet */}
      {approvalSheetGameId && (
        <HostApprovalSheet
          gameId={approvalSheetGameId}
          open={!!approvalSheetGameId}
          onOpenChange={(open) => {
            if (!open) setApprovalSheetGameId(null);
          }}
        />
      )}
    </div>
  );
}
