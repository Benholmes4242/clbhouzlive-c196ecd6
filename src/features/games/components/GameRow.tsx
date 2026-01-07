/**
 * GameRow - Unified game card component
 * 
 * Master layout from "Your Games" - reused across:
 * - Your Games page (full functionality)
 * - Hub YourGamesTile (read-only, swipe-to-hide)
 * - Search Games page (anonymous, request-to-join)
 */
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameStatusPill } from '@/features/hub/components/GameStatusPill';
import { SecondaryButton, DestructiveButton } from '@/features/hub/components/HubButtons';
import { MiniProfileRow } from '@/features/nearby/components/your-games/MiniProfileRow';
import { haptic } from '@/utils/haptics';
import { formatExpires } from '@/lib/formatExpires';
import './GameRow.css';

export type GameRowMode = 'yourGames' | 'hub' | 'search';

export interface Participant {
  user_id: string | null;
  username?: string | null;
  display_name?: string | null;
  profile_photo_url?: string | null;
  home_club?: string | null;
  eg_handicap_index?: number | null;
  role?: 'host' | 'player';
}

export interface GameData {
  id: string;
  course_name: string | null;
  course_id?: string | null;
  start_time: string;      // ISO
  expires_at: string;      // ISO
  status?: 'active' | 'cancelled' | 'draft' | string;
  slots_total: number;
  slots_open: number;
  host_user_id: string;
  visibility?: 'public' | 'friends' | 'club' | string;
  note?: string | null;
  participants?: Participant[];
}

export interface GameRowProps {
  mode: GameRowMode;
  game: GameData;
  isHost: boolean;
  isJoined: boolean;

  // Behaviors
  canExpand?: boolean;
  defaultExpanded?: boolean;
  onToggleExpand?: () => void;

  // Actions (only wired where relevant)
  onRequestToJoin?: () => void;
  onViewRequests?: () => void;
  onCancelGame?: () => void;
  onLeaveGame?: () => void;
  onHideFromHub?: () => void;

  // Visual flags
  anonymous?: boolean;
  readOnly?: boolean;
  isNextGame?: boolean; // Subtle highlight for chronologically nearest upcoming game
  
  // Animation
  index?: number;
  
  // Request state (for search mode)
  isRequesting?: boolean;
  requestState?: 'idle' | 'pending' | 'requested' | 'error';
  
  // Pending request count (for hosting mode)
  pendingRequestCount?: number;
}

