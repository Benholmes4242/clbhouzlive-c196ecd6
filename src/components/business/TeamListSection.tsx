import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import type { AssignableBusinessRole, BusinessMember, BusinessRole } from '@/hooks/useBusinessTeam';
import { useBusinessTeamActivity } from '@/hooks/useBusinessTeamActivity';
import { shortBusinessName } from './home/BusinessHomeHeader';
import { teamInitials } from './teamSummary';
import { activityLine, memberFirstName, memberMenu, sortTeam, type ActivityLine, type MenuItem, type TeamActivity, type When } from './teamList';

/** CB76 section two: the team list, its activity line and each person's menu.
 * Writes call the deployed RPCs directly; a refusal toasts the server message and
 * leaves the sheet open with nothing changed locally. Sheet chrome is BottomSheet's. */

const P = 'business.team.sectionTwo';
/** Supabase errors are plain objects; Error instances and both carry `message`. */
const errorMessage = (error: unknown) => (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message || '') : '');
const ASSIGNABLE: AssignableBusinessRole[] = ['admin', 'editor', 'analyst'];
type SheetKind = 'menu' | 'role' | 'jobTitle' | 'makeOwner' | 'remove' | 'leave';

interface Props {
  businessId: string; businessName: string; team: BusinessMember[];
  viewerRole: BusinessRole | null | undefined; viewerId: string | null | undefined;
  loading: boolean; failed: boolean; onRetry: () => void;
}

function Avatar({ m, name, small }: { m: BusinessMember; name: string; small?: boolean }) {
  const url = m.user_profile?.profile_photo_url;
  return <div className={small ? 'team-list-avatar team-list-avatar--sheet' : 'team-list-avatar'}>
    {url ? <img src={url} alt={name} /> : teamInitials(name)}
  </div>;
}

/** Renders `full` when it fits on one line, else `compact` (TeamSubtitle-style measurement). */
function FitLine({ full, compact, className, testId }: { full: ReactNode; compact: ReactNode; className: string; testId?: string }) {
  const lineRef = useRef<HTMLParagraphElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const line = lineRef.current; const probe = probeRef.current;
    if (!line || !probe) return;
    const measure = () => setFits(probe.getBoundingClientRect().width <= line.clientWidth || line.clientWidth === 0);
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(line);
    return () => ro?.disconnect();
  });
  return <p ref={lineRef} className={className} data-team-activity={testId}>
    <span ref={probeRef} className="team-list-probe" aria-hidden="true">{full}</span>
    {fits ? full : compact}
  </p>;
}

