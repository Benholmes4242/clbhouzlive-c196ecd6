import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { coachRpc, useInvalidateCoach, useMyCoach, useCoachHandicap } from './hooks';
import { COACH_CATEGORIES, coachDate, type CoachBusiness, type MyCoach } from './contracts';
import { coachProgress } from './copy';
import './coach.css';
import { ChevronRight } from 'lucide-react';
export function CoachSteps() {
  const { t } = useTranslation();
  return <div className="coach-steps" data-coach-steps>{[1, 2, 3, 4].map(n => <div key={n} className="coach-step" data-coach-step={n}><span>{n}</span><p><b>{t(`coach.steps.${n}.title`)}</b> {t(`coach.steps.${n}.body`)}</p></div>)}</div>;
}
export function CoachOptions({ name, show, share, disabled, onShow, onShare }: { name: string; show: boolean; share: boolean; disabled?: boolean; onShow: (v: boolean) => void; onShare: (v: boolean) => void }) {
  const { t } = useTranslation();
  return <div className="coach-options">{[{ key: 'show', label: t('coach.show'), sub: t('coach.showSub', { name }), checked: show, onChange: onShow }, { key: 'share', label: t('coach.share'), sub: t('coach.shareSub'), checked: share, onChange: onShare }].map(o => <label key={o.key} className="coach-option"><span><b>{o.label}</b><small>{o.sub}</small></span><Switch data-coach-option={o.key} variant="slate" aria-label={o.label} checked={o.checked} onCheckedChange={o.onChange} disabled={disabled} /></label>)}</div>;
}
export function CoachConnectSheet({ business, open, onClose }: { business: CoachBusiness; open: boolean; onClose: () => void }) {
  const { t } = useTranslation(); const navigate = useNavigate();
  return <BottomSheet open={open} onClose={onClose} scrollBody><div className="coach-sheet" data-coach-connect><h2>{t('coach.connectTitle')}</h2><p className="coach-lead">{t('coach.connectBody', { name: business.name })}</p><Button className="coach-action" data-coach-connect-action onClick={() => { onClose(); navigate('/manage/handicap'); }}>{t('coach.connectAction')}</Button><Button variant="ghost" className="coach-link" onClick={onClose}>{t('coach.notNow')}</Button></div></BottomSheet>;
}
export function CoachNameSheet({ business, current, viewerId, open, onClose, onNoHandicap }: { business: CoachBusiness; current: MyCoach | null; viewerId: string; open: boolean; onClose: () => void; onNoHandicap: () => void }) {
  const { t } = useTranslation(); const invalidate = useInvalidateCoach(viewerId);
  const [show, setShow] = useState(true); const [share, setShare] = useState(false); const [busy, setBusy] = useState(false);
  const switching = !!current && current.business_id !== business.id;
  const submit = async () => {
    if (busy) return; setBusy(true);
    try {
      await coachRpc<MyCoach>('name_coach', { p_business_id: business.id, p_show_on_profile: show, p_share_name: share });
      onClose(); toast.success(t('coach.namedToast', { name: business.name })); await invalidate(business.id, current?.business_id);
    } catch (error) {
      if (String((error as { message?: string })?.message ?? error).includes('no_handicap')) { onNoHandicap(); }
      else toast.error(t('coach.error'));
    } finally { setBusy(false); }
  };
  return <BottomSheet open={open} onClose={() => { if (!busy) onClose(); }} scrollBody><div className="coach-sheet" data-coach-name><h2>{t(switching ? 'coach.switchTitle' : 'coach.nameTitle', { name: business.name })}</h2>{switching && <p className="coach-lead" data-coach-switch-line>{t('coach.switchLine', { name: current.name })}</p>}<CoachSteps /><CoachOptions name={business.name} show={show} share={share} disabled={busy} onShow={setShow} onShare={setShare} /><Button className="coach-action" data-coach-name-action disabled={busy} onClick={() => void submit()}>{t(switching ? 'coach.switchAction' : 'coach.nameAction')}</Button><Button variant="ghost" className="coach-link" disabled={busy} onClick={onClose}>{t('coach.notNow')}</Button></div></BottomSheet>;
}
export function CoachNamingFlow({ business, current, viewerId, onClose }: { business: CoachBusiness; current: MyCoach | null; viewerId: string; onClose: () => void }) {
  const handicap = useCoachHandicap(viewerId); const [forceConnect, setForceConnect] = useState(false);
  if (handicap.loading) return null;
  return handicap.current == null || forceConnect
    ? <CoachConnectSheet business={business} open onClose={onClose} />
    : <CoachNameSheet business={business} current={current} viewerId={viewerId} open onClose={onClose} onNoHandicap={() => setForceConnect(true)} />;
}
export async function searchCoachBusinesses(search: string): Promise<CoachBusiness[]> {
  const { data, error } = await supabase.from('business_accounts').select('id, name, logo_url, slug, category').ilike('name', `%${search}%`).eq('is_deleted', false).in('category', [...COACH_CATEGORIES]).limit(20);
  if (error) throw error;
  return data ?? [];
}
function CoachFindSheet({ viewerId, current, onClose }: { viewerId: string; current: MyCoach | null; onClose: () => void }) {
  const { t } = useTranslation(); const [search, setSearch] = useState(''); const [selected, setSelected] = useState<CoachBusiness | null>(null);
  const q = useQuery({ queryKey: ['coach-search', search.trim()], enabled: search.trim().length > 0, retry: false, queryFn: () => searchCoachBusinesses(search.trim()) });
  if (selected) return <CoachNamingFlow key={selected.id} business={selected} current={current} viewerId={viewerId} onClose={onClose} />;
  return <BottomSheet open onClose={onClose} scrollBody><div className="coach-sheet" data-coach-find><h2>{t('coach.findTitle')}</h2><Input className="coach-search" data-coach-search aria-label={t('coach.findTitle')} value={search} placeholder={t('coach.searchPlaceholder')} onChange={e => setSearch(e.target.value)} />{search.trim().length > 0 && (q.isError ? <p className="coach-search-state" data-coach-search-error>{t('coach.searchError')}</p> : q.isPending ? <p className="coach-search-state" role="status" data-coach-search-loading>{t('coach.searching')}</p> : q.data && q.data.length === 0 ? <div className="coach-search-state" data-coach-search-empty><p>{t('coach.searchEmpty', { query: search.trim() })}</p><p>{t('coach.searchEmptyBody')}</p></div> : null)}{!q.isError && q.data?.map(b => <Button key={b.id} variant="ghost" className="coach-person-row" data-coach-search-result={b.id} onClick={() => setSelected(b)}><SquircleAvatar size={36} src={b.logo_url} alt={b.name} fallback={b.name.charAt(0)} hairlineRing /><span><b>{b.name}</b><small>{t(b.category === 'Golf Academy' ? 'business.hero.word.academy' : 'business.hero.word.coach')}</small></span><span aria-hidden>›</span></Button>)}</div></BottomSheet>;
}
function CoachManageSheet({ coach, viewerId, onClose, onChange }: { coach: MyCoach; viewerId: string; onClose: () => void; onChange: () => void }) {
  const { t } = useTranslation(); const invalidate = useInvalidateCoach(viewerId);
  const [options, setOptions] = useState({ show: coach.show_on_profile, share: coach.share_name }); const [busy, setBusy] = useState(false);
  const update = async (key: 'show' | 'share', value: boolean) => {
    if (busy) return; const previous = options; setOptions({ ...options, [key]: value }); setBusy(true);
    try { await coachRpc('set_coach_options', { p_show_on_profile: key === 'show' ? value : null, p_share_name: key === 'share' ? value : null }); await invalidate(coach.business_id); }
    catch { setOptions(previous); toast.error(t('coach.error')); } finally { setBusy(false); }
  };
  const stop = async () => {
    if (busy) return; setBusy(true);
    try { await coachRpc('stop_coach'); onClose(); toast.success(t('coach.stoppedToast', { name: coach.name })); await invalidate(coach.business_id); }
    catch { toast.error(t('coach.error')); } finally { setBusy(false); }
  };
  return <BottomSheet open onClose={() => { if (!busy) onClose(); }} scrollBody><div className="coach-sheet" data-coach-manage><h2>{t('coach.yourCoach')}</h2><div className="coach-pick"><SquircleAvatar size={36} src={coach.logo_url} alt={coach.name} fallback={coach.name.charAt(0)} hairlineRing /><span><b>{coach.name}</b><small>{t('coach.sinceProgress', { date: coachDate(coach.started_at), progress: coachProgress(coach.measured ? coach.change : null, t) })}</small></span></div><CoachOptions name={coach.name} show={options.show} share={options.share} disabled={busy} onShow={v => void update('show', v)} onShare={v => void update('share', v)} /><p className="coach-lead">{t('coach.stopBody')}</p><Button variant="outline" className="coach-danger" data-coach-stop disabled={busy} onClick={() => void stop()}>{t('coach.stopAction')}</Button><Button variant="ghost" className="coach-link" data-coach-change disabled={busy} onClick={onChange}>{t('coach.changeAction')}</Button></div></BottomSheet>;
}
export interface CoachRowActions { open: () => void }
export const YourCoachRow = forwardRef<CoachRowActions, { viewerId?: string; appearance?: 'editProfile' }>(function YourCoachRow({ viewerId, appearance }, ref) {
  const { t } = useTranslation(); const q = useMyCoach(viewerId); const [mode, setMode] = useState<'manage' | 'find' | null>(null);
  useImperativeHandle(ref, () => ({ open: () => { if (viewerId && q.isSuccess && !q.isError) setMode(q.data ? 'manage' : 'find'); } }));
  if (!viewerId || !q.isSuccess || q.isError) return null;
  const coach = q.data;
  return <><Button variant="ghost" className={appearance ? 'ep-row' : 'coach-edit-row'} data-your-coach data-row={appearance ? 'coach' : undefined} onClick={() => setMode(coach ? 'manage' : 'find')}>{appearance ? <><span className="ep-row-label">Coach</span><span className={`ep-row-value${coach ? '' : ' ph'}`} data-testid="ep-golf-coach">{coach?.name ?? 'Name your coach'}</span><ChevronRight size={18} className="ep-row-chev" aria-hidden="true" /></> : <><span>{t('coach.yourCoach')}</span><span>{coach?.name ?? t('coach.notSet')}{coach && <small>{t('coach.since', { date: coachDate(coach.started_at) })}</small>}</span></>}</Button>{mode === 'manage' && coach && <CoachManageSheet key={coach.link_id} coach={coach} viewerId={viewerId} onClose={() => setMode(null)} onChange={() => setMode('find')} />}{mode === 'find' && <CoachFindSheet viewerId={viewerId} current={coach} onClose={() => setMode(null)} />}</>;
});
