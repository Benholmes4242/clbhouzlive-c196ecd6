/** Sibling mark placed straight after a caller's untouched name element, in the
 * parent that holds the Verified badge. A verified pro shows PRO only (PRO
 * already means verified); otherwise verified WAGR identity shows AM before
 * falling back to the existing verified tick. Neither mark uses results visibility. */
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useProMembers } from './useProMembers';
import { ProLabel } from './ProLabel';
import { useAmateurMembers } from '@/features/amateur-ranking/useAmateurMembers';

export function ProOrVerifiedMark({ userId, verified, name, tickClassName }: { userId?: string | null; verified?: boolean | null; name?: string; /** Class for the fallback tick only, so a caller keeps its tick layout. */ tickClassName?: string }) {
  const { members } = useProMembers([userId]);
  const { members: amateurs } = useAmateurMembers([userId]);
  if (userId && members.has(userId)) return <ProLabel userId={userId} name={name} surface="mark" />;
  if (userId && amateurs.has(userId)) return <ProLabel kind="am" userId={userId} name={name} surface="mark" />;
  return verified ? <VerifiedBadge size="sm" className={tickClassName} /> : null;
}
