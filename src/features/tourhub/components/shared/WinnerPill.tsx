/**
 * WinnerPill — completed event row winner badge.
 *
 * Trophy icon + 20px squircle photo + name + score. Per brief — lifts
 * completed rows from text list to moment list. Width fits content.
 */
import { Trophy } from 'lucide-react';

import { AMBER_TINT_12 } from '../../_shared/tokens';
import { PlayerInitialAvatar } from './PlayerInitialAvatar';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';

interface WinnerPillProps {
  name: string;
  fullName?: string | null;
  photoUrl?: string | null;
  score?: string | null;
  tourSlug?: string | null;
  onPlayerTap?: (e: React.MouseEvent) => void;
}

export function WinnerPill({ name, fullName, photoUrl, score, tourSlug, onPlayerTap }: WinnerPillProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        width: 'fit-content',
        marginBottom: 4,
      }}
    >
      <Trophy
        size={12}
        strokeWidth={2.5}
        style={{
          color: '#F7931E',
          fill: AMBER_TINT_12,
          flexShrink: 0,
        }}
      />
      <PlayerInitialAvatar
        name={name}
        src={photoUrl ?? undefined}
        srcCandidates={resolvePlayerAvatarCandidates({ name, photoUrl, tourSlug: tourSlug ?? 'pga' })}
        size={20}
        radius="34%"
      />
      <button
        type="button"
        onClick={onPlayerTap}
        className="active:opacity-70 transition-opacity"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: onPlayerTap ? 'pointer' : 'default',
          fontSize: 12,
          fontWeight: 900,
          color: '#0F172A',
          letterSpacing: -0.2,
        }}
      >
        {name}
      </button>
      {score && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 900,
            color: '#9F1D1D',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: -0.2,
          }}
        >
          {score}
        </span>
      )}
    </div>
  );
}
