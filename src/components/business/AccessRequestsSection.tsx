import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { AppLog } from '@/lib/logger';
import { useTranslation } from 'react-i18next';
import { useBusinessAccessRequests, type AccessRequest } from '@/hooks/useBusinessAccessRequests';
import { requestPlaysHere, requestWhen, teamInitials } from './teamSummary';

// Match the granted role: manager → Admin; team_member/other → Editor.
export function getRoleLabel(role: string): string {
  switch (role?.toLowerCase()) {
    case 'manager':
    case 'admin': return 'Admin';
    case 'analyst': return 'Analyst';
    default: return 'Editor';
  }
}

/** CB75: the parent shares its requests observer with the summary/card. Standalone
 * callers retain the same hook/key. TEAM_FIX_V1 remains the decision authority;
 * JSON refusals leave the sheet and row intact; pending locks are row-scoped. */
export function AccessRequestsSection({ businessId, businessName, canManage, clubId, requestsQuery }: {
  businessId: string; businessName: string; businessAvatarUrl?: string | null;
  canManage: boolean; clubId?: string | null;
  requestsQuery?: ReturnType<typeof useBusinessAccessRequests>;
}) {
  const ownQuery = useBusinessAccessRequests(businessId, canManage && !requestsQuery);
  const query = requestsQuery ?? ownQuery;
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  const [sheet, setSheet] = useState<{ request: AccessRequest; decision: 'approve' | 'decline' } | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'analyst'>('editor');
  const [pending, setPending] = useState<Set<string>>(new Set());
  const pendingRef = useRef(new Set<string>());
  const prefix = 'business.team.sectionOne';
  const nameOf = (request: AccessRequest) => request.requester.display_name || (request.requester.username ? `@${request.requester.username}` : t(`${prefix}.user`));
  const firstOf = (request: AccessRequest) => request.requester.display_name?.trim().split(/\s+/)[0] || (request.requester.username ? `@${request.requester.username}` : t(`${prefix}.user`));
  const roleText = (role: string) => t(`${prefix}.roles.${role}`);
  const open = (request: AccessRequest, decision: 'approve' | 'decline') => {
    setSelectedRole(getRoleLabel(request.requested_role).toLowerCase() as 'admin' | 'editor' | 'analyst');
    setSheet({ request, decision });
  };
  const decide = async (request: AccessRequest, decision: 'approve' | 'decline', role: string | null) => {
    if (pendingRef.current.has(request.id)) return;
    pendingRef.current.add(request.id);
    setPending(new Set(pendingRef.current));
    try {
      const { data, error } = await supabase.rpc('decide_business_access_request', {
        p_request_id: request.id, p_decision: decision, p_role: role,
      });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string; already_resolved?: boolean; status?: string } | null;
      if (result?.success === false || result?.error) throw new Error(result.error || t(`${prefix}.${decision}Failed`));
      if (result?.already_resolved) toast.info(t(`${prefix}.alreadyResolved`, { status: result.status }));
      else if (decision === 'approve') toast.success(t(`${prefix}.joined`, { name: nameOf(request), role: roleText(role ?? 'editor') }));
      else toast.success(t(`${prefix}.declined`));
      // Do not close a different row's sheet if this request resolves later.
      setSheet(current => current?.request.id === request.id ? null : current);
      const keys = decision === 'approve'
        ? ['business-access-requests', 'business-team-members', 'business-team', 'business-invites', 'business-pending-requests-count', 'business-members', 'business-membership']
        : ['business-access-requests', 'business-pending-requests-count'];
      void Promise.allSettled([
        ...keys.map(key => queryClient.invalidateQueries({ queryKey: [key, businessId] })),
        ...['activity-feed', 'activity-unread-count', 'notifications', 'unread-notifications-count'].map(key => queryClient.invalidateQueries({ queryKey: [key] })),
      ]);
    } catch (error) {
      AppLog.error('AccessRequestsSection', `${decision} error:`, error);
      toast.error(error instanceof Error ? error.message : t(`${prefix}.${decision}Failed`));
    } finally {
      pendingRef.current.delete(request.id);
      setPending(new Set(pendingRef.current));
    }
  };
  if (!canManage || query.isPending || query.isError || !query.data?.length) return null;
  const activeRequest = sheet?.request;
  const first = activeRequest ? firstOf(activeRequest) : '';
  const busy = !!activeRequest && pending.has(activeRequest.id);
  return <>
    <section className="team-requests" data-team-requests>
      <div className="team-request-kicker"><span>{t(`${prefix}.askedToJoin`)}</span><span className="team-request-count">{query.data.length}</span></div>
      {query.data.map(request => {
        const name = nameOf(request);
        const date = requestWhen(request.created_at, new Date());
        const when = date.key === 'date' ? date.value : t(`${prefix}.${date.key}`);
        const playsHere = requestPlaysHere(clubId, request.requester);
        const meta = playsHere ? t(`${prefix}.playsHere`, { when }) : request.requester.username
          ? t(`${prefix}.usernameAsked`, { username: request.requester.username, when }) : t(`${prefix}.asked`, { when });
        return <div className="team-request-row" key={request.id} data-request-id={request.id}>
          <div className="team-request-avatar">{request.requester.profile_photo_url ? <img src={request.requester.profile_photo_url} alt={name} /> : teamInitials(name)}</div>
          <div className="team-request-person">
            <div className="team-request-name"><span>{name}</span><span className="team-request-role">{roleText(getRoleLabel(request.requested_role).toLowerCase())}</span></div>
            <p className="team-request-meta" data-plays-here={playsHere}>{meta}</p>
            {request.message && <blockquote className="team-request-quote">{request.message}</blockquote>}
            <div className="team-request-actions">
              <Button variant="ghost" className="team-request-pill team-request-pill--approve" data-request-action="approve" onClick={() => open(request, 'approve')} disabled={pending.has(request.id)}>{t(`${prefix}.approve`)}</Button>
              <Button variant="ghost" className="team-request-pill" data-request-action="decline" onClick={() => open(request, 'decline')} disabled={pending.has(request.id)}>{t(`${prefix}.decline`)}</Button>
            </div>
          </div>
        </div>;
      })}
    </section>
    <BottomSheet open={!!sheet} onClose={() => setSheet(null)} ariaLabelledBy="team-decision-title" className="team-decision-sheet" scrollBody>
      {activeRequest && <>
        <h2 id="team-decision-title" className="team-sheet-title">{t(`${prefix}.${sheet?.decision === 'approve' ? 'addTitle' : 'declineTitle'}`, { name: nameOf(activeRequest), business: businessName })}</h2>
        <p className="team-sheet-line">{t(`${prefix}.${sheet?.decision === 'approve' ? 'addLine' : 'declineLine'}`, { first })}</p>
        {sheet?.decision === 'approve' && <>
          <div className="team-request-kicker team-sheet-kicker">{t(`${prefix}.role`)}</div>
          <div role="radiogroup" aria-label={t(`${prefix}.role`)} className="team-role-cards">
            {(['admin', 'editor', 'analyst'] as const).map(role => {
              const asked = getRoleLabel(activeRequest.requested_role).toLowerCase() === role;
              return <Button variant="ghost" role="radio" aria-checked={selectedRole === role} key={role} className="team-role-card" onClick={() => setSelectedRole(role)}>
                <span className="team-role-radio" aria-hidden="true" />
                <span className="team-role-content"><span className="team-role-title">{roleText(role)}{asked && <span className="team-role-asked" data-requested-role={role}>{t(`${prefix}.askedFor`, { first })}</span>}</span><span className="team-role-description">{t(`${prefix}.descriptions.${role}`, { business: businessName })}</span></span>
              </Button>;
            })}
          </div>
        </>}
        <div className="team-sheet-buttons">
          <Button variant="ghost" className="team-sheet-confirm" data-team-confirm={sheet?.decision} disabled={busy} onClick={() => { if (sheet) void decide(activeRequest, sheet.decision, sheet.decision === 'approve' ? selectedRole : null); }}>{sheet?.decision === 'approve' ? t(`${prefix}.addAs`, { role: roleText(selectedRole) }) : t(`${prefix}.decline`)}</Button>
          <Button variant="ghost" className="team-sheet-cancel" onClick={() => setSheet(null)}>{t('action.cancel')}</Button>
        </div>
      </>}
    </BottomSheet>
  </>;
}
