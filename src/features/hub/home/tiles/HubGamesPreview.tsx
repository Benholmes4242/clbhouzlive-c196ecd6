/**
 * HubGamesPreview - Games Preview Section (Fixed Height ~160px)
 * Shows next game (primary) + one additional game (secondary)
 * NO scrolling - just preview cards
 */

import React, { useState } from 'react';
import { Tile } from '../components/Tile';
import { useUserGames } from '@/features/hub/hooks/useUserGames';
import { useUserGamesRealtime } from '@/features/hub/hooks/useUserGamesRealtime';

import { useTotalPendingHostRequests } from '../hooks/useTotalPendingHostRequests';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow } from 'date-fns';
import { MapPin, Users, Clock } from 'lucide-react';
import { YourGamesTripsSheetV2 } from '@/features/hub/components/your-games-trips-v2';

type GamePreview = {
  id: string;
  kind: 'Hosting' | 'Joined';
  course_name: string | null;
  start_time: string;
  slots_total: number | null;
  slots_open: number | null;
  host_user_id: string;
};

function formatGameDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, 'EEE, MMM d · h:mm a');
}

interface GameCardProps {
  game: GamePreview;
  isPrimary?: boolean;
  onClick: () => void;
}

function GameCard({ game, isPrimary = false, onClick }: GameCardProps) {
  const slotsUsed = (game.slots_total || 4) - (game.slots_open || 0);
  const slotsTotal = game.slots_total || 4;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl transition-all active:scale-[0.98] ${
        isPrimary ? 'p-3' : 'p-2.5'
      }`}
      style={{
        background: 'var(--hub-glass-bg-input)',
        border: '1px solid var(--hub-stroke)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div 
            className={`font-semibold truncate ${isPrimary ? 'text-[15px]' : 'text-[13px]'}`}
            style={{ color: 'var(--hub-text)' }}
          >
            {game.course_name || 'TBD'}
          </div>
          <div 
            className={`flex items-center gap-1.5 mt-0.5 ${isPrimary ? 'text-[13px]' : 'text-[12px]'}`}
            style={{ color: 'var(--hub-text-sub)' }}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{formatGameDate(game.start_time)}</span>
          </div>
        </div>
        <div 
          className="flex items-center gap-1 px-2 py-1 rounded-full shrink-0"
          style={{ 
            background: 'var(--hub-glass-bg)',
            fontSize: '12px',
            color: 'var(--hub-text-muted)',
          }}
        >
          <Users className="w-3 h-3" />
          <span>{slotsUsed}/{slotsTotal}</span>
        </div>
      </div>
      {isPrimary && (
        <div 
          className="inline-block mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{ 
            background: game.kind === 'Hosting' 
              ? 'rgba(var(--hub-accent-rgb), 0.15)' 
              : 'rgba(var(--hub-accent-orange-rgb), 0.15)',
            color: game.kind === 'Hosting' 
              ? 'var(--hub-accent)' 
              : 'var(--hub-accent-orange)',
          }}
        >
          {game.kind}
        </div>
      )}
    </button>
  );
}

export function HubGamesPreview() {
  const [currentUserId, setCurrentUserId] = React.useState<string | undefined>();
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  
  const { data, isLoading, isError, refetch } = useUserGames();
  useUserGamesRealtime();

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id);
    });
  }, []);

  // Get next 2 upcoming games
  const games = React.useMemo(() => {
    if (!data) return [];
    const combined = [...data.hosting, ...data.joined];
    const now = new Date();
    return combined
      .filter(g => new Date(g.start_time) > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 2);
  }, [data]);

  // Calculate pending requests for badge
  const allGames = React.useMemo(() => {
    if (!data) return [];
    return [...data.hosting, ...data.joined].map(g => ({
      ...g,
      participants: g.participants.map(p => ({
        user_id: p.user_id,
        username: p.user_profiles?.display_name,
        display_name: p.user_profiles?.display_name,
        profile_photo_url: p.user_profiles?.profile_photo_url,
        home_club: p.user_profiles?.home_club,
        eg_handicap_index: p.user_profiles?.eg_handicap_index,
        role: p.user_id === g.host_user_id ? 'host' as const : 'player' as const,
      })),
    }));
  }, [data]);

  const totalPendingRequests = useTotalPendingHostRequests(allGames, currentUserId);

  const openGame = (gameId: string) => {
    setGamesHubOpen(true);
  };

  const openCreateGame = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setGamesHubOpen(true);
  };

  const openYourGames = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setGamesHubOpen(true);
  };

  const hasGames = games.length > 0;
  const nextGame = games[0];
  const secondGame = games[1];

  return (
    <Tile 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3>Games</h3>
            {totalPendingRequests > 0 && (
              <div 
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                }}
              >
                {totalPendingRequests} request{totalPendingRequests > 1 ? 's' : ''}
              </div>
            )}
          </div>
          <button
            onClick={openCreateGame}
            className="text-[14px] font-medium transition"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
          >
            Create +
          </button>
        </div>
      }
    >
      {/* Fixed height content - NO SCROLLING */}
      <div className="h-full flex flex-col">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div 
              className="w-full h-16 animate-pulse rounded-xl"
              style={{ background: 'var(--hub-glass-bg-input)' }}
            />
          </div>
        )}

        {isError && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-[13px]" style={{ color: 'var(--hub-text-sub)' }}>
              Couldn't load games
            </div>
            <button 
              onClick={() => refetch()}
              className="text-[13px] underline underline-offset-2 mt-1"
              style={{ color: 'var(--hub-accent-orange)' }}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && !hasGames && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="text-[14px]" style={{ color: 'var(--hub-text-sub)' }}>
              No games planned
            </div>
            <button 
              onClick={openCreateGame}
              className="mt-2 px-4 py-2 rounded-xl text-[14px] font-medium transition-all active:scale-[0.98]"
              style={{ 
                background: 'var(--hub-primary-bg)',
                color: 'white',
              }}
            >
              Create your first game
            </button>
          </div>
        )}

        {!isLoading && !isError && hasGames && (
          <div className="flex-1 flex flex-col gap-2">
            {/* Primary: Next game */}
            <GameCard 
              game={nextGame} 
              isPrimary 
              onClick={() => openGame(nextGame.id)} 
            />
            
            {/* Secondary: Second game (if exists) */}
            {secondGame && (
              <GameCard 
                game={secondGame} 
                onClick={() => openGame(secondGame.id)} 
              />
            )}
          </div>
        )}

        {/* Footer link */}
        {hasGames && (
          <button
            onClick={openYourGames}
            className="mt-auto pt-2 text-[14px] font-medium transition text-right w-full"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
          >
            Your Games →
          </button>
        )}
      </div>
      
      <YourGamesTripsSheetV2 
        isOpen={gamesHubOpen} 
        onClose={() => {
          setGamesHubOpen(false);
        }}
      />
    </Tile>
  );
}
