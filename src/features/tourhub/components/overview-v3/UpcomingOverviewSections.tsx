/** Upcoming-only facts/players/history/course. Each block self-hides; the
 * overview appends picks after the course (upcoming hero new order). The
 * overview course shows OUT/IN scorecards; the tournament page keeps CourseGlance.
 * HERO BLOCKS: the upcoming hero block (PhotoBand + UpcomingFacts +
 * UpcomingLastYear) is ONE block shared by the overview and the tournament
 * page, at the overview's sizes — the tournament page imports these same
 * builders, so the two pages cannot drift. The fact band fills up to four
 * cells in the order FIRST TEE, FIELD, PURSE, PAR, YARDS, PAR 5S, WON AT from whatever is
 * available; YARDS is the course glance yards, else venue_yardage.
 * FIRST TEE is time only (24-hour, event zone, UTC fallback) and appears only
 * when the caller's kicker names the start day by weekday (startDayNamed),
 * passed from the same start-day decision the kicker renders. */
import '@/styles/hybrid-hero.css';
import '../../tournament-v2/sections/completedWeek.css';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { formatHoleAvg, holeAvgColor, type HoleAvgRow } from './liveStateRules';
import './HybridHeroBands/liveStates.css';
import { Button } from '@/components/ui/button';
import { playerRoute, tournamentRoute } from '../../routes';
import { glanceFacts } from '../../tournament-v2/data/tournamentRules';
import { HERO_TOT_TYPE } from '../../tournament-v2/sections/HeroBoardRows';
import { LastYearRow } from './HybridHeroBands/LastYearRow';
import { followedUpcomingPlayers, venueTee, type UpcomingPlayer } from './upcomingOverviewRules';
import type { LastYearFinisher } from '../../hooks/useTournamentLastYearTop4';
import type { CourseHole } from '../../tournament-v2/data/tournamentRules';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { wonChart, type WeekFacts } from '../../tournament-v2/data/weekFactsRules';
import { WonChart } from '../../tournament-v2/sections/WonChart';
import { copy, score } from '../../tournament-v2/data/tournamentRules';
import { HeroSectionHead } from './HeroSectionHead';
import { courseLeadTitle, par5Sentence, runnerUpTitle, numericScore, wonTitle, yourPlayersTitle } from './heroHeadRules';
import { surnameOf } from '../../_shared/playerName';

/** Count only a complete numbered par card; yardage is not a prerequisite. */
export function upcomingPar5Count(holes: CourseHole[]) {
  const byNo = new Map(holes.map(h => [h.hole_no, h]));
  const card = Array.from({ length: 18 }, (_, i) => byNo.get(i + 1));
  if (card.some(h => !h || !(h.par > 0))) return null;
  return card.filter(h => h?.par === 5).length;
}
export function upcomingFactCells(first: string | null, zone: string | null, field: number, purse: number | null, par: number | null, yards: number | null = null, startDayNamed = false, par5s: number | null = null, wonAt: number | null = null) {
  const tee = startDayNamed ? venueTee(first, zone ?? 'UTC') : null;
  return [tee ? { key: 'firstTee', value: tee.time } : null,
    field > 0 ? { key: 'field', value: String(field) } : null,
    purse != null ? { key: 'purse', value: `$${purse >= 1000000 ? `${Number((purse / 1000000).toFixed(1))}M` : purse.toLocaleString('en-GB')}` } : null,
    par != null ? { key: 'par', value: String(par) } : null,
    yards != null ? { key: 'yards', value: yards.toLocaleString('en-GB') } : null,
    par5s != null ? { key: 'par5s', value: String(par5s) } : null,
    wonAt != null ? { key: 'wonAt', value: score(wonAt) } : null]
    .filter((cell): cell is { key: string; value: string } => cell !== null)
    .slice(0, 4);
}
export function UpcomingFacts({ first, zone, field, purse, par, yards = null, startDayNamed = false, par5s = null, wonAt = null }: { first: string | null; zone: string | null; field: number; purse: number | null; par: number | null; yards?: number | null; startDayNamed?: boolean; par5s?: number | null; wonAt?: number | null }) {
  const { t } = useTranslation('tourhub');
  const cells = upcomingFactCells(first, zone, field, purse, par, yards, startDayNamed, par5s, wonAt);
  if (!cells.length) return null;
  return <section data-overview-event className="upcoming-event"><div data-overview-facts className="upcoming-event-facts" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>{cells.map(cell => <div key={cell.key} data-upcoming-fact={cell.key}><b data-under={cell.key === 'wonAt' && wonAt != null && wonAt < 0 ? '' : undefined} style={HERO_TOT_TYPE}>{cell.value}</b><span>{t(cell.key === 'firstTee' || cell.key === 'purse' ? `overview.hero.${cell.key}` : `overview.upcomingPlus.${cell.key}`)}</span></div>)}</div></section>;
}
export function YourUpcomingPlayers({ member, followed, field, drawn, zone }: { member: boolean; followed: Set<string>; field: UpcomingPlayer[]; drawn: boolean; zone: string | null }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate();
  const mine = followedUpcomingPlayers(member, followed, field, drawn);
  if (!mine.length) return null;
  return <section data-overview-your-players className="upcoming-block" style={{ paddingTop: 0 }}>
    <HeroSectionHead inset={false} eyebrow={t('overview.upcomingPlus.yourPlayers')} title={yourPlayersTitle(t as never, mine.length)} />
    {mine.slice(0, 5).map(player => { const tee = drawn ? venueTee(player.teeTime, zone) : null; const target = playerRoute(player.id, { kind: 'tour-hub' }); return <Button variant="ghost" className="upcoming-player-row" key={player.id} onClick={() => navigate(target.to, { state: target.state })}><span className="upcoming-player-name"><span>{player.name}</span><i data-followed-star>★</i></span>{tee ? <span data-upcoming-tee className="upcoming-player-time">{tee.day} {tee.time}</span> : null}</Button>; })}
    {mine.length > 5 ? <div data-upcoming-more className="upcoming-more">{t('overview.upcomingPlus.more', { count: mine.length - 5 })}</div> : null}
  </section>;
}
/** Prior-edition history reuses the finished chart without changing its drawing,
 * copy or styles; every unavailable/invalid chart keeps the original list. */
