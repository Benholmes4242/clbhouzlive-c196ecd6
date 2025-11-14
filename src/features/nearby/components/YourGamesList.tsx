import React, { useEffect, useState } from 'react';
import { EmptyJoinedState } from './your-games/EmptyJoinedState';
import { Segmented, SegmentItem } from './Segmented';
import { PrimaryCTAButton } from '@/features/hub/components/HubButtons';
import { YourGamesSkeleton } from './your-games/YourGamesSkeleton';
import { HostApprovalSheet } from './HostApprovalSheet';
import { YourGameRow } from './your-games/YourGameRow';
import type { Game as CardGame, Participant } from './your-games/types';
import { useUserGames, type UserGame } from '@/features/hub/hooks/useUserGames';
import { useUserGamesRealtime } from '@/features/hub/hooks/useUserGamesRealtime';
import { haptic } from '@/utils/haptics';
import './your-games/YourGames.css';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Scroll to top when switching tabs
  useEffect(() => {
    const el = document.getElementById('your-games-scroll');
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setExpandedId(null); // Collapse all on tab switch
  }, [activeTab]);

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
      <div className="yourGamesEmpty">
        <div className="yourGamesEmpty__icon">⛳</div>
        <h2 className="yourGamesEmpty__title">No games yet</h2>
        <p className="yourGamesEmpty__body">
          You haven't hosted or joined any games. Create one to get started!
        </p>
        {onCreateGame && (
          <PrimaryCTAButton
            onClick={onCreateGame}
            label="Create a Game"
          />
        )}
      </div>
    );
  }

  return (
    <div ref={listRef}>
      {/* Segmented tabs */}
      <div className="yourGames__toggleRow">
        <Segmented
          items={segmentItems}
          value={activeTab}
          onChange={(val) => {
            haptic('light');
            setActiveTab(val as 'hosting' | 'joined');
          }}
          columns={2}
          ariaLabel="Your games view"
        />
      </div>

      {/* Create a Game CTA */}
      {isHostingTab && onCreateGame && (
        <div className="yourGames__cta">
          <PrimaryCTAButton
            onClick={onCreateGame}
            label="Create a Game"
          />
        </div>
      )}

      {/* Games list */}
      {currentGames.length === 0 ? (
        !isHostingTab && onFindGame ? (
          <EmptyJoinedState onFindGame={onFindGame} />
        ) : (
          <div className="yourGamesEmpty">
            <div className="yourGamesEmpty__icon">⛳</div>
            <h2 className="yourGamesEmpty__title">
              You're not hosting any games yet.
            </h2>
            <p className="yourGamesEmpty__body">
              Create a game to start hosting.
            </p>
          </div>
        )
      ) : (
        <div>
          {currentGames.map((game, index) => (
            <YourGameRow
              key={game.id}
              game={toCardGame(game)}
              variant={isHostingTab ? 'hosting' : 'joined'}
              host={extractHost(game)}
              members={extractMembers(game)}
              expanded={expandedId === game.id}
              onToggle={() => setExpandedId(expandedId === game.id ? null : game.id)}
              onCancel={handleCancel}
              onLeave={handleLeave}
              onViewRequests={isHostingTab ? setApprovalSheetGameId : undefined}
              index={index}
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
