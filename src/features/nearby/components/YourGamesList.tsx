import React, { useEffect, useState } from 'react';
import { GameCard } from './your-games/GameCard';
import { EmptyState } from './your-games/EmptyState';
import { Segmented, SegmentItem } from './Segmented';
import { TapButton } from '@/components/ui/TapButton';
import { YourGamesSkeleton } from './your-games/YourGamesSkeleton';
import { HostApprovalSheet } from './HostApprovalSheet';
import type { Game as CardGame, Participant } from './your-games/types';
import { useUserGames, type UserGame } from '@/features/hub/hooks/useUserGames';
import { useUserGamesRealtime } from '@/features/hub/hooks/useUserGamesRealtime';

interface YourGamesListProps {
  activeTab?: 'golfers' | 'games' | 'your-games';
  onCancelGame?: (gameId: string) => void;
  onLeaveGame?: (gameId: string) => void;
  onCountChange?: (count: number) => void;
  onCreateGame?: () => void;
  onFindGame?: () => void;
  focusId?: string;
}

export function YourGamesList({ 
  activeTab: activeTabFromParent,
  onCancelGame, 
  onLeaveGame, 
  onCountChange, 
  onCreateGame,
  onFindGame,
  focusId,
}: YourGamesListProps) {
  // Use shared hook for consistency with the tile
  const { data, isLoading } = useUserGames();
  useUserGamesRealtime();

  const hostedGames = data?.hosting || [];
  const joinedGames = data?.joined || [];

  const [activeTab, setActiveTab] = useState<'hosting' | 'joined'>('hosting');
  const [approvalSheetGameId, setApprovalSheetGameId] = useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Notify parent of total count
  useEffect(() => {
    if (onCountChange) {
      onCountChange(hostedGames.length + joinedGames.length);
    }
  }, [hostedGames.length, joinedGames.length, onCountChange]);

  // Handle focus scroll & highlight after data loads
  useEffect(() => {
    if (!focusId || !listRef.current || isLoading) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-game-id="${focusId}"]`);
      if (!el) return;

      // Scroll into view
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });

      // Add highlight class temporarily
      el.classList.add('sheet-focus-highlight');
      const highlightTimer = setTimeout(() => {
        el.classList.remove('sheet-focus-highlight');
      }, 1400);

      return () => clearTimeout(highlightTimer);
    }, 200);

    return () => clearTimeout(timer);
  }, [focusId, isLoading, hostedGames, joinedGames]);


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

  // Map UserGame to CardGame format
  const toCardGame = (g: UserGame): CardGame => ({
    id: g.id,
    course_name: g.course_name || 'Course TBD',
    course_id: null,
    start_time: g.start_time,
    expires_at: g.expires_at,
    status: g.status,
    slots_total: g.slots_total,
    slots_open: g.slots_open,
    host_user_id: g.host_user_id,
    visibility: 'public',
    note: null,
  });

  // Extract host from participants
  const extractHost = (game: UserGame): Participant | null => {
    const hostParticipant = game.participants?.find(p => p.user_id === game.host_user_id);
    if (hostParticipant?.user_profiles) {
      return {
        user_id: hostParticipant.user_id,
        username: null,
        display_name: hostParticipant.user_profiles.display_name,
        profile_photo_url: hostParticipant.user_profiles.profile_photo_url,
        home_club: null,
        eg_handicap_index: hostParticipant.user_profiles.eg_handicap_index,
        role: 'host' as const,
      };
    }
    return null;
  };

  // Extract members (players excluding host)
  const extractMembers = (game: UserGame): Participant[] => {
    const participants = game.participants?.filter(p => p.user_id !== game.host_user_id) || [];

    return participants.map(p => ({
      user_id: p.user_id,
      username: null,
      display_name: p.user_profiles?.display_name || 'Player',
      profile_photo_url: p.user_profiles?.profile_photo_url,
      home_club: null,
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
    <div ref={listRef} className="space-y-4">
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
        <div>
          {currentGames.map((game, index) => (
            <div 
              key={game.id} 
              data-game-id={game.id}
              style={{
                borderBottom: index === currentGames.length - 1 ? 'none' : undefined
              }}
            >
              <GameCard
                game={toCardGame(game)}
                variant={isHostingTab ? 'hosting' : 'joined'}
                host={extractHost(game)}
                members={extractMembers(game)}
                onCancel={() => handleCancel(game.id)}
                onLeave={() => handleLeave(game.id)}
                onViewRequests={isHostingTab ? (gameId) => setApprovalSheetGameId(gameId) : undefined}
              />
            </div>
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
