/** Sibling mark placed straight after a caller's untouched name element, in the
 * parent that holds the Verified badge. A verified pro shows PRO only (PRO
 * already means verified); other verified members keep the tick. */
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useProMembers } from './useProMembers';
import { ProLabel } from './ProLabel';

export function ProOrVerifiedMark({ userId, verified }: { userId?: string | null; verified?: boolean | null }) {
  const { members } = useProMembers([userId]);
  if (userId && members.has(userId)) return <ProLabel />;
  return verified ? <VerifiedBadge size="sm" /> : null;
}
