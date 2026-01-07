/**
 * GameRow - Unified game card component
 * 
 * North Star Design:
 * - Collapsed: "Scan my week in half a second"
 * - Expanded: "Immediately understand who, what, when — feel in control"
 * 
 * No clutter. No redundancy. No UI shouting.
 */
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameStatusPill } from '@/features/hub/components/GameStatusPill';
import { SecondaryButton, DestructiveButton } from '@/features/hub/components/HubButtons';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { haptic } from '@/utils/haptics';
import { FLAGS } from '@/config/flags';
import './GameRow.css';

// Mock players for testing 4/4 full game UI (behind MOCK_FULL_GAME_PLAYERS flag)
const MOCK_PLAYERS: Participant[] = [
  {
    user_id: 'mock-player-1',
    username: 'georgewilson',
    display_name: 'George Wilson',
    profile_photo_url: 'https://i.pravatar.cc/150?u=georgewilson',
    home_club: 'Royal County Down',
    eg_handicap_index: 8.2,
    role: 'player',
  },
  {
    user_id: 'mock-player-2',
    username: 'sarahconnor',
    display_name: 'Sarah Connor',
    profile_photo_url: 'https://i.pravatar.cc/150?u=sarahconnor',
    home_club: 'Portrush',
    eg_handicap_index: 12.5,
    role: 'player',
  },
  {
    user_id: 'mock-player-3',
    username: 'jamesmurphy',
    display_name: 'James Murphy',
    profile_photo_url: 'https://i.pravatar.cc/150?u=jamesmurphy',
    home_club: 'Ardglass Golf Club',
    eg_handicap_index: 5.1,
    role: 'player',
  },
];

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
  onViewGame?: () => void;

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

/**
 * Format date/time with · separators for clean metadata display
 * "Sun · Apr 19 · 13:00"
 */
function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${weekday} · ${monthDay} · ${time}`;
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
  onViewGame,
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
  const dateTimeStr = formatDateTime(game.start_time);

  // Extract host and members from participants
  const host = anonymous ? null : game.participants?.find(p => p.user_id === game.host_user_id);
  let members = anonymous ? [] : (game.participants?.filter(p => p.user_id !== game.host_user_id) || []);

  // TEST: Inject mock players for Ardglass game to test 4/4 full game UI
  const isArdglassGame = game.course_name?.toLowerCase().includes('ardglass');
  const shouldInjectMockPlayers = FLAGS.MOCK_FULL_GAME_PLAYERS && isArdglassGame && !anonymous;
  
  if (shouldInjectMockPlayers) {
    members = [...members, ...MOCK_PLAYERS];
  }
  
  // Calculate filled slots (with mock players if applicable)
  const filled = shouldInjectMockPlayers 
    ? game.slots_total // Show as full when mocking
    : Math.max(0, game.slots_total - game.slots_open);

  // Show details panel only if expanded and not anonymous
  const showDetails = isExpanded && !anonymous;

  // Show action buttons based on mode
  const showActions = showDetails && !readOnly;
  const showRequestButton = mode === 'search' && !!onRequestToJoin;

  // Build host meta line: "Host · HCP 4"
  const hostMeta = host ? [
    'Host',
    host.eg_handicap_index != null ? `HCP ${host.eg_handicap_index}` : null
  ].filter(Boolean).join(' · ') : null;

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
      aria-label={`${game.course_name}, ${dateTimeStr}`}
    >
      {/* Header / Collapsed row */}
      <div 
        className={cn('gameRow__header', canExpand && 'gameRow__header--clickable')}
        onClick={canExpand ? handleToggle : undefined}
      >
        <div className="gameRow__titleBlock">
          {/* Course name - hero text */}
          <div className="gameRow__courseName">{game.course_name || 'Golf Game'}</div>
          {/* Date/time - calm metadata with · separators */}
          <div className="gameRow__timeLine">
            <span className="gameRow__metaLine">{dateTimeStr}</span>
          </div>
          {/* Pending request hint (Hosting mode - only on yourGames page) */}
          {mode === 'yourGames' && isHost && pendingRequestCount > 0 && (
            <div className="text-xs mt-1.5 opacity-60" style={{ color: 'var(--hub-text-muted)' }}>
              {pendingRequestCount === 1
                ? '1 player waiting'
                : `${pendingRequestCount} players waiting`}
            </div>
          )}
        </div>

        <div className="gameRow__right">
          <div className={cn(
            'gameRow__statusGroup',
            isExpanded && 'gameRow__statusGroup--lifted'
          )}>
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
                size={14}
                strokeWidth={1.5}
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

      {/* Expanded details panel - avatar-led storytelling */}
      {showDetails && (
        <div className="gameRow__details">
          {/* Host section - avatar-led, no "HOST" label */}
          {host && (
            <div className="miniProfileRow miniProfileRow--host">
              <div className="miniProfileRow__avatar">
                <SquircleAvatar
                  size={44}
                  src={host.profile_photo_url}
                  alt={host.display_name || 'Host'}
                  fallback={(host.display_name || 'H').charAt(0).toUpperCase()}
                />
              </div>
              <div className="miniProfileRow__info">
                <div className="miniProfileRow__name">
                  {host.display_name || 'Unknown'}
                </div>
                {hostMeta && (
                  <div className="miniProfileRow__subtitle">{hostMeta}</div>
                )}
              </div>
            </div>
          )}

          {/* Players row - avatar stack (only if there are members) */}
          {members.length > 0 && (
            <div className="gameRow__players">
              <span className="gameRow__playersLabel">Players</span>
              <div className="gameRow__avatarStack">
                {members.slice(0, 3).map((member, idx) => (
                  <div key={member.user_id || idx} className="gameRow__stackedAvatar">
                    <SquircleAvatar
                      size={28}
                      src={member.profile_photo_url}
                      alt={member.display_name || 'Player'}
                      fallback={(member.display_name || 'P').charAt(0).toUpperCase()}
                    />
                  </div>
                ))}
              </div>
              {members.length > 3 && (
                <span className="gameRow__moreCount">+{members.length - 3}</span>
              )}
            </div>
          )}

          {/* View game action - minimal text button */}
          {mode === 'hub' && (
            <div className="gameRow__viewAction">
              <button 
                className="gameRow__viewLink"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewGame?.();
                }}
              >
                View game
              </button>
            </div>
          )}

          {/* Actions for yourGames mode */}
          {showActions && mode === 'yourGames' && (
            <div className="gameRow__actions">
              {isHost && (
                <>
                  {onViewRequests && pendingRequestCount > 0 && (
                    <SecondaryButton
                      onClick={() => onViewRequests()}
                      label={`Requests (${pendingRequestCount})`}
                    />
                  )}
                  {onCancelGame && (
                    <DestructiveButton
                      onClick={() => onCancelGame()}
                      label="Cancel"
                    />
                  )}
                </>
              )}
              {isJoined && !isHost && onLeaveGame && (
                <DestructiveButton
                  onClick={() => onLeaveGame()}
                  label="Leave"
                />
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
