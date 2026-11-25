/** Brief 25 B7: the owner's status card plus its "Fix and send again" claim
 * sheet. request_course_claim lets a rejected club refile; the database puts
 * it back to pending. Delete stays with the page. */
import { useState } from 'react';
import { ClaimYourCourseSheet } from '@/components/business/ClaimYourCourseSheet';
import { ListingStatusCard } from './ListingStatusCard';
import type { ListingStatus } from './listingStatus';

export function ListingStatusPanel({ status, businessId, businessName, userId, onDelete }: {
  status: Exclude<ListingStatus, 'live'>; businessId: string; businessName: string; userId?: string; onDelete: () => void;
}) {
  const [claimOpen, setClaimOpen] = useState(false);
  return <>
    <ListingStatusCard status={status} businessId={businessId} onFix={() => setClaimOpen(true)} onDelete={onDelete} />
    {userId && <ClaimYourCourseSheet open={claimOpen} onClose={() => setClaimOpen(false)} businessId={businessId} businessName={businessName} userProfileId={userId} />}
  </>;
}
