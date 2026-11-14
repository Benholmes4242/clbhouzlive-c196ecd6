/** Opt-in name CONTENT for tiles and headers: the caller retains its original
 * name element, position and line reservation. Only member ids enter the shared
 * batched cache; business and Tour player callers must pass no id. */
import type { ReactNode } from 'react';
import { useProMembers } from './useProMembers';
import { ProLabel } from './ProLabel';
import { useAmateurMembers } from '@/features/amateur-ranking/useAmateurMembers';

export function InlineProMemberName({ userId, children }: { userId?: string | null; children: ReactNode }) {
  const { members } = useProMembers([userId]);
  const { members: amateurs } = useAmateurMembers([userId]);
  return <span className="pro-inline-name"><span className="pro-inline-text">{children}</span>{userId && members.has(userId) ? <ProLabel /> : userId && amateurs.has(userId) ? <ProLabel kind="am" /> : null}</span>;
}