export function UpcomingLastYear({ rows, facts = null, entries = [], year = null, tourCode = '' }: { rows: LastYearFinisher[]; facts?: WeekFacts | null; entries?: BoardEntry[]; year?: string | null; tourCode?: string }) {
  const { t } = useTranslation('tourhub'); const shown = rows.slice(0, 4);
  const chart = facts ? wonChart(facts, entries, 335) : null;
  if (facts && chart) {
    const shownYear = year ?? shown[0]?.year ?? null;
    return <section data-overview-last-year className="cw-block upcoming-history">
      <HeroSectionHead eyebrow={shownYear ? t('overview.heroHead.lastYear', { year: shownYear }) : t('overview.hero.lastYear').toUpperCase()} title={wonTitle(t as never, chart.lines.map(l => ({ ...l, name: surnameOf(l.name) })), facts.rounds)} />
      <WonChart facts={facts} rows={entries} tourCode={tourCode} />
    </section>;
  }
  if (!shown.length) return null;
  const sameYear = shown.every(row => row.year === shown[0].year);
  return <section data-overview-last-year className="upcoming-sec upcoming-history" style={{ paddingTop: 0 }}>
    <HeroSectionHead inset={false} eyebrow={sameYear ? t('overview.heroHead.lastYear', { year: shown[0].year }) : t('overview.hero.lastYear').toUpperCase()} title={lastYearListTitle(t as never, shown)} />
    <div data-overview-board-header data-overview-band="board" className="upcoming-sec-head hero-head-cols">
      <span />
      <span className="upcoming-sec-kick">{t('overview.upcomingPlus.tot')}</span>
    </div>
    <div className="upcoming-ly-rows">{shown.map((row, i) => <LastYearRow key={`${row.rank}-${row.name}`} rank={i > 0 && row.rank === shown[i - 1].rank ? '' : row.rank} name={row.name} score={row.score} country={row.country} isWinner={i === 0 && (row.rank === '1' || row.rank === 'T1')} />)}</div>
  </section>;
}
/** Rule (m), list variant: runnerUpTitle on the finisher rows; rank 1/T1 at
 * the top is the winner and a zero margin takes the playoff form. */
