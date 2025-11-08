/**
 * Game Expanded Meta
 * Shows creation/expiration metadata
 */

import { fmtExpires } from './dateFormatters';

type GameExpandedMetaProps = {
  expiresAt?: string | null;
};

export function GameExpandedMeta({ expiresAt }: GameExpandedMetaProps) {
  if (!expiresAt) return null;

  return (
    <div 
      className="mt-2.5 flex items-center gap-3 text-[12px]"
      style={{ color: 'var(--hub-text-sub)', opacity: 0.6 }}
    >
      <span>{fmtExpires(expiresAt)}</span>
    </div>
  );
}
