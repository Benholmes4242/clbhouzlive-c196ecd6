import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Mail, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { fireInviteEmail, useRevokeInvite, type AssignableBusinessRole, type BusinessInvite, type BusinessMember, type BusinessRole } from '@/hooks/useBusinessTeam';
import { inviteName, teamInitials } from './teamSummary';
import { memberFirstName } from './teamList';
import { agoBucket, cardInvites, inviteFirstName, inviteLink, inviterMember, isEmailInvite, untilBucket, type Ago, type Until } from './teamInvites';

/** CB77 section three: invites. Owners/admins only; rows come from cardInvites
 * (summaryInvites underneath). Resend and role change call the deployed RPCs and
 * send the email only when the server says send_email; cancel is useRevokeInvite.
 * Sheet chrome is BottomSheet's, shared with section two. */

const P = 'business.team.sectionThree';
const ASSIGNABLE: AssignableBusinessRole[] = ['admin', 'editor', 'analyst'];
const errorMessage = (error: unknown) => (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message || '') : '');
type SheetKind = 'menu' | 'role' | 'cancel';

interface Props {
  businessId: string; businessName: string; team: BusinessMember[];
  invites: BusinessInvite[] | undefined; canManage: boolean; viewerId: string | null | undefined;
}

function InviteAvatar({ invite, small }: { invite: BusinessInvite; small?: boolean }) {
  const cls = small ? 'team-list-avatar team-list-avatar--sheet' : 'team-list-avatar';
  if (isEmailInvite(invite)) return <div className={`${cls} team-invite-mail`} data-invite-envelope><Mail size={18} strokeWidth={1.9} /></div>;
  const url = invite.invitee_profile?.profile_photo_url;
  const name = inviteName(invite);
  return <div className={cls} data-invite-avatar>{url ? <img src={url} alt={name} /> : teamInitials(name)}</div>;
}

