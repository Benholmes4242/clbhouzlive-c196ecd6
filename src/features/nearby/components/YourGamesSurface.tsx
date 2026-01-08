/**
 * YourGamesSurface
 * Reusable surface containing all Your Games logic/UI
 * Used inside HubYourGamesSheet
 */
import React, { useEffect, useState } from 'react';
import { EmptyJoinedState } from './your-games/EmptyJoinedState';
import { Segmented, SegmentItem } from './Segmented';
import { YourGamesSkeleton } from './your-games/YourGamesSkeleton';
import { HostApprovalSheet } from './HostApprovalSheet';
import { GameRowWithRequestCount } from './GameRowWithRequestCount';
import type { GameData } from '@/features/games/components/GameRow';
import { useUserGames, type UserGame } from '@/features/hub/hooks/useUserGames';
import { useUserGamesRealtime } from '@/features/hub/hooks/useUserGamesRealtime';
import { useMyJoinRequests } from '@/features/nearby/hooks/useMyJoinRequests';
import { haptic } from '@/utils/haptics';
import '@/features/games/components/GameRow.css';
import './your-games/YourGames.css';
import './your-games/YourGamesSurface.css';

interface YourGamesSurfaceProps {
  bottomPadding?: number;
  onOpenCreate?: () => void;
  onOpenJoinRequests?: () => void;
  onOpenSearchGames?: () => void;
  focusId?: string;
}

export function YourGamesSurface({
  bottomPadding = 0,
  onOpenCreate,
  onOpenJoinRequests,
  onOpenSearchGames,
  focusId,
}: YourGamesSurfaceProps) {
  const { data, isLoading } = useUserGames();
  useUserGamesRealtime();
  
  const { data: myRequests = [] } = useMyJoinRequests();

  const hostedGames = data?.hosting || [];
  const joinedGames = data?.joined || [];

  const [activeTab, setActiveTab] = useState<'hosting' | 'joined'>('hosting');
  const [approvalSheetGameId, setApprovalSheetGameId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Scroll to top when switching tabs
  useEffect(() => {
    setExpandedId(null);
  }, [activeTab]);

  // Handle focus scroll & highlight after data loads
  useEffect(() => {
    if (!focusId || !listRef.current || isLoading) return;

    const timer = setTimeout(() => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-game-id="${focusId}"]`);
      if (!el) return;

      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.classList.add('sheet-focus-highlight');
      const highlightTimer = setTimeout(() => {
        el.classList.remove('sheet-focus-highlight');
      }, 1400);

      return () => clearTimeout(highlightTimer);
    }, 200);

    return () => clearTimeout(timer);
  }, [focusId, isLoading, hostedGames, joinedGames]);

  // Map UserGame to GameData format
  const toGameData = (g: UserGame): GameData => ({
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
    participants: g.participants?.map(p => ({
      user_id: p.user_id,
      username: null,
      display_name: p.user_profiles?.display_name || null,
      profile_photo_url: p.user_profiles?.profile_photo_url || null,
      home_club: null,
      eg_handicap_index: p.user_profiles?.eg_handicap_index || null,
      role: p.user_id === g.host_user_id ? 'host' : 'player',
    })),
  });

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
  
  // Filter pending join requests for "Awaiting approval" panel
  const pendingRequests = myRequests.filter((r) => r.status === 'pending' && r.games);

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <div className="px-5" style={{ paddingBottom: bottomPadding }}>
        <YourGamesSkeleton count={3} />
      </div>
    );
  }

  // If no games found at all
  if (hostedGames.length === 0 && joinedGames.length === 0) {
    return (
      <div className="px-5" style={{ paddingBottom: bottomPadding }}>
        <div className="yourGamesEmpty">
          <div className="yourGamesEmpty__icon">⛳</div>
          <h2 className="yourGamesEmpty__title">No games yet</h2>
          <p className="yourGamesEmpty__body">
            You haven't hosted or joined any games. Create one to get started!
          </p>
          {onOpenCreate && (
            <button
              onClick={onOpenCreate}
              className="yourGamesSurface__ctaBtn"
            >
              Create a Game
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={listRef} className="px-5" style={{ paddingBottom: bottomPadding }}>
      {/* Segmented tabs */}
      <div className="yourGames__toggleRow yourGamesSurface__tabs">
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
      {isHostingTab && onOpenCreate && (
        <div className="yourGamesSurface__createRow">
          <button
            onClick={onOpenCreate}
            className="yourGamesSurface__createBtn"
          >
            Create a Game
          </button>
        </div>
      )}

      {/* "Awaiting approval" panel (Joined tab only) - tappable to open Join Requests */}
      {!isHostingTab && pendingRequests.length > 0 && (
        <section className="yourGames__pendingPanel">
          <div className="yourGames__pendingHeader">
            <span className="yourGames__pendingDot" />
            <span>Awaiting approval</span>
          </div>
          <div className="yourGames__pendingList">
            {pendingRequests.map((req) => {
              const game = req.games;
              if (!game) return null;
              
              const start = new Date(game.start_time);
              const dateStr = start.toLocaleDateString(undefined, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              });
              const timeStr = start.toLocaleTimeString(undefined, { 
                hour: 'numeric', 
                minute: '2-digit' 
              });
              
              return (
                <button
                  key={req.id}
                  type="button"
                  className="yourGames__pendingItem yourGames__pendingItem--tappable"
                  onClick={() => onOpenJoinRequests?.()}
                >
                  <div className="yourGames__pendingMain">
                    <div className="yourGames__pendingTitle">
                      {game.course_name || 'Golf game'}
                    </div>
                    <div className="yourGames__pendingMeta">
                      {dateStr} • {timeStr}
                    </div>
                  </div>
                  <div className="yourGames__pendingStatus">
                    Pending
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Games list */}
      {currentGames.length === 0 ? (
        !isHostingTab && onOpenSearchGames ? (
          <EmptyJoinedState onFindGame={onOpenSearchGames} />
        ) : (
          <div className="yourGamesEmpty yourGamesEmpty--compact">
            <div className="yourGamesEmpty__icon">⛳</div>
            <h2 className="yourGamesEmpty__title">
              No hosted games yet
            </h2>
            <p className="yourGamesEmpty__body">
              Create a game to invite golfers nearby.
            </p>
            {onOpenCreate && (
              <button
                onClick={onOpenCreate}
                className="yourGamesSurface__ctaBtn yourGamesSurface__ctaBtn--secondary"
              >
                Create a game
              </button>
            )}
          </div>
        )
      ) : (
        <div className="yourGamesSurface__list">
          {currentGames.map((game, index) => (
            <GameRowWithRequestCount
              key={game.id}
              mode="yourGames"
              game={toGameData(game)}
              isHost={isHostingTab}
              isJoined={!isHostingTab}
              canExpand
              defaultExpanded={expandedId === game.id}
              onToggleExpand={() => setExpandedId(expandedId === game.id ? null : game.id)}
              onViewRequests={isHostingTab ? () => setApprovalSheetGameId(game.id) : undefined}
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
