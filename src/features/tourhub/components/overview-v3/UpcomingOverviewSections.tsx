/** Upcoming-only facts/players/history/course. Each block self-hides; the
 * caller inserts unchanged picks between facts and these lower sections.
 * HERO BLOCKS: the upcoming hero block (PhotoBand + UpcomingFacts +
 * UpcomingLastYear) is ONE block shared by the overview and the tournament
 * page, at the overview's sizes — the tournament page imports these same
 * builders, so the two pages cannot drift. The fact band fills up to four
 * cells in the order FIRST TEE, FIELD, PURSE, PAR, YARDS from whatever is
 * available; YARDS is the course glance yards, else venue_yardage. */
import '@/styles/hybrid-hero.css';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { playerRoute, tournamentRoute } from '../../routes';
import { CourseGlance } from '../../tournament-v2/sections/CourseGlance';
import { glanceFacts } from '../../tournament-v2/data/tournamentRules';
import { LastYearRow } from './HybridHeroBands/LastYearRow';
import { followedUpcomingPlayers, venueTee, type UpcomingPlayer } from './upcomingOverviewRules';
import type { LastYearFinisher } from '../../hooks/useTournamentLastYearTop4';
import type { CourseHole } from '../../tournament-v2/data/tournamentRules';
export function upcomingFactCells(first: string | null, zone: string | null, field: number, purse: number | null, par: number | null, yards: number | null = null) {
  const tee = venueTee(first, zone);
  return [tee ? { key: 'firstTee', value: `${tee.day} ${tee.time}` } : null,
    field > 0 ? { key: 'field', value: String(field) } : null,
    purse != null ? { key: 'purse', value: `$${purse >= 1000000 ? `${Number((purse / 1000000).toFixed(1))}M` : purse.toLocaleString('en-GB')}` } : null,
    par != null ? { key: 'par', value: String(par) } : null,
    yards != null ? { key: 'yards', value: yards.toLocaleString('en-GB') } : null]
    .filter((cell): cell is { key: string; value: string } => cell !== null)
    .slice(0, 4);
}
export function UpcomingFacts({ first, zone, field, purse, par, yards = null }: { first: string | null; zone: string | null; field: number; purse: number | null; par: number | null; yards?: number | null }) {
  const { t } = useTranslation('tourhub');
  const cells = upcomingFactCells(first, zone, field, purse, par, yards);
  if (!cells.length) return null;
  return <div data-overview-facts className="upcoming-facts">{cells.map(cell => <div key={cell.key} data-upcoming-fact={cell.key}><b>{cell.value}</b><span>{t(cell.key === 'firstTee' || cell.key === 'purse' ? `overview.hero.${cell.key}` : `overview.upcomingPlus.${cell.key}`)}</span></div>)}</div>;
}
export function YourUpcomingPlayers({ member, followed, field, drawn, zone }: { member: boolean; followed: Set<string>; field: UpcomingPlayer[]; drawn: boolean; zone: string | null }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate();
  const mine = followedUpcomingPlayers(member, followed, field, drawn);
  if (!mine.length) return null;
  return <section data-overview-your-players className="upcoming-block">
    <h2 className="upcoming-kicker">{t('overview.upcomingPlus.yourPlayers')}</h2>
    <p className="upcoming-players-line"><Trans ns="tourhub" i18nKey="overview.alsoThisWeek.yours" count={mine.length} values={{ count: mine.length }} components={{ b: <strong /> }} /></p>
    {mine.slice(0, 5).map(player => { const tee = drawn ? venueTee(player.teeTime, zone) : null; const target = playerRoute(player.id, { kind: 'tour-hub' }); return <Button variant="ghost" className="upcoming-player-row" key={player.id} onClick={() => navigate(target.to, { state: target.state })}><span className="upcoming-player-name"><span>{player.name}</span><i data-followed-star>★</i></span>{tee ? <span data-upcoming-tee className="upcoming-player-time">{tee.day} {tee.time}</span> : null}</Button>; })}
    {mine.length > 5 ? <div data-upcoming-more className="upcoming-more">{t('overview.upcomingPlus.more', { count: mine.length - 5 })}</div> : null}
  </section>;
}
export function UpcomingLastYear({ rows }: { rows: LastYearFinisher[] }) {
  const { t } = useTranslation('tourhub'); const shown = rows.slice(0, 4);
  if (!shown.length) return null;
  return <section data-overview-last-year className="upcoming-block">
    <h2 data-overview-board-header className="upcoming-kicker" style={{ textTransform: 'uppercase' }}>{t('overview.hero.lastYear')}{shown.every(row => row.year === shown[0].year) ? ` · ${shown[0].year}` : null}</h2>
    <div className="upcoming-last-header">{['pos', 'player', 'tot'].map(key => <span key={key}>{t(`overview.upcomingPlus.${key}`)}</span>)}</div>
    {shown.map((row, i) => <LastYearRow key={`${row.rank}-${row.name}`} rank={i > 0 && row.rank === shown[i - 1].rank ? '' : row.rank} name={row.name} score={row.score} isWinner={i === 0 && (row.rank === '1' || row.rank === 'T1')} />)}
  </section>;
}
export function UpcomingCourse({ holes, tournamentId }: { holes: CourseHole[]; tournamentId: string }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate();
  if (!glanceFacts(holes)) return null;
  const target = tournamentRoute(tournamentId, { kind: 'overview' });
  return <section data-overview-course className="upcoming-block upcoming-course"><div className="upcoming-course-head"><h2 className="upcoming-kicker">{t('overview.upcomingPlus.course')}</h2><Button variant="ghost" className="upcoming-course-link" onClick={() => navigate(`${target.to}?section=course`, { state: target.state })}>{t('overview.upcomingPlus.courseGuide')}</Button></div><CourseGlance holes={holes} overview /></section>;
}