export function TeamInvitesSection({ businessId, businessName, team, invites, canManage, viewerId }: Props) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const revoke = useRevokeInvite(businessId, { successMessage: t(`${P}.cancelSheet.done`) });
  const [sheet, setSheet] = useState<{ kind: SheetKind; invite: BusinessInvite; expired: boolean } | null>(null);
  const [resending, setResending] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [pickedRole, setPickedRole] = useState<AssignableBusinessRole | null>(null);

  if (!canManage || !invites) return null;
  const now = new Date();
  const rows = cardInvites(invites, team, now);
  if (!rows.length) return null;

  const roleText = (r: BusinessRole) => t(`business.team.sectionTwo.roles.${r}`);
  const agoText = (a: Ago) => 'count' in a ? t(`${P}.ago.${a.key}`, { count: a.count }) : t(`${P}.ago.${a.key}`);
  const untilText = (u: Until) => u.key === 'days' ? t(`${P}.expiry.days`, { count: u.count }) : t(`${P}.expiry.${u.key}`);
  const refreshInvites = () => Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: ['business-invites', businessId] }),
    queryClient.invalidateQueries({ queryKey: ['business-team-feed', businessId] }),
  ]);

  const callRpc = async (fn: string, args: Record<string, unknown>) => {
    const { data, error } = await (supabase.rpc as any)(fn, args);
    if (error) throw error;
    const result = data as { success?: boolean; error?: string; send_email?: boolean } | null;
    if (!result || result.success === false) throw new Error(result?.error || t('business.team.sectionTwo.failed'));
    return result;
  };

  const resend = async (invite: BusinessInvite) => {
    if (resending[invite.id]) return;
    setResending(r => ({ ...r, [invite.id]: true }));
    try {
      const result = await callRpc('resend_business_invite', { p_invite_id: invite.id });
      if (result.send_email === true) void fireInviteEmail(invite.id);
      toast.success(t(`${P}.resent`, { name: isEmailInvite(invite) ? invite.invitee_email || '' : inviteFirstName(invite) }));
      await refreshInvites();
    } catch (error) {
      toast.error(errorMessage(error) || t('business.team.sectionTwo.failed'));
    } finally {
      setResending(r => { const next = { ...r }; delete next[invite.id]; return next; });
    }
  };

  const copyLink = async (invite: BusinessInvite) => {
    try {
      if (!invite.token || !navigator.clipboard?.writeText) throw new Error('clipboard');
      await navigator.clipboard.writeText(inviteLink(invite.token));
      toast.success(t(`${P}.menu.copied`));
    } catch {
      toast.error(t(`${P}.menu.copyFailed`));
    }
  };

  const changeRole = async (invite: BusinessInvite, role: AssignableBusinessRole) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await callRpc('update_business_invite_role', { p_invite_id: invite.id, p_role: role });
      if (result.send_email === true) void fireInviteEmail(invite.id);
      toast.success(t(`${P}.roleSheet.done`, { first: inviteFirstName(invite), role: roleText(role) }));
      setSheet(null);
      await refreshInvites();
    } catch (error) {
      toast.error(errorMessage(error) || t('business.team.sectionTwo.failed'));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (invite: BusinessInvite) => {
    if (busy) return;
    setBusy(true);
    try {
      await revoke.mutateAsync(invite.id);
      void queryClient.invalidateQueries({ queryKey: ['business-team-feed', businessId] });
      setSheet(null);
    } catch {
      /* useRevokeInvite toasts the failure; the sheet stays open */
    } finally {
      setBusy(false);
    }
  };

  const open = (kind: SheetKind, invite: BusinessInvite, expired: boolean) => {
    if (kind === 'role') setPickedRole(invite.role);
    setSheet({ kind, invite, expired });
  };

  const buttons = (label: string, onConfirm: () => void, disabled: boolean, cancelLabel: string) => <div className="team-sheet-buttons">
    <Button variant="ghost" className="team-sheet-confirm team-list-confirm" data-invite-confirm={sheet?.kind} disabled={disabled || busy} onClick={onConfirm}>{label}</Button>
    <Button variant="ghost" className="team-sheet-cancel" onClick={() => setSheet(null)}>{cancelLabel}</Button>
  </div>;

  const sheetBody = (): ReactNode => {
    if (!sheet) return null;
    const { invite, expired } = sheet;
    const name = inviteName(invite);
    const first = inviteFirstName(invite);
    if (sheet.kind === 'menu') return <div data-invite-menu>
      <div className="team-list-sheet-head">
        <InviteAvatar invite={invite} small />
        <div className="min-w-0"><b id="team-invite-sheet-title">{name}</b><span>{t(`${P}.menu.head`, { role: roleText(invite.role), sent: agoText(agoBucket(invite.created_at, now)) })}</span></div>
      </div>
      {!expired && <button type="button" className="team-list-item" data-invite-item="copy" onClick={() => void copyLink(invite)}>
        <span className="team-list-item-label">{t(`${P}.menu.copy`)}<span className="team-list-item-sub" data-invite-copy-sub={isEmailInvite(invite) ? 'email' : 'golfer'}>{isEmailInvite(invite) ? t(`${P}.menu.copyEmail`, { role: roleText(invite.role) }) : t(`${P}.menu.copyGolfer`, { first })}</span></span>
      </button>}
      <button type="button" className="team-list-item" data-invite-item="role" onClick={() => open('role', invite, expired)}>
        <span className="team-list-item-label">{t(`${P}.menu.changeRole`)}<span className="team-list-item-sub">{t(`${P}.menu.changeRoleSub`)}</span></span>
        <span className="team-list-item-value">{roleText(invite.role)}<ChevronRight size={14} /></span>
      </button>
      <button type="button" className="team-list-item team-list-item--quiet" data-invite-item="cancel" onClick={() => open('cancel', invite, expired)}>{t(`${P}.menu.cancel`)}</button>
    </div>;
    if (sheet.kind === 'role') return <div data-invite-role-sheet>
      <h2 id="team-invite-sheet-title" className="team-sheet-title team-list-title">{t(`${P}.roleSheet.title`, { name })}</h2>
      <p className="team-sheet-line">{t(`${P}.roleSheet.line`)}</p>
      <div className="team-request-kicker team-sheet-kicker">{t('business.team.sectionTwo.roleSheet.kicker')}</div>
      <div role="radiogroup" aria-label={t('business.team.sectionTwo.roleSheet.kicker')} className="team-role-cards">
        {ASSIGNABLE.map(role => <Button variant="ghost" role="radio" aria-checked={pickedRole === role} key={role} data-invite-role={role} className="team-role-card" onClick={() => setPickedRole(role)}>
          <span className="team-role-radio" aria-hidden="true" />
          <span className="team-role-content"><span className="team-role-title">{t(`business.team.sectionOne.roles.${role}`)}{invite.role === role && <span className="team-role-asked" data-current-role={role}>{t('business.team.sectionTwo.roleSheet.current')}</span>}</span><span className="team-role-description">{t(`business.team.sectionOne.descriptions.${role}`, { business: businessName })}</span></span>
        </Button>)}
      </div>
      {buttons(pickedRole && pickedRole !== invite.role ? t(`${P}.roleSheet.send`, { role: roleText(pickedRole) }) : t(`${P}.roleSheet.chooseNew`),
        () => { if (pickedRole && pickedRole !== invite.role) void changeRole(invite, pickedRole); },
        !pickedRole || pickedRole === invite.role, t('action.cancel'))}
    </div>;
    return <div data-invite-cancel-sheet>
      <h2 id="team-invite-sheet-title" className="team-sheet-title team-list-title">{t(`${P}.cancelSheet.title`, { name })}</h2>
      <ul className="team-list-bullets"><li>{t(`${P}.cancelSheet.b1`)}</li><li>{t(`${P}.cancelSheet.b2`, { first })}</li></ul>
      {buttons(t(`${P}.cancelSheet.confirm`), () => void cancel(invite), false, t(`${P}.cancelSheet.keep`))}
    </div>;
  };

  return <section className="team-list team-invites" data-team-invites>
    <div className="team-request-kicker"><span>{t(`${P}.kicker`)}</span><span className="team-list-window tabular-nums" data-invite-count>{rows.length}</span></div>
    {rows.map(({ invite, expired }) => {
      const name = inviteName(invite);
      const inviter = inviterMember(invite, team, viewerId);
      return <div key={invite.id} className="team-list-row team-invite-row" data-invite-row={invite.id} data-invite-state={expired ? 'expired' : 'live'}>
        <InviteAvatar invite={invite} />
        <div className="team-list-person">
          <div className="team-list-name"><span data-invite-name>{name}</span></div>
          <p className="team-list-meta" data-invite-role-line>{inviter ? t(`${P}.invitedAsBy`, { role: roleText(invite.role), first: memberFirstName(inviter) }) : t(`${P}.invitedAs`, { role: roleText(invite.role) })}</p>
          <p className={expired ? 'team-list-activity team-invite-expired' : 'team-list-activity'} data-invite-when={expired ? 'expired' : 'live'}>
            {expired ? t(`${P}.expired`, { ago: agoText(agoBucket(invite.expires_at, now)) })
              : t(`${P}.sentExpires`, { sent: agoText(agoBucket(invite.created_at, now)), expiry: untilText(untilBucket(invite.expires_at, now)) })}
          </p>
          <Button variant="ghost" className="team-request-pill team-invite-resend" data-invite-resend disabled={!!resending[invite.id]} onClick={() => void resend(invite)}>{t(`${P}.resend`)}</Button>
        </div>
        <button type="button" className="team-list-more team-invite-more" data-invite-more aria-label={t(`${P}.menu.actions`, { name })} onClick={() => open('menu', invite, expired)}><MoreHorizontal size={18} /></button>
      </div>;
    })}
    <BottomSheet open={!!sheet} onClose={() => setSheet(null)} ariaLabelledBy="team-invite-sheet-title" className="team-decision-sheet" scrollBody>
      <div className="team-list-sheet">{sheetBody()}</div>
    </BottomSheet>
  </section>;
}