export function TeamListSection({ businessId, businessName, team, viewerRole, viewerId, loading, failed, onRetry }: Props) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const activity = useBusinessTeamActivity(businessId, !!viewerRole);
  const [sheet, setSheet] = useState<{ kind: SheetKind; member: BusinessMember } | null>(null);
  const [busy, setBusy] = useState(false);
  const [visOverride, setVisOverride] = useState<Record<string, boolean>>({});
  const [visSaving, setVisSaving] = useState(false);
  const [pickedRole, setPickedRole] = useState<AssignableBusinessRole | null>(null);
  const [titleDraft, setTitleDraft] = useState('');

  const rows = sortTeam(team);
  const byUser = new Map<string, TeamActivity>((activity.isSuccess ? activity.data : []).map(a => [a.user_id, a]));
  const now = new Date();
  const isSelf = (m: BusinessMember) => !!viewerId && m.user_profile_id === viewerId;
  const nameOf = (m: BusinessMember) => m.user_profile?.display_name || (m.user_profile?.username ? `@${m.user_profile.username}` : t('business.team.member'));
  const roleText = (r: BusinessRole) => t(`${P}.roles.${r}`);
  const isPublic = (m: BusinessMember) => visOverride[m.user_profile_id] ?? m.is_public === true;

  const refresh = (extra: string[] = []) => Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: ['business-team', businessId] }),
    queryClient.invalidateQueries({ queryKey: ['business-team-activity', businessId] }),
    ...extra.map(key => queryClient.invalidateQueries({ queryKey: [key, businessId] })),
  ]);

  const run = async (fn: string, args: Record<string, unknown>, jsonResult: boolean) => {
    const { data, error } = await (supabase.rpc as any)(fn, args);
    if (error) throw error;
    const result = data as { success?: boolean; error?: string } | null;
    if (jsonResult && result?.success === false) throw new Error(result.error || t(`${P}.failed`));
  };
  const write = async (fn: string, args: Record<string, unknown>, jsonResult: boolean, after: () => void | Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await run(fn, args, jsonResult);
      await after();
    } catch (error) {
      toast.error(errorMessage(error) || t(`${P}.failed`));
    } finally {
      setBusy(false);
    }
  };

  const openSheet = (kind: SheetKind, member: BusinessMember) => {
    if (kind === 'role') setPickedRole(member.role === 'owner' ? null : member.role);
    if (kind === 'jobTitle') setTitleDraft(member.job_title?.trim() || '');
    setSheet({ kind, member });
  };

  const toggleVisibility = async (m: BusinessMember) => {
    if (visSaving) return;
    const next = !isPublic(m);
    setVisOverride(o => ({ ...o, [m.user_profile_id]: next }));
    setVisSaving(true);
    try {
      await run('set_member_public_visibility', { _business_id: businessId, _member_user_id: m.user_profile_id, _is_public: next }, false);
      await refresh();
    } catch (error) {
      setVisOverride(o => ({ ...o, [m.user_profile_id]: !next }));
      toast.error(errorMessage(error) || t(`${P}.failed`));
    } finally {
      setVisSaving(false);
    }
  };

  const whenText = (w: When) => w.key === 'weekday' ? w.day : w.key === 'weeksAgo' ? t(`${P}.when.weeksAgo`, { count: w.count }) : t(`${P}.when.${w.key}`);

  const renderLine3 = (m: BusinessMember, line: ActivityLine, items: MenuItem[]) => {
    const prefix = isSelf(m) ? t(`${P}.youPrefix`) : '';
    if (line.kind === 'counts') {
      const parts: ReactNode[] = [];
      if (line.posts > 0) parts.push(<span key="p"><b>{line.posts}</b> {t(`${P}.posts`, { count: line.posts })}</span>);
      if (line.replies > 0) parts.push(<span key="r"><b>{line.replies}</b> {t(`${P}.replies`, { count: line.replies })}</span>);
      const joined = (list: ReactNode[]) => list.flatMap((p, i) => (i ? [' · ', p] : [p]));
      const base = <>{prefix}{joined(parts)}</>;
      const full = line.when ? <>{base} · {t(`${P}.activeWhen`, { when: whenText(line.when) })}</> : base;
      return <FitLine className="team-list-activity" testId="counts" full={full} compact={base} />;
    }
    if (line.kind === 'neverPosted') {
      const short = shortBusinessName(businessName) ?? businessName;
      return <FitLine className="team-list-activity" testId="never" full={<>{prefix}{t(`${P}.neverPosted`, { business: businessName })}</>} compact={<>{prefix}{t(`${P}.neverPosted`, { business: short })}</>} />;
    }
    if (line.kind === 'inactive') {
      const text = <>{prefix}{t(`${P}.inactive`, { count: line.weeks })}</>;
      return <p className="team-list-activity" data-team-activity="inactive">{text}{items.length > 0 && <> · <button type="button" className="team-list-link" data-team-review-access onClick={() => openSheet('menu', m)}>{t(`${P}.reviewAccess`)}</button></>}</p>;
    }
    return <p className="team-list-activity" data-team-activity="last">{prefix}{t(`${P}.lastActive`, { when: whenText(line.when) })}</p>;
  };

  const s = sheet?.member;
  const sName = s ? (isSelf(s) ? t(`${P}.you`) : nameOf(s)) : '';
  const sFirst = s ? memberFirstName(s) : '';
  const sItems = s ? memberMenu(viewerRole, viewerId, s, team) : [];
  const joined = s?.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : null;
  const currentTitle = s?.job_title?.trim() || '';

  const bullets = (list: string[]) => <ul className="team-list-bullets">{list.map(b => <li key={b}>{b}</li>)}</ul>;
  const buttons = (label: string, onConfirm: () => void, disabled: boolean, extra?: ReactNode) => <div className="team-sheet-buttons">
    <Button variant="ghost" className="team-sheet-confirm team-list-confirm" data-team-list-confirm={sheet?.kind} disabled={disabled || busy} onClick={onConfirm}>{label}</Button>
    {extra}
    <Button variant="ghost" className="team-sheet-cancel" onClick={() => setSheet(null)}>{t('action.cancel')}</Button>
  </div>;

  const sheetBody = () => {
    if (!sheet || !s) return null;
    switch (sheet.kind) {
      case 'menu': return <div data-team-menu>
        <div className="team-list-sheet-head">
          <Avatar m={s} name={nameOf(s)} small />
          <div className="min-w-0"><b id="team-list-sheet-title">{sName}</b><span>{joined ? t(`${P}.menu.joined`, { role: roleText(s.role), date: joined }) : roleText(s.role)}</span></div>
        </div>
        {sItems.map(item => {
          if (item === 'role') return <button key={item} type="button" className="team-list-item" data-menu-item={item} onClick={() => openSheet('role', s)}>{t(`${P}.menu.role`)}<span className="team-list-item-value">{roleText(s.role)}<ChevronRight size={14} /></span></button>;
          if (item === 'jobTitle') return <button key={item} type="button" className="team-list-item" data-menu-item={item} onClick={() => openSheet('jobTitle', s)}>{t(`${P}.menu.jobTitle`)}<span className="team-list-item-value"><span className="team-list-item-title">{currentTitle}</span><ChevronRight size={14} /></span></button>;
          if (item === 'visibility') {
            const on = isPublic(s);
            return <button key={item} type="button" role="switch" aria-checked={on} className="team-list-item" data-menu-item={item} disabled={visSaving} onClick={() => void toggleVisibility(s)}>
              <span className="team-list-item-label">{t(`${P}.menu.visibility`)}{!on && <span className="team-list-item-sub">{t(`${P}.menu.hiddenFrom`, { business: businessName })}</span>}</span>
              <span className={on ? 'team-list-toggle team-list-toggle--on' : 'team-list-toggle'} aria-hidden="true" />
            </button>;
          }
          if (item === 'makeOwner') return <button key={item} type="button" className="team-list-item" data-menu-item={item} onClick={() => openSheet('makeOwner', s)}>{t(`${P}.menu.makeOwner`)}</button>;
          if (item === 'remove') return <button key={item} type="button" className="team-list-item team-list-item--quiet" data-menu-item={item} onClick={() => openSheet('remove', s)}>{t(`${P}.menu.remove`)}</button>;
          return <button key={item} type="button" className="team-list-item team-list-item--quiet" data-menu-item={item} onClick={() => openSheet('leave', s)}>{t(`${P}.menu.leave`, { business: businessName })}</button>;
        })}
      </div>;
      case 'role': return <div data-team-role-sheet>
        <h2 id="team-list-sheet-title" className="team-sheet-title team-list-title">{t(`${P}.roleSheet.title`, { name: sName })}</h2>
        <p className="team-sheet-line">{t(`${P}.roleSheet.line`)}</p>
        <div className="team-request-kicker team-sheet-kicker">{t(`${P}.roleSheet.kicker`)}</div>
        <div role="radiogroup" aria-label={t(`${P}.roleSheet.kicker`)} className="team-role-cards">
          {ASSIGNABLE.map(role => <Button variant="ghost" role="radio" aria-checked={pickedRole === role} key={role} className="team-role-card" onClick={() => setPickedRole(role)}>
            <span className="team-role-radio" aria-hidden="true" />
            <span className="team-role-content"><span className="team-role-title">{t(`business.team.sectionOne.roles.${role}`)}{s.role === role && <span className="team-role-asked" data-current-role={role}>{t(`${P}.roleSheet.current`)}</span>}</span><span className="team-role-description">{t(`business.team.sectionOne.descriptions.${role}`, { business: businessName })}</span></span>
          </Button>)}
        </div>
        {buttons(pickedRole && pickedRole !== s.role ? t(`${P}.roleSheet.make.${pickedRole}`, { first: sFirst }) : t(`${P}.roleSheet.chooseNew`), () => {
          if (!pickedRole) return;
          const role = pickedRole;
          void write('update_business_member_role', { p_business_id: businessId, p_member_user_id: s.user_profile_id, p_new_role: role }, true, async () => {
            toast.success(t(`${P}.roleSheet.done`, { first: sFirst, role: roleText(role) }));
            setSheet(null); await refresh(['business-membership']);
          });
        }, !pickedRole || pickedRole === s.role)}
      </div>;
      case 'jobTitle': {
        const next = titleDraft.trim();
        const saveTitle = (value: string) => write('set_member_job_title', { _business_id: businessId, _member_user_id: s.user_profile_id, _job_title: value }, false, async () => {
          toast.success(t(`${P}.jobSheet.${value ? 'saved' : 'removed'}`));
          setSheet(null); await refresh();
        });
        return <div data-team-job-sheet>
          <h2 id="team-list-sheet-title" className="team-sheet-title team-list-title">{t(`${P}.jobSheet.title`, { name: sName })}</h2>
          <p className="team-sheet-line">{t(`${P}.jobSheet.${isSelf(s) ? 'lineSelf' : 'line'}`)}</p>
          <input className="team-list-field" aria-label={t(`${P}.menu.jobTitle`)} maxLength={40} value={titleDraft} onChange={e => setTitleDraft(e.target.value.slice(0, 40))} />
          <div className="team-list-count"><span>{t(`${P}.jobSheet.hint`)}</span><span className="tabular-nums" data-team-title-count>{titleDraft.length}/40</span></div>
          {buttons(t(`${P}.jobSheet.save`), () => void saveTitle(next), next === currentTitle,
            currentTitle ? <Button variant="ghost" className="team-sheet-cancel" data-team-title-remove disabled={busy} onClick={() => void saveTitle('')}>{t(`${P}.jobSheet.remove`)}</Button> : undefined)}
        </div>;
      }
      case 'makeOwner': return <div data-team-owner-sheet>
        <h2 id="team-list-sheet-title" className="team-sheet-title team-list-title">{t(`${P}.ownerSheet.title`, { name: sName })}</h2>
        {bullets([t(`${P}.ownerSheet.b1`, { first: sFirst, business: businessName }), t(`${P}.ownerSheet.b2`, { first: sFirst })])}
        {buttons(t(`${P}.ownerSheet.confirm`, { first: sFirst }), () => void write('transfer_business_ownership', { p_business_id: businessId, p_new_owner_user_id: s.user_profile_id }, true, async () => {
          toast.success(t(`${P}.ownerSheet.done`, { first: sFirst }));
          setSheet(null); await refresh(['business-membership']);
        }), false)}
      </div>;
      case 'remove': return <div data-team-remove-sheet>
        <h2 id="team-list-sheet-title" className="team-sheet-title team-list-title">{t(`${P}.removeSheet.title`, { name: sName })}</h2>
        {bullets([t(`${P}.removeSheet.b1`, { first: sFirst, business: businessName }), t(`${P}.removeSheet.b2`, { first: sFirst, business: businessName }), t(`${P}.removeSheet.b3`, { first: sFirst })])}
        {buttons(t(`${P}.removeSheet.confirm`, { first: sFirst }), () => void write('remove_business_member', { p_business_id: businessId, p_member_user_id: s.user_profile_id }, true, async () => {
          toast.success(t(`${P}.removeSheet.done`, { first: sFirst }));
          setSheet(null); await refresh();
        }), false)}
      </div>;
      case 'leave': return <div data-team-leave-sheet>
        <h2 id="team-list-sheet-title" className="team-sheet-title team-list-title">{t(`${P}.leaveSheet.title`, { business: businessName })}</h2>
        {bullets([t(`${P}.leaveSheet.b1`), t(`${P}.leaveSheet.b2`, { business: businessName })])}
        {buttons(t(`${P}.leaveSheet.confirm`), () => void write('remove_business_member', { p_business_id: businessId, p_member_user_id: s.user_profile_id }, true, async () => {
          toast.success(t(`${P}.leaveSheet.done`, { business: businessName }));
          setSheet(null);
          void refresh(['business-membership']);
          void queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
          navigate('/businesses/manage', { replace: true });
        }), false)}
      </div>;
    }
  };

  return <section className="team-list" data-team-list>
    <div className="team-request-kicker"><span>{t(`${P}.kicker`)}</span><span className="team-list-window">{t(`${P}.window`)}</span></div>
    {loading ? [0, 1, 2].map(i => <div key={i} className="team-list-row" data-team-row-skeleton><div className="team-list-avatar" /><div className="team-list-person"><div className="team-summary-skeleton-bar" /></div></div>)
      : failed ? <div className="team-list-error">
        <p className="team-list-error-title">{t(`${P}.loadFailed`)}</p>
        <p className="team-list-error-line">{t(`${P}.loadFailedLine`)}</p>
        <Button variant="ghost" className="team-request-pill team-request-pill--approve team-list-retry" onClick={onRetry}>{t(`${P}.retry`)}</Button>
      </div>
      : rows.map(m => {
        const items = memberMenu(viewerRole, viewerId, m, team);
        const name = nameOf(m);
        const title = m.job_title?.trim();
        const line = activity.isSuccess ? activityLine(m, byUser.get(m.user_profile_id), now) : null;
        return <div key={m.id} className="team-list-row" data-member-row={m.user_profile_id}>
          <Avatar m={m} name={name} />
          <div className="team-list-person">
            <div className="team-list-name"><span>{name}</span>
              <span className={m.role === 'owner' ? 'team-list-role team-list-role--owner' : 'team-list-role'} data-role-badge={m.role}>{roleText(m.role)}</span>
              {!isPublic(m) && <span className="team-list-hidden" data-team-hidden>{t(`${P}.hidden`)}</span>}
            </div>
            <p className="team-list-meta" data-team-meta>
              {title ? title : <>{m.user_profile?.username ? `@${m.user_profile.username}` : ''}{items.includes('jobTitle') && <>{m.user_profile?.username ? ' · ' : ''}<button type="button" className="team-list-link" data-team-add-title onClick={() => openSheet('jobTitle', m)}>{t(`${P}.addJobTitle`)}</button></>}</>}
            </p>
            {line && renderLine3(m, line, items)}
          </div>
          {items.length > 0 && <button type="button" className="team-list-more" data-team-more aria-label={t(`${P}.menu.actions`, { name })} onClick={() => openSheet('menu', m)}><MoreHorizontal size={18} /></button>}
        </div>;
      })}
    <BottomSheet open={!!sheet} onClose={() => setSheet(null)} ariaLabelledBy="team-list-sheet-title" className="team-decision-sheet" scrollBody>
      <div className="team-list-sheet">{sheetBody()}</div>
    </BottomSheet>
  </section>;
}
