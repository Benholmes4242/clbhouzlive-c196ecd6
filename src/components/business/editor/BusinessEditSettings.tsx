/** BE1 Settings owns only presentation and entrypoints. Verification state
 * stays in deriveVerificationState; notification writes stay in the shared
 * NotificationsSection; deletion retains the canonical hoisted dialog. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { DeleteBusinessDialog } from '@/components/business/DeleteBusinessDialog';
import { useBusinessTeam, type BusinessRole } from '@/hooks/useBusinessTeam';
import { deriveVerificationState, useBusinessVerificationRequest } from '@/hooks/useBusinessVerificationRequest';
import { NotificationsSection } from './NotificationsSection';

const VERIFICATION_COPY = {
  none: ['Not verified yet', 'Verified businesses carry the badge next to their name and unlock Insights.', 'Start verification'],
  pending: ['Verification in review', "We're checking your details. Nothing else is needed from you right now.", 'See your request'],
  needs_more_info: ['We need a bit more', "Add what's missing to finish verification.", 'Add details'],
  rejected: ['Not approved', "Your last request wasn't approved. You can see why and apply again.", 'See why'],
  verified: ['Verified', 'Your badge shows next to the business name across clbhouz.', null],
} as const;

export function BusinessEditSettings({ business, role, userId }: {
  business: { id: string; name: string; is_verified?: boolean | null }; role?: BusinessRole; userId: string;
}) {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const request = useBusinessVerificationRequest(business.id);
  const team = useBusinessTeam(business.id);
  const state = deriveVerificationState(business.is_verified, request.data);
  const [title, body, action] = VERIFICATION_COPY[state];
  const canManage = role === 'owner' || role === 'admin';
  const count = !team.isLoading && !team.isError && team.data ? team.data.length : null;
  return <div className="be1-settings ep-settings">
    <h2 className="ep-group">Verification</h2>
    <div className="be1-verification">
      <h2>{title}{state === 'verified' ? <span aria-hidden="true"><VerifiedBadge size="sm" /></span> : null}</h2>
      <p>{body}</p>
      {action && canManage ? <Button type="button" variant="ghost" className="be1-pill" onClick={() => navigate(`/business/${business.id}/verification`)}>{action}</Button> : null}
    </div>
    <NotificationsSection businessId={business.id} settingsAppearance canManage={canManage} />
    <h2 className="ep-group">Team</h2>
    <div className="ep-rows"><Button type="button" variant="ghost" className="ep-row" onClick={() => navigate(`/business/${business.id}/team`)}>
      <span className="ep-row-label">Managers</span><span className="ep-row-value">{count == null ? '' : `${count} ${count === 1 ? 'person' : 'people'}`}</span><ChevronRight className="ep-row-chev" size={18} />
    </Button></div>
    {role === 'owner' ? <>
      <div className="ep-rows ep-settings-end"><Button type="button" variant="ghost" className="ep-row" onClick={() => setDeleteOpen(true)}><span className="ep-row-value be1-delete">Delete business</span></Button></div>
      <DeleteBusinessDialog open={deleteOpen} onOpenChange={setDeleteOpen} businessId={business.id} businessName={business.name} userId={userId} />
    </> : null}
  </div>;
}