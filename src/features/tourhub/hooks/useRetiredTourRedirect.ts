/** URL ingress owns retirement redirects; metadata resolves event IDs once.
 * Historical metadata remains readable; active lists use the same registry.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isRetiredTour } from '../constants/tourMap';
import { useTournamentMeta } from '../leaderboard/useTournamentMeta';

export function retiredTourLink(params: URLSearchParams): boolean {
  return ['tour', 'board', 'tourId', 'tour_code'].some(key => isRetiredTour(params.get(key)));
}
export function useRetiredTourRedirect(params: URLSearchParams, tournamentId?: string | null) {
  const navigate = useNavigate();
  const { data: meta } = useTournamentMeta(tournamentId);
  const retired = retiredTourLink(params) || isRetiredTour(meta?.tour_code) || isRetiredTour(meta?.tour_full_name);
  useEffect(() => { if (retired) navigate('/tourhub', { replace: true }); }, [retired, navigate]);
  return retired;
}