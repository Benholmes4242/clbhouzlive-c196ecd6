import React from 'react';
import { initials, firstName } from '@/lib/whs/utils/initials';

interface Props {
  name: string;
  thumbnailUrl: string | null;
  /** Optional: stop-propagated tap target around the avatar disc. Used to open
   *  the hybrid friend sheet without firing the parent card's onClick. */
  onAvatarTap?: () => void;
}

/**
 * 124x124 ink/green-tinted panel — identity-leading column for the
 * Clbhouz-not-synced small friend card. Centers a 64px squircle avatar
 * with a verified badge in the bottom-right corner.
 */
export const IdentityPanel: React.FC<Props> = ({ name, thumbnailUrl, onAvatarTap }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: 124,
        height: 124,
        flexShrink: 0,
        background:
          'linear-gradient(140deg, #1a2a3a 0%, #2d3a4a 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Subtle green wash to suggest "Clbhouz" */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 100% 80% at 50% 50%, rgba(0,103,71,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Avatar squircle */}
      <div
        role={onAvatarTap ? 'button' : undefined}
        tabIndex={onAvatarTap ? 0 : undefined}
        aria-label={onAvatarTap ? `Open ${firstName(name)}'s snapshot` : undefined}
        onClick={onAvatarTap ? (e) => { e.stopPropagation(); onAvatarTap(); } : undefined}
        onKeyDown={onAvatarTap ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onAvatarTap();
          }
        } : undefined}
        style={{
          position: 'relative',
          width: 64,
          height: 64,
          borderRadius: '34%',
          overflow: 'hidden',
          border: '1px solid var(--hcp-line-2)',
          background:
            'linear-gradient(135deg, #4a5d8a 0%, #6b7aaa 50%, #a4b4c4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onAvatarTap ? 'pointer' : 'default',
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <span
            style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            {initials(name)}
          </span>
        )}
      </div>

      {/* Verified badge — bottom-right of avatar with white outer ring */}
      <div
        style={{
          position: 'absolute',
          // Center of avatar is at 50%/50%; place badge at avatar bottom-right corner.
          left: 'calc(50% + 22px)',
          top: 'calc(50% + 22px)',
          width: 20,
          height: 20,
          borderRadius: '50%',
          boxShadow: '0 0 0 1.5px #fff',
          background: '#16A34A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Verified Clbhouz user"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path
            d="M4 7 L6.2 9.2 L10 5"
            stroke="white"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default IdentityPanel;
