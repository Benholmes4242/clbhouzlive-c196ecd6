/** Upcoming overview variants consume the already-loaded snapshot; shared
 * UpcomingFacts/LastYear/Course used by TournamentPage keep their defaults. */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoardFlag } from '../../_shared/BoardFlag';
import { playerRoute, tournamentRoute } from '../../routes';
import { followedUpcomingPlayers, venueTee, type UpcomingPlayer } from './upcomingOverviewRules';
import { scorecardNines, lastYearListTitle } from './UpcomingOverviewSections';
import type { CourseHole } from '../../tournament-v2/data/tournamentRules';
import { glanceFacts } from '../../tournament-v2/data/tournamentRules';
import { wonChart, type WeekFacts } from '../../tournament-v2/data/weekFactsRules';
import { WonChart } from '../../tournament-v2/sections/WonChart';
import { yourPlayersTitle, wonTitle, courseLeadTitle, par5Sentence } from './heroHeadRules';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import type { LastYearFinisher } from '../../hooks/useTournamentLastYearTop4';
import { surnameOf } from '../../_shared/playerName';
import { HybridHead } from './OverviewHybridSections';

export function HybridYourPlayers({ followed, field, drawn, zone }: { followed: Set<string>; field: UpcomingPlayer[]; drawn: boolean; zone: string | null }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate();
  const mine = followedUpcomingPlayers(followed.size > 0, followed, field, drawn); if (!mine.length) return null;
  return <section data-overview-your-players><HybridHead eyebrow={t('overview.upcomingPlus.yourPlayers')} title={yourPlayersTitle(t as never, mine.length)} /><div className="ov48-card ov48-list-card">{mine.slice(0, 5).map(p => {
    const tee = drawn ? venueTee(p.teeTime ?? null, zone) : null; const target = playerRoute(p.id, { kind: 'tour-hub' });
    return <Button key={p.id} variant={null} size={null} className="ov48-list-row ov48-your-player" onClick={() => navigate(target.to, { state: target.state })}><span className="ov48-who"><span className="ov48-name">{p.name}</span><span className="ov48-gold" data-followed-star>★</span><BoardFlag country={p.country} /></span>{tee ? <span className="ov48-your-tee"><b>{tee.time}</b><small>{tee.day}</small></span> : null}</Button>;
  })}{mine.length > 5 ? <div className="ov48-list-row" data-upcoming-more>{t('overview.upcomingPlus.more', { count: mine.length - 5 })}</div> : null}</div></section>;
}
export function HybridLastYear({ rows, facts, entries, year, tour }: { rows: LastYearFinisher[]; facts: WeekFacts | null; entries: BoardEntry[]; year: string | null; tour: string }) {
  const { t } = useTranslation('tourhub'); const shown = rows.slice(0, 4); const chart = facts ? wonChart(facts, entries, 335) : null;
  if (!chart && !shown.length) return null;
  const title = chart && facts ? wonTitle(t as never, chart.lines.map(l => ({ ...l, name: surnameOf(l.name) })), facts.rounds) : lastYearListTitle(t as never, shown);
  return <section data-overview-last-year><HybridHead eyebrow={year || shown[0]?.year ? t('overview.heroHead.lastYear', { year: year ?? shown[0]?.year }) : t('overview.hero.lastYear')} title={title} /><div className="ov48-card ov48-chart-card">{chart && facts ? <WonChart facts={facts} rows={entries} tourCode={tour} /> : <>{shown.map((r, i) => <div key={`${r.name}-${r.rank}`} className="ov48-board-grid ov48-board-row ov48-last-year-row"><span className="ov48-board-pos">{i === 0 && ['1', 'T1'].includes(r.rank) ? <Trophy size={13} className="ov48-gold" /> : r.rank}</span><span className="ov48-who"><span className="ov48-name">{r.name}</span><BoardFlag country={r.country} /></span><span className={String(r.score).startsWith('-') || String(r.score).startsWith('−') ? 'ov48-total ov48-under' : 'ov48-total'}>{r.score}</span></div>)}</>}</div></section>;
}
export function HybridUpcomingCourse({ holes, tournamentId }: { holes: CourseHole[]; tournamentId: string }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate(); const glance = glanceFacts(holes); if (!glance) return null;
  const cards = scorecardNines(holes); const target = tournamentRoute(tournamentId, { kind: 'overview' });
  const line = `${par5Sentence(t as never, holes.filter(h => h.par === 5 && h.yards > 0).length)}${glance.parts[2]?.text.trim() ? ` ${glance.parts[2].text.trim()}` : ''}`;
  return <section data-overview-course><HybridHead eyebrow="The course" title={courseLeadTitle(t as never, glance.par, glance.yards)} action="Course guide ›" onAction={() => navigate(`${target.to}?section=course`, { state: target.state })} /><p className="ov48-course-lead">{line}</p>{cards ? <div data-overview-scorecard className="ov48-scorecards">{cards.map(c => <div className="ov48-card ov48-scorecard" key={c.label} data-scorecard-card={c.label}><span className="ov48-scorecard-label">{c.label}</span>{c.holes.map(h => <span key={`n${h.hole_no}`} className="ov48-scorecard-hole">{h.hole_no}</span>)}<span className="ov48-scorecard-label">TOT</span><span className="ov48-scorecard-label">YDS</span>{c.holes.map(h => <span key={`y${h.hole_no}`} className="ov48-scorecard-yards">{h.yards}</span>)}<span className="ov48-scorecard-yards" data-scorecard-yards-total>{c.yards.toLocaleString('en-GB')}</span><span className="ov48-scorecard-label">PAR</span>{c.holes.map(h => <span key={`p${h.hole_no}`} className={h.par === 5 ? 'ov48-scorecard-par ov48-par5' : 'ov48-scorecard-par'}>{h.par}</span>)}<span className="ov48-scorecard-par" data-scorecard-par-total>{c.par}</span></div>)}</div> : null}</section>;
}