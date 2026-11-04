/** Profile-only season fallback. The player page retains its header-season
 * rules; row presentation and result navigation remain canonical. */
import { Link } from 'react-router-dom';
import { usePlayerSeasonResults } from '@/features/tourhub/player-v2/data/usePlayerData';
import { PlayerResultRow } from '@/features/tourhub/player-v2/sections/TournamentsSection';
import { newest } from '@/features/tourhub/player-v2/playerRules';
import '@/features/tourhub/player-v2/playerPage.css';
import type { ProMember } from './proMembersCache';
import { ProfileProNote } from './ProfileProNote';
import './pro-label.css';

export function ProfileTourTab({ pro, displayName, isOwner }: { pro: ProMember; displayName: string; isOwner: boolean }) {
  const year = new Date().getUTCFullYear();
  const id = pro.pro_player_id ?? '';
  const current = usePlayerSeasonResults(id, year);
  const usePrevious = !!id && current.isSuccess && current.data.length === 0;
  const previous = usePlayerSeasonResults(id, usePrevious ? year - 1 : null);
  if (!id) return isOwner ? <ProfileProNote tour={pro.pro_tour ?? 'tour'} /> : null;
  const results = usePrevious ? previous : current;
  const shownYear = usePrevious ? year - 1 : year;
  const rows = newest(results.data ?? []);
  const path = `/tourhub/player/${id}`;
  return <section className="profile-pro-tour">
    <div className="profile-pro-tour-heading"><span>{pro.pro_tour?.toUpperCase()} · {shownYear}</span><Link className="pro-player-link" to={path}>Player page ›</Link></div>
    {results.isLoading ? <div role="status" className="clb-shimmer-dark h-20" /> : results.isError ? <p>Couldn't load results.</p> : <>
      {rows.slice(0, 8).map(result => <PlayerResultRow key={result.tournament_id} result={result} playerId={id} playerName={displayName} isLive={false} from="section" />)}
      <Link className="pro-all-starts" to={path}>All {rows.length} starts ›</Link>
    </>}
  </section>;
}