export function lastYearListTitle(t: Parameters<typeof runnerUpTitle>[0], shown: LastYearFinisher[]): string {
  const rows = shown.flatMap((row, i) => { const total = numericScore(row.score); return total == null ? [] : [{ name: surnameOf(row.name), total, champion: i === 0 && (row.rank === '1' || row.rank === 'T1') }]; });
  const champ = rows.find(r => r.champion);
  const playoff = !!champ && rows.some(r => !r.champion && r.total === champ.total);
  return runnerUpTitle(t, rows, playoff);
}
/** OUT/IN scorecard cards; null unless all 18 holes carry par and yards (then the lead line stands alone). */
export function scorecardNines(holes: CourseHole[]) {
  const byNo = new Map(holes.filter(h => h.par > 0 && h.yards > 0).map(h => [h.hole_no, h]));
  const all = Array.from({ length: 18 }, (_, i) => byNo.get(i + 1));
  if (all.some(h => !h)) return null;
  const full = all as CourseHole[];
  return [['OUT', full.slice(0, 9)], ['IN', full.slice(9)]].map(([label, nine]) => ({ label: label as 'OUT' | 'IN', holes: nine as CourseHole[], yards: (nine as CourseHole[]).reduce((a, h) => a + h.yards, 0), par: (nine as CourseHole[]).reduce((a, h) => a + h.par, 0) }));
}
/** Live states opt in to a round kicker, a field-average lead line, a fourth
 * per-hole averages row and a key line; the defaults are the upcoming card. */
export interface LiveCourseExtras {
  kicker: string;
  /** Brief 16 head title ("Playing 0.42 under par"); null/absent = rule (n). */
  title?: string | null;
  /** The line under that title (hardest/easiest); null with a level title. */
  line?: ReactNode | null;
  /** Pre-brief-16 field kept for existing callers; ignored by the head. */
  lead?: ReactNode | null;
  averages: HoleAvgRow | null; keyLine: ReactNode | null;
}
export function UpcomingCourse({ holes, tournamentId, live }: { holes: CourseHole[]; tournamentId: string; live?: LiveCourseExtras }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate();
  const glance = glanceFacts(holes);
  if (!glance) return null;
  const avg = live?.averages ?? null;
  const cards = scorecardNines(holes);
  const target = tournamentRoute(tournamentId, { kind: 'overview' });
  /* Rule (n): the course lead is the title, the par-5 sentence (plus the
     existing front/back sentence) the line; live extras replace both. */
  const par5s = holes.filter(h => h.par === 5 && h.par > 0 && h.yards > 0).length;
  const rest = glance.parts[2]?.text.trim() ?? '';
  const title = live?.title ?? courseLeadTitle(t as never, glance.par, glance.yards);
  const line = live?.title ? live.line : <>{par5Sentence(t as never, par5s)}{rest ? ` ${rest}` : ''}</>;
  return <section data-overview-course className="upcoming-sec upcoming-course" style={{ paddingTop: 0 }}><HeroSectionHead inset={false} eyebrow={live?.kicker ?? t('overview.upcomingPlus.course')} title={title} action={t('overview.heroHead.courseGuide')} onAction={() => navigate(`${target.to}?section=course`, { state: target.state })} />{line ? <p data-course-line className="hero-head-lead">{line}</p> : null}{cards ? <div data-overview-scorecard className="upcoming-scorecard">{cards.map(card => <div key={card.label} data-scorecard-card={card.label} className="upcoming-sct">
      {card.holes.map(h => <span key={`n${h.hole_no}`} className="n">{h.hole_no}</span>)}<span className="n tot">{t(`overview.upcomingPlus.${card.label === 'OUT' ? 'out' : 'in'}`, { defaultValue: card.label })}</span>
      {card.holes.map(h => <span key={`y${h.hole_no}`} className="y">{h.yards}</span>)}<span className="y tot" data-scorecard-yards-total>{card.yards.toLocaleString('en-GB')}</span>
      {card.holes.map(h => <span key={`p${h.hole_no}`} className="p" data-par5={h.par === 5 ? '' : undefined}>{h.par}</span>)}<span className="p tot" data-scorecard-par-total>{card.par}</span>
      {avg ? <>{card.holes.map(h => { const c = avg.holes[h.hole_no - 1]; return <span key={`a${h.hole_no}`} className="a" data-hole-avg={h.hole_no} data-mark={c?.mark ?? undefined} style={{ color: holeAvgColor(c?.value ?? null, c?.mark ?? null) }}>{c?.text ?? ''}</span>; })}
        {(() => { const v = card.label === 'OUT' ? avg.out : avg.in; return <span className="a tot" data-hole-avg-total={card.label} style={{ color: holeAvgColor(v) }}>{v == null ? '' : formatHoleAvg(v)}</span>; })()}</> : null}
    </div>)}</div> : null}{live?.keyLine && avg ? <div className="live-key" data-live-course-key>{live.keyLine}</div> : null}</section>;
}
