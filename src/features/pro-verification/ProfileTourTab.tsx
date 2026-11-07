/** Profile-only season fallback. The player page retains its header-season
 * rules; row presentation and result navigation remain canonical. A pro with
 * no tour link shows his recorded results grouped by year; with no results
 * the tab does not exist, so this renders nothing. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerSeasonResults } from '@/features/tourhub/player-v2/data/usePlayerData';
import { PlayerResultRow } from '@/features/tourhub/player-v2/sections/TournamentsSection';
import { newest } from '@/features/tourhub/player-v2/playerRules';
import '@/features/tourhub/player-v2/playerPage.css';
import type { ProMember } from './proMembersCache';
import { useProEvents } from '@/features/pro-profile/useProProfile';
import { eventYear, sortedEvents } from '@/features/pro-profile/proProfileRules';
import { ProResultRow, ResultDetail } from '@/features/pro-profile/ProSeasonSection';
import './pro-label.css';

export function ProfileTourTab({ pro, displayName, isOwner }: { pro: ProMember; displayName: string; isOwner: boolean }) {
  const year = new Date().getUTCFullYear();
  const id = pro.pro_player_id ?? '';
  const current = usePlayerSeasonResults(id, year);
  const usePrevious = !!id && current.isSuccess && current.data.length === 0;
  const previous = usePlayerSeasonResults(id, usePrevious ? year - 1 : null);
  const own = useProEvents(id ? '' : pro.user_id);
  const [detailId, setDetailId] = useState<string | null>(null);
  const first = displayName.split(' ')[0] || displayName;
  if (!id) {
    if (!own.isSuccess || own.isError) return null;
    const rows = sortedEvents((own.data ?? []).filter((e) => e.finish != null));
    if (rows.length === 0) return null;
    const groups = [...new Set(rows.map(eventYear))].sort((a, b) => Number(b) - Number(a));
    const detail = rows.find((e) => e.id === detailId);
    return <section className="profile-pro-tour">
      {groups.map((y) => <section key={y ?? 'unknown'}>
        <div className="profile-pro-tour-heading"><span>{y ?? 'Undated'}</span></div>
        {rows.filter((e) => eventYear(e) === y).map((e) => <ProResultRow key={e.id} event={e} first={first} open={() => setDetailId(e.id)} />)}
      </section>)}
      {detail && <ResultDetail event={detail} close={() => setDetailId(null)} />}
    </section>;
  }
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
