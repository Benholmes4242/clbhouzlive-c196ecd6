import { useTranslation, Trans } from 'react-i18next';
import { CalendarDays, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { ComingUpRow } from '../data/useComingUp';
import type { LastYearFinisher } from '../../hooks/useTournamentLastYearTop4';
import { fullTourLabel } from '../../_shared/tourOrder';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { getScoreColor } from '../../_shared/scoreColor';
import { comingCountdown, comingTag, comingDates, comingMoney, comingDateBlock, defendingResult, type OwnCourseFigure } from './comingUpRules';
import { displayEventName } from './ComingUp';
import { openComingUpCalendar } from './comingUpCalendar';

function Countdown({ row }: { row: ComingUpRow }) {
  const { t } = useTranslation('tourhub'); const { key, count } = comingCountdown(row.start_date);
  return <>{t(`overview.comingUp.countdown.${key}`, { count })}</>;
}
function Kicker({ row, next = false }: { row: ComingUpRow; next?: boolean }) {
  const { t } = useTranslation('tourhub'); const tag = comingTag(row);
  return <div className="coming-kick"><span>{next ? `${t('overview.comingUp.next')} · ` : ''}{fullTourLabel(row.tour_slug)}</span>{tag ? <span className="coming-tag" data-coming-tag={tag}>{t(`overview.comingUp.tags.${tag}`)}</span> : null}</div>;
}
export function ComingUpNext({ row, photo, lastYear, own, onOpen }: { row: ComingUpRow; photo?: string | null; lastYear?: LastYearFinisher[] | null; own?: OwnCourseFigure; onOpen: () => void }) {
  const { t } = useTranslation('tourhub'); const defending = defendingResult(row.defending_champion, lastYear);
  const purse = comingMoney(row.purse, row.currency); const winner = comingMoney(row.winning_share, row.currency);
  const facts = [purse ? { value: purse, label: t('overview.comingUp.purse') } : null, winner ? { value: winner, label: t('overview.comingUp.winner') } : null, row.venue_par != null ? { value: `${t('overview.comingUp.par')} ${row.venue_par}`, label: row.venue_yardage != null ? `${row.venue_yardage.toLocaleString('en-GB')} ${t('overview.comingUp.yards')}` : '' } : null].filter(f => f != null);
  const nameBlock = <div className="coming-over"><Kicker row={row} next/><div className="coming-name">{displayEventName(row.name)}</div>{row.venue ? <div className="coming-venue">{row.venue}</div> : null}</div>;
  return <article className="coming-next" data-coming-next={row.id}>
    {photo ? <div className="coming-photo"><img src={photo} alt=""/>{nameBlock}</div> : <div className="coming-plain">{nameBlock}</div>}
    <div className="coming-when"><span className="coming-dates num">{comingDates(row.start_date, row.end_date)}</span><span className="coming-away"><Countdown row={row}/></span></div>
    {facts.length ? <div className="coming-facts">{facts.map(f => <div className="coming-fact" key={f.label}><div className="coming-fv num">{f.value}</div><div className="coming-fl">{f.label}</div></div>)}</div> : null}
    {defending ? <div className="coming-last"><SquircleAvatar size={30} className="coming-avatar" hideRing alt={row.defending_champion ?? ''} srcCandidates={resolvePlayerAvatarCandidates({ name: row.defending_champion, photoUrl: defending.photoUrl, tourSlug: row.tour_slug })}/><span className="coming-last-text"><Trans ns="tourhub" i18nKey="overview.comingUp.defends" values={{ name: defending.surname }} components={{ b: <b/> }}/>{defending.margin != null && defending.score != null ? <> <Trans ns="tourhub" i18nKey="overview.comingUp.wonAt" values={{ score: defending.scoreLabel }} components={{ b: <b className="num" style={{ color: getScoreColor(defending.score, 'dark') }}/> }}/>{defending.margin === 0 ? t('overview.comingUp.playoff') : t('overview.comingUp.margin', { count: defending.margin })}</> : null}</span></div> : null}
    {own && own.rounds > 0 ? <div className="coming-yours"><span className="coming-pin"><Flag size={16}/></span><span><b>{t('overview.comingUp.played', { course: row.venue_course_name || row.venue_name || row.venue || '' })}</b>{own.best != null ? <> <span className="num"><Trans ns="tourhub" i18nKey="overview.comingUp.best" values={{ gross: own.best, count: own.rounds }} count={own.rounds} components={{ b: <strong/> }}/></span></> : null}</span></div> : null}
    <div className="coming-actions"><Button variant="ghost" className="coming-pill" onClick={() => void openComingUpCalendar(row)}><CalendarDays size={15}/>{t('overview.comingUp.calendar')}</Button><Button variant="ghost" className="coming-pill coming-pill-solid" onClick={onOpen}>{t('overview.comingUp.preview')}</Button></div>
  </article>;
}
export function ComingUpListRow({ row, played, onOpen }: { row: ComingUpRow; played?: boolean; onOpen: () => void }) {
  const { t } = useTranslation('tourhub'); const date = comingDateBlock(row.start_date); const purse = comingMoney(row.purse, row.currency);
  return <Button variant="ghost" className="coming-row" data-coming-up-item={row.id} onClick={onOpen}><div className="coming-date"><div className="coming-day num">{date.day}</div><div className="coming-week"><span>{date.weekday}</span><span>{date.month}</span></div></div><div className="coming-mid"><Kicker row={row}/><div className="coming-row-name">{displayEventName(row.name)}</div>{row.venue || played ? <div className="coming-row-venue">{played ? <><span className="coming-played-prefix">{t('overview.comingUp.playedHere')}</span>{row.venue ? ' · ' : ''}</> : null}{row.venue}</div> : null}</div><div className="coming-right"><div className="coming-row-away"><Countdown row={row}/></div>{purse ? <div className="coming-purse num">{purse}</div> : null}</div></Button>;
}