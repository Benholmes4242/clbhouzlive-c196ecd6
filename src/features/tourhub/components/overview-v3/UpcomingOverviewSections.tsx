/** Upcoming-only facts/players/history/course. Each block self-hides; the
 * overview appends picks after the course (upcoming hero new order). The
 * overview course shows OUT/IN scorecards; the tournament page keeps CourseGlance.
 * HERO BLOCKS: the upcoming hero block (PhotoBand + UpcomingFacts +
 * UpcomingLastYear) is ONE block shared by the overview and the tournament
 * page, at the overview's sizes — the tournament page imports these same
 * builders, so the two pages cannot drift. The fact band fills up to four
 * cells in the order FIRST TEE, FIELD, PURSE, PAR, YARDS from whatever is
 * available; YARDS is the course glance yards, else venue_yardage.
 * FIRST TEE is time only (24-hour, event zone, UTC fallback) and appears only
 * when the caller's kicker names the start day by weekday (startDayNamed),
 * passed from the same start-day decision the kicker renders. */
import '@/styles/hybrid-hero.css';
import '../../tournament-v2/sections/completedWeek.css';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { playerRoute, tournamentRoute } from '../../routes';
import { glanceFacts } from '../../tournament-v2/data/tournamentRules';
import { LastYearRow } from './HybridHeroBands/LastYearRow';
import { followedUpcomingPlayers, venueTee, type UpcomingPlayer } from './upcomingOverviewRules';
import type { LastYearFinisher } from '../../hooks/useTournamentLastYearTop4';
import type { CourseHole } from '../../tournament-v2/data/tournamentRules';
export function upcomingFactCells(first: string | null, zone: string | null, field: number, purse: number | null, par: number | null, yards: number | null = null, startDayNamed = false) {
  const tee = startDayNamed ? venueTee(first, zone ?? 'UTC') : null;
  return [tee ? { key: 'firstTee', value: tee.time } : null,
    field > 0 ? { key: 'field', value: String(field) } : null,
    purse != null ? { key: 'purse', value: `$${purse >= 1000000 ? `${Number((purse / 1000000).toFixed(1))}M` : purse.toLocaleString('en-GB')}` } : null,
    par != null ? { key: 'par', value: String(par) } : null,
    yards != null ? { key: 'yards', value: yards.toLocaleString('en-GB') } : null]
    .filter((cell): cell is { key: string; value: string } => cell !== null)
    .slice(0, 4);
}
export function UpcomingFacts({ first, zone, field, purse, par, yards = null, startDayNamed = false }: { first: string | null; zone: string | null; field: number; purse: number | null; par: number | null; yards?: number | null; startDayNamed?: boolean }) {
  const { t } = useTranslation('tourhub');
  const cells = upcomingFactCells(first, zone, field, purse, par, yards, startDayNamed);
  if (!cells.length) return null;
  return <section data-overview-event className="upcoming-event"><div data-overview-facts className="upcoming-event-facts">{cells.map(cell => <div key={cell.key} data-upcoming-fact={cell.key}><b>{cell.value}</b><span>{t(cell.key === 'firstTee' || cell.key === 'purse' ? `overview.hero.${cell.key}` : `overview.upcomingPlus.${cell.key}`)}</span></div>)}</div></section>;
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
  return <section data-overview-last-year className="upcoming-sec upcoming-history">
    <div data-overview-board-header data-overview-band="board" className="upcoming-sec-head">
      <h2 className="upcoming-sec-kick">{t('overview.hero.lastYear')}{shown.every(row => row.year === shown[0].year) ? ` · ${shown[0].year}` : null}</h2>
      <span className="upcoming-sec-kick">{t('overview.upcomingPlus.tot')}</span>
    </div>
    <div className="upcoming-ly-rows">{shown.map((row, i) => <LastYearRow key={`${row.rank}-${row.name}`} rank={i > 0 && row.rank === shown[i - 1].rank ? '' : row.rank} name={row.name} score={row.score} isWinner={i === 0 && (row.rank === '1' || row.rank === 'T1')} />)}</div>
  </section>;
}
/** OUT/IN scorecard cards; null unless all 18 holes carry par and yards (then the lead line stands alone). */
export function scorecardNines(holes: CourseHole[]) {
  const byNo = new Map(holes.filter(h => h.par > 0 && h.yards > 0).map(h => [h.hole_no, h]));
  const all = Array.from({ length: 18 }, (_, i) => byNo.get(i + 1));
  if (all.some(h => !h)) return null;
  const full = all as CourseHole[];
  return [['OUT', full.slice(0, 9)], ['IN', full.slice(9)]].map(([label, nine]) => ({ label: label as 'OUT' | 'IN', holes: nine as CourseHole[], yards: (nine as CourseHole[]).reduce((a, h) => a + h.yards, 0), par: (nine as CourseHole[]).reduce((a, h) => a + h.par, 0) }));
}
export function UpcomingCourse({ holes, tournamentId }: { holes: CourseHole[]; tournamentId: string }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate();
  const glance = glanceFacts(holes);
  if (!glance) return null;
  const cards = scorecardNines(holes);
  const target = tournamentRoute(tournamentId, { kind: 'overview' });
  return <section data-overview-course className="upcoming-sec upcoming-course"><div className="upcoming-sec-head"><h2 className="upcoming-sec-kick">{t('overview.upcomingPlus.course')}</h2><Button variant={null} size={null} data-course-guide className="upcoming-sec-kick upcoming-course-link" onClick={() => navigate(`${target.to}?section=course`, { state: target.state })}>{t('overview.upcomingPlus.courseGuide')}</Button></div><p className="tv-lead">{glance.parts.map((part, i) => part.bold ? <b key={i}>{part.text}</b> : <span key={i}>{part.text}</span>)}</p>{cards ? <div data-overview-scorecard className="upcoming-scorecard">{cards.map(card => <div key={card.label} data-scorecard-card={card.label} className="upcoming-sct">
      {card.holes.map(h => <span key={`n${h.hole_no}`} className="n">{h.hole_no}</span>)}<span className="n tot">{t(`overview.upcomingPlus.${card.label === 'OUT' ? 'out' : 'in'}`, { defaultValue: card.label })}</span>
      {card.holes.map(h => <span key={`y${h.hole_no}`} className="y">{h.yards}</span>)}<span className="y tot" data-scorecard-yards-total>{card.yards.toLocaleString('en-GB')}</span>
      {card.holes.map(h => <span key={`p${h.hole_no}`} className="p" data-par5={h.par === 5 ? '' : undefined}>{h.par}</span>)}<span className="p tot" data-scorecard-par-total>{card.par}</span>
    </div>)}</div> : null}</section>;
}
