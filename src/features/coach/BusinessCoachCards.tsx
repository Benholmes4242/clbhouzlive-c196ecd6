import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useMyCoach, useCoachResults, useCoachGolfers, useMemberCoach } from './hooks';
import { isCoachCategory, formatCoachChange, coachDate, type CoachBusiness, type CoachResults } from './contracts';
import { CoachNamingFlow, CoachSteps } from './CoachSheets';
import { coachProgress } from './copy';
import './coach.css';
export function BusinessCoachInvite({ business, viewerId, isClub, isTeam, membershipReady }: { business: CoachBusiness; viewerId?: string; isClub: boolean; isTeam: boolean; membershipReady: boolean }) {
  const { t } = useTranslation(); const q = useMyCoach(viewerId, !isClub && isCoachCategory(business.category)); const [open, setOpen] = useState(false);
  if (isClub || !isCoachCategory(business.category) || !viewerId || !membershipReady || isTeam || !q.isSuccess || q.isError || q.data?.business_id === business.id) return null;
  const switching = !!q.data;
  return <><section className="coach-card" data-coach-invite><div className="coach-kicker">{t('coach.inviteKicker')}</div><h2 className="coach-title">{t(switching ? 'coach.inviteSwitch' : 'coach.inviteTitle', { name: business.name })}</h2><p className="coach-lead">{t('coach.inviteLead')}</p><div className="coach-foot-row"><Button variant="ghost" className="coach-link" data-coach-how onClick={() => setOpen(true)}>{t('coach.how')}</Button><Button className="coach-action" data-coach-invite-action onClick={() => setOpen(true)}>{t(switching ? 'coach.switchAction' : 'coach.nameAction')}</Button></div></section>{open && <CoachNamingFlow business={business} viewerId={viewerId} current={q.data} onClose={() => setOpen(false)} />}</>;
}
export function CoachProfileLine({ profileUserId, viewerId }: { profileUserId?: string; viewerId?: string }) {
  const { t } = useTranslation(); const navigate = useNavigate(); const q = useMemberCoach(profileUserId, viewerId);
  if (!q.isSuccess || q.isError || !q.data) return null;
  const coach = q.data;
  return <Button variant="ghost" className="coach-profile-line" data-coach-profile onClick={() => navigate(`/business/${coach.slug || coach.business_id}`)}><SquircleAvatar size={18} src={coach.logo_url} alt={coach.name} hairlineRing /><span>{t('coach.coachedAt')} <b>{coach.name}</b></span></Button>;
}
export function coachChartPoints(months: NonNullable<CoachResults['months']>) {
  if (!months.length) return [];
  const low = Math.min(...months.map(p => p.avg)); const high = Math.max(...months.map(p => p.avg));
  return months.map(p => ({ ...p, x: 12 + (p.m / 12) * 308, y: 88 - ((p.avg - low) / (high - low || 1)) * 64 }));
}
export function CoachResultsChart({ months }: { months: NonNullable<CoachResults['months']> }) {
  const { t } = useTranslation(); const points = coachChartPoints(months); const first = points[0]; const last = points[points.length - 1];
  if (!first || !last) return null;
  return <div className="coach-chart" data-coach-chart><div className="coach-chart-label">{t('coach.chartLabel')}</div><svg viewBox="0 0 332 110" role="img" aria-label={t('coach.chartLabel')}>{[24, 56, 88].map(y => <line key={y} x1={0} x2={332} y1={y} y2={y} />)}{points.slice(1).map((p, i) => <path key={p.m} data-coach-segment={p.m} data-dashed={p.n < 10 || points[i].n < 10} d={`M ${points[i].x} ${points[i].y} L ${p.x} ${p.y}`} />)}{[first, ...(first === last ? [] : [last])].map((p, i) => <g key={p.m}><circle cx={p.x} cy={p.y} r={3.5} /><text x={p.x} y={Math.max(11, p.y - 10)} textAnchor={i === 0 ? 'start' : 'end'}>{formatHcp(p.avg)}</text></g>)}</svg><div className="coach-axis">{[0, 3, 6, 9, 12].filter(m => m <= last.m).map(m => <span key={m} data-coach-axis={m}>{m === 0 ? t('coach.start') : m === 12 ? t('coach.months12') : m}</span>)}</div></div>;
}
import { formatHcp } from '@/lib/formatHcp';
export function BusinessCoachResults({ business, viewerId, isClub, isTeam }: { business: CoachBusiness; viewerId?: string; isClub: boolean; isTeam: boolean }) {
  const { t } = useTranslation(); const navigate = useNavigate(); const eligible = !isClub && isCoachCategory(business.category);
  const q = useCoachResults(business.id, viewerId, eligible); const golfers = useCoachGolfers(business.id, viewerId, eligible && isTeam); const [how, setHow] = useState(false);
  if (!eligible || !viewerId) return null;
  const results = q.isSuccess && !q.isError ? q.data : null;
  const team = isTeam && golfers.isSuccess && !golfers.isError ? golfers.data : null;
  const publicResults = results?.avg_change != null;
  const showProgress = !!results && results.n < 10 && !!team;
  return <>{publicResults && results && <section className="coach-card" data-coach-results><div className="coach-kicker"><span>{t('coach.resultsKicker')}</span><span>{t('coach.golfers', { count: results.n })}</span></div><div className="coach-big"><b data-coach-average className={results.avg_change != null && results.avg_change < 0 ? 'coach-improved' : undefined}>{formatCoachChange(results.avg_change ?? 0)}</b><span>{t('coach.avgBody', { name: business.name })}</span></div><div className="coach-split">{(['down', 'level', 'up'] as const).map(k => <i key={k} data-coach-split={k} className={`coach-${k}`} style={{ width: `${((results[k] ?? 0) / results.n) * 100}%` }} />)}</div><div className="coach-legend">{(['down', 'level', 'up'] as const).map(k => <span key={k}><i className={`coach-${k}`} /><b>{results[k]}</b> {t(`coach.legend.${k}`)}</span>)}</div><CoachResultsChart months={results.months ?? []} /><p className="coach-foot">{t('coach.resultsFoot')}</p><Button variant="ghost" className="coach-link" data-coach-results-how onClick={() => setHow(true)}>{t('coach.resultsHow')} <span aria-hidden>›</span></Button></section>}{showProgress && team && results && <section className="coach-card" data-coach-team-progress data-coach-results><div className="coach-kicker"><span>{t('coach.teamKicker')}</span><span>{t('coach.ofTen', { n: results.n })}</span></div><h2 className="coach-title">{t('coach.activeTitle', { count: team.active })}</h2><p className="coach-lead">{t('coach.teamLead')}</p><div className="coach-progress"><i data-coach-progress-fill style={{ width: `${results.n / 10 * 100}%` }} /></div></section>}{team && team.active >= 1 && <section className="coach-card" data-coach-golfers><div className="coach-kicker"><span>{t('coach.namedKicker')}</span><span>{t('coach.namedOf', { n: team.named.length, active: team.active })}</span></div>{team.named.map(g => <Button key={g.user_id} variant="ghost" className="coach-person-row" data-coach-golfer={g.user_id} onClick={() => navigate(`/profile/${g.user_id}`)}><SquircleAvatar size={40} src={g.profile_photo_url} alt={g.display_name} userId={g.user_id} hairlineRing /><span><b>{g.display_name}</b><small>{t('coach.since', { date: coachDate(g.started_at) })}{g.change != null && ` · ${coachProgress(g.change, t).replace(/ since\.$/, '').replace(/\.$/, '')}`}</small></span><span aria-hidden>›</span></Button>)}{team.active > team.named.length && <p className="coach-foot" data-coach-more>{t('coach.more', { count: team.active - team.named.length })}</p>}</section>}{how && <BottomSheet open onClose={() => setHow(false)} scrollBody><div className="coach-sheet" data-coach-results-explanation><h2>{t('coach.resultsHow')}</h2><CoachSteps /></div></BottomSheet>}</>;
}
export function coachStrip(results: CoachResults | null, followers: number, posts: number) {
  return [...(results?.avg_change != null ? [{ key: 'coached', value: String(results.n), improved: false }, { key: 'avgChange', value: formatCoachChange(results.avg_change), improved: results.avg_change < 0 }] : []), ...(followers > 0 ? [{ key: 'followers', value: followers.toLocaleString(), improved: false }] : []), ...(posts > 0 ? [{ key: 'posts', value: posts.toLocaleString(), improved: false }] : [])].slice(0, 3);
}
export function scrollToCoachResults() { document.querySelector('[data-coach-results]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
