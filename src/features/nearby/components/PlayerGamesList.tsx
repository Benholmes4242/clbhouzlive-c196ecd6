import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import '../GamesTab.css';

interface Game {
  id: string;
  course_name?: string;
  start_time: string;
  slots_total: number;
  slots_open: number;
  host_user_id: string;
  visibility: 'public' | 'friends' | 'club';
  status: string;
  expires_at: string;
}

interface PlayerGamesListProps {
  userId: string;
}

export function PlayerGamesList({ userId }: PlayerGamesListProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        // No client-side filtering - let RLS handle visibility
        const { data, error } = await supabase
          .from('games')
          .select('id, course_name, start_time, slots_total, slots_open, host_user_id, visibility, status, expires_at')
          .eq('host_user_id', userId)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .order('start_time', { ascending: true });

        if (error) throw error;

        // Cast visibility to proper type
        const typedGames = (data || []).map(game => ({
          ...game,
          visibility: game.visibility as 'public' | 'friends' | 'club'
        }));

        setGames(typedGames);
      } catch (error) {
        console.error('Error fetching player games:', error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [userId]);

  if (loading) {
    return (
      <div className="py-4">
        <p className="text-neutral-400 text-sm text-center">Loading…</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="py-6 px-4 text-center space-y-2">
        <p className="text-neutral-300 text-sm font-medium">No visible games</p>
        <p className="text-neutral-500 text-xs">
          Follow this player to see their friends-only games
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-3 overflow-y-auto max-h-[calc(80vh-120px)]">
      {games.map(game => (
        <PlayerGameCard key={game.id} game={game} />
      ))}
    </div>
  );
}

function PlayerGameCard({ game }: { game: Game }) {
  const [isPending, setIsPending] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  
  const seatsFilled = game.slots_total - game.slots_open;
  const filledLabel = `${seatsFilled}/${game.slots_total}`;
  const seatsLeft = game.slots_open;

  const formatTime = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (isoTime: string) => {
    const date = new Date(isoTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleJoin = async () => {
    if (isPending || hasRequested) return;
    
    haptic('medium');
    setIsPending(true);

    try {
      const { data, error } = await supabase.functions.invoke('join-request', {
        body: { gameId: game.id },
      });

      if (error) {
        console.error('Join request error:', error);
        alert('Could not send request. Please try again.');
      } else {
        setHasRequested(true);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  const getButtonText = () => {
    if (hasRequested) return 'Request Sent';
    if (isPending) return 'Sending…';
    if (seatsLeft <= 0) return 'Full';
    return 'Request to Join';
  };

  return (
    <div className="gameCard" role="article" aria-label={`${game.course_name || 'Golf game'}, ${formatDate(game.start_time)}`}>
      <div className="gcTop">
        <div className="gcTitle">{game.course_name || 'Golf Game'}</div>
      </div>

      <div className="gcMeta">
        <span className="m">🗓 {formatDate(game.start_time)} • {formatTime(game.start_time)}</span>
        <div className="seatPill">
          <span className="seatDot" style={{ backgroundColor: seatsLeft > 0 ? '#4ade80' : '#ef4444' }} />
          <span className="seatText">{filledLabel}</span>
        </div>
      </div>

      <div className="gcActions">
        <TapButton
          className="primary"
          disabled={isPending || seatsLeft <= 0 || hasRequested}
          onClick={handleJoin}
        >
          {getButtonText()}
        </TapButton>
      </div>
    </div>
  );
}
