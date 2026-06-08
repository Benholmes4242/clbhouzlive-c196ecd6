/**
 * WinnerPill — completed event row winner badge.
 *
 * Trophy icon + 20px squircle photo + name + score. Per brief — lifts
 * completed rows from text list to moment list. Width fits content.
 */
import { Trophy } from 'lucide-react';

import { AMBER_TINT_12 } from '../../_shared/tokens';

interface WinnerPillProps {
  name: string;
  photoUrl?: string | null;
  score?: string | null;
  onPlayerTap?: (e: React.MouseEvent) => void;
}

export function WinnerPill({ name, photoUrl, score, onPlayerTap }: WinnerPillProps) {
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
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          style={{
            width: 20,
            height: 20,
            borderRadius: '34%',
            objectFit: 'cover',
            background: '#F1F5F9',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '34%',
            background: '#F1F5F9',
            flexShrink: 0,
          }}
        />
      )}
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
