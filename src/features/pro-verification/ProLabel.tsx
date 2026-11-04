import type { ReactNode } from 'react';
import { useProMembers } from './useProMembers';
import './pro-label.css';

export function ProLabel({ size = 'small' }: { size?: 'large' | 'small' }) {
  return <span className="pro-label" data-size={size}>PRO</span>;
}

/** Only opted-in personal identities mount this component. The public RPC,
 * not local verification/Creator metadata, decides whether PRO is shown. */
export function ProMemberName({ userId, children }: { userId?: string | null; children: ReactNode }) {
  const { members } = useProMembers([userId]);
  return <span className="pro-member-name"><span className="pro-name-text">{children}</span>{userId && members.has(userId) ? <ProLabel /> : null}</span>;
}