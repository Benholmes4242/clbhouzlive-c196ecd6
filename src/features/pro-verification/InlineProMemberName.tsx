/** Opt-in name CONTENT for tiles and headers: the caller retains its original
 * name element, position and line reservation. Only member ids enter the shared
 * batched cache; business and Tour player callers must pass no id.
 * Clamped text opts into flow="text" so WebKit sees only inline name/badge
 * boxes; the default tile/header structure and badge behaviour stay intact. */
import type { ReactNode } from 'react';
import { useProMembers } from './useProMembers';
import { ProLabel } from './ProLabel';
import { textOfNode } from "@/features/member-badge/memberBadgeRules";
import { useAmateurMembers } from '@/features/amateur-ranking/useAmateurMembers';
import { useVerifiedMembers } from './useVerifiedMembers';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

export function InlineProMemberName({ userId, children, flow }: { userId?: string | null; children: ReactNode; flow?: 'text' }) {
  const { members, isLoading: proLoading } = useProMembers([userId]);
  const { members: amateurs, isLoading: amLoading } = useAmateurMembers([userId]);
  const { members: verified } = useVerifiedMembers([userId]);
  return <span className="pro-inline-name" data-flow={flow}><span className="pro-inline-text">{children}</span>{userId && members.has(userId) ? <ProLabel userId={userId} name={textOfNode(children)} surface="inline" /> : userId && amateurs.has(userId) ? <ProLabel kind="am" userId={userId} name={textOfNode(children)} surface="inline" /> : userId && !proLoading && !amLoading && verified.has(userId) ? <VerifiedBadge size="sm" className="member-verified-tick" /> : null}</span>;
}