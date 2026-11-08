/** The photo link and hero-board footer share one action and sheet state.
 * Standalone HybridHero callers retain the same action through this hook. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveTournaments } from '../../hooks/useLiveTournaments';
import { useTournamentMeta } from '../../leaderboard/useTournamentMeta';
export function useHeroFullBoard(tournamentId: string | null, inPlay: boolean, available: boolean) {
  const navigate = useNavigate();
  const { data: liveList = [] } = useLiveTournaments();
  const [open, setOpen] = useState(false);
  const { data: meta } = useTournamentMeta(available ? tournamentId : null);
  const onOpen = () => {
    if (!tournamentId) return;
    if (inPlay && liveList.some(row => row?.id === tournamentId)) {
      navigate(`/tourhub?tab=live&event=${tournamentId}`, { state: { from: 'tournament' } });
      return;
    }
    setOpen(true);
  };
  return { open, onOpen, onClose: () => setOpen(false), meta: meta ?? null };
}