export function GameRow({
  mode,
  game,
  isHost,
  isJoined,
  canExpand = false,
  defaultExpanded = false,
  onToggleExpand,
  onRequestToJoin,
  onViewRequests,
  onCancelGame,
  onLeaveGame,
  onHideFromHub,
  anonymous = false,
  readOnly = false,
  isNextGame = false,
  index = 0,
  isRequesting = false,
  requestState = 'idle',
  pendingRequestCount = 0,
}: GameRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  // Sync with external control
  React.useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const handleToggle = () => {
    if (!canExpand) return;
    haptic('light');
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);
    onToggleExpand?.();
  };

  // Derived data
  const filled = Math.max(0, game.slots_total - game.slots_open);
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
  
  const expiryLabel = formatExpires(game.expires_at);

  // Extract host and members from participants
  const host = anonymous ? null : game.participants?.find(p => p.user_id === game.host_user_id);
  const members = anonymous ? [] : (game.participants?.filter(p => p.user_id !== game.host_user_id) || []);

  // Show details panel only if expanded and not anonymous
  const showDetails = isExpanded && !anonymous;

  // Show action buttons based on mode
  const showActions = showDetails && !readOnly;
  const showRequestButton = mode === 'search' && !!onRequestToJoin;

  return (
    <article
      className={cn(
        'gameRow',
        isExpanded && 'gameRow--expanded',
        mode === 'search' && 'gameRow--search',
        isNextGame && 'gameRow--next'
      )}
      data-game-id={game.id}
      style={{ animationDelay: `${index * 40}ms` }}
      aria-label={`${game.course_name}, ${dateStr}, ${timeStr}`}
    >
      {/* Header / Collapsed row */}
      <div 
        className={cn('gameRow__header', canExpand && 'gameRow__header--clickable')}
        onClick={canExpand ? handleToggle : undefined}
      >
        <div className="gameRow__titleBlock">
          <div className="gameRow__courseName">{game.course_name || 'Golf Game'}</div>
          <div className="gameRow__timeLine">
            <span className="gameRow__metaLine">{dateStr} • {timeStr}</span>
          </div>
          {/* Pending request hint (Hosting mode) */}
          {mode === 'yourGames' && isHost && pendingRequestCount > 0 && (
            <div className="text-xs mt-1 opacity-70">
              {pendingRequestCount === 1
                ? '1 player waiting for approval'
                : `${pendingRequestCount} players waiting for approval`}
            </div>
          )}
        </div>

        <div className="gameRow__right">
          <div className={cn(
            'gameRow__statusGroup',
            isExpanded && 'gameRow__statusGroup--lifted'
          )}>
            {/* Pending requests indicator (Hosting mode) */}
            {mode === 'yourGames' && isHost && pendingRequestCount > 0 && (
              <span className="text-xs font-medium text-white/70 mr-2">
                Requests · {pendingRequestCount}
              </span>
            )}
            
            <GameStatusPill
              filled={filled}
              total={game.slots_total}
            />
            {canExpand && (
              <ChevronDown
                className={cn(
                  'gameRow__chevron',
                  isExpanded && 'gameRow__chevron--expanded'
                )}
                size={16}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </div>

      {/* Request to Join button (Search mode only) */}
      {showRequestButton && onRequestToJoin && (
        <div className="gameRow__requestAction">
          <SecondaryButton
            onClick={() => {
              haptic('medium');
              onRequestToJoin();
            }}
            label={
              game.slots_open === 0 ? 'Full' :
              isRequesting ? 'Requesting…' :
              requestState === 'requested' ? 'Requested' :
              'Request to Join'
            }
            disabled={game.slots_open === 0 || isRequesting || requestState === 'requested'}
          />
        </div>
      )}

      {/* Expanded details panel */}
      {showDetails && (
        <div className="gameRow__details">
          {/* Host section */}
          {host && (
            <section className="gameRow__section">
              <h3 className="gameRow__sectionTitle">Host</h3>
              <MiniProfileRow
                avatarUrl={host.profile_photo_url}
                name={host.display_name || (host.user_id ? 'Unknown' : 'Guest')}
                subtitle={host.eg_handicap_index ? `HCP ${host.eg_handicap_index}` : undefined}
                badgeLabel="Host"
              />
            </section>
          )}

          {/* Members section */}
          {members.length > 0 && (
            <section className="gameRow__section">
              <h3 className="gameRow__sectionTitle">
                Members <span className="gameRow__sectionCount">{members.length}</span>
              </h3>
              {members.map((member, idx) => (
                <MiniProfileRow
                  key={member.user_id || idx}
                  avatarUrl={member.profile_photo_url}
                  name={member.display_name || (member.user_id ? 'Unknown' : 'Guest')}
                  subtitle={member.eg_handicap_index ? `HCP ${member.eg_handicap_index}` : undefined}
                />
              ))}
            </section>
          )}

          {/* Actions */}
          {showActions && (
            <div className="gameRow__actions">
              {isHost && (
                <>
                  {onViewRequests && (
                    <SecondaryButton
                      onClick={() => onViewRequests()}
                      label={pendingRequestCount > 0 ? `Requests (${pendingRequestCount})` : 'Requests'}
                    />
                  )}
                  {onCancelGame && (
                    <DestructiveButton
                      onClick={() => onCancelGame()}
                      label="Cancel Game"
                    />
                  )}
                </>
              )}
              {isJoined && !isHost && onLeaveGame && (
                <DestructiveButton
                  onClick={() => onLeaveGame()}
                  label="Leave Game"
                />
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
