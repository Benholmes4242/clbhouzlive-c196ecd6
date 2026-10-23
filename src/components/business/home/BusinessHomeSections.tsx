/**
 * CB68.1 — Business home sections below the header, in order:
 * This week (CB67), Do next (CB68), then the temporary BusinessCommandCard body.
 * Every future section goes here, so page-level tests stub this one component.
 * Renders a fragment so each section stays a direct sibling of the header.
 */
import type { BusinessMembership } from '@/hooks/useMyBusinesses';
import { BusinessCommandCard } from '@/components/business/BusinessCommandCard';
import { BusinessWeekCard } from './BusinessWeekCard';
import { BusinessDoNextCard } from './BusinessDoNextCard';

export function BusinessHomeSections({ membership, userId }: { membership: BusinessMembership; userId: string | undefined }) {
  const id = membership.business.id;
  return (
    <>
      <BusinessWeekCard key={`week-${id}`} businessId={id} name={membership.business.name} />
      {/* Absent when empty. */}
      <BusinessDoNextCard key={`donext-${id}`} membership={membership} />
      <div className="pb-8">
        <BusinessCommandCard key={id} membership={membership} userId={userId} bodyOnly />
      </div>
    </>
  );
}
