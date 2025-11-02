import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { useJoinGame } from '../hooks/useJoinGame';
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
        const { data: { user } } = await supabase.auth.getUser();
        
        let query = supabase
          .from('games')
          .select('id, course_name, start_time, slots_total, slots_open, host_user_id, visibility, status, expires_at')
          .eq('host_user_id', userId)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .order('start_time', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;

        // Client-side visibility filtering - cast visibility to proper type
        const visibleGames = (data || [])
          .map(game => ({
            ...game,
            visibility: game.visibility as 'public' | 'friends' | 'club'
          }))
          .filter((game: Game) => {
            if (game.visibility === 'public') return true;
            
            // For friends-only, we'd need to check follows relationship
            // For now, show all public games
            return false;
          });

        setGames(visibleGames);
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
      <div className="py-4">
        <p className="text-neutral-400 text-sm text-center">No visible games</p>
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
  const { requestJoin, isPending } = useJoinGame(game.id);
  
  const seatsFilled = game.slots_total - game.slots_open;
  const filledLabel = `${seatsFilled}/${game.slots_total} filled`;
  const seatsLeft = game.slots_open;

  const formatTime = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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

  const handleJoin = () => {
    haptic('medium');
    requestJoin();
  };

  return (
    <div className="gameCard" role="article" aria-label={`${game.course_name || 'Golf game'}, ${formatDate(game.start_time)}, ${filledLabel}`}>
      <div className="gcTop">
        <div className="gcTitle">{game.course_name || 'Golf Game'}</div>
      </div>

      <div className="gcMeta">
        <span className="m">🗓 {formatDate(game.start_time)} • {formatTime(game.start_time)}</span>
        <span className={`badge ${seatsLeft > 0 ? 'ok' : 'full'}`}>{filledLabel}</span>
      </div>

      <div className="gcActions">
        <TapButton
          className="primary"
          disabled={isPending || seatsLeft <= 0}
          onClick={handleJoin}
        >
          {seatsLeft <= 0 ? 'Full' : isPending ? 'Requesting…' : 'Request to Join'}
        </TapButton>
      </div>
    </div>
  );
}
