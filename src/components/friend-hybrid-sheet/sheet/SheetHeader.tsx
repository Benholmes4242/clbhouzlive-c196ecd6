import React from 'react';
import { BG_2, T100, T60, GREEN, LINE_2, FONT } from './_shared/tokens';

interface Props {
  avatarUrl: string | null;
  name: string;
  handle: string | null;
  bio: string | null;
  friendshipPill: string | null;
}

export const SheetHeader: React.FC<Props> = ({
  avatarUrl,
  name,
  handle,
  bio,
  friendshipPill,
}) => {
  const isFriend = friendshipPill === 'Friends';
  return (
    <div style={{ padding: '12px 20px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '34%',
            overflow: 'hidden',
            background: BG_2,
            border: `2px solid ${LINE_2}`,
            flexShrink: 0,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <PlaceholderSilhouette />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 900,
                color: T100,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                fontFamily: FONT,
              }}
            >
              {name}
            </h2>
            {friendshipPill && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: isFriend
                    ? 'rgba(34,197,94,0.15)'
                    : BG_2,
                  color: isFriend ? GREEN : T60,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  lineHeight: 1.4,
                }}
              >
                {friendshipPill}
              </span>
            )}
          </div>
          {handle && handle !== name && (
            <div style={{ fontSize: 14, color: T60, marginTop: 2 }}>
              @{handle}
            </div>
          )}
        </div>
      </div>
      {bio && (
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 14,
            color: T100,
            lineHeight: 1.45,
          }}
        >
          {bio}
        </p>
      )}
    </div>
  );
};

const PlaceholderSilhouette: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMax meet"
    aria-hidden="true"
    style={{ display: 'block', opacity: 0.45 }}
  >
    <circle cx="32" cy="25" r="11" fill="rgba(255,255,255,0.35)" />
    <path
      d="M11 64 C 11 48, 21 40, 32 40 C 43 40, 53 48, 53 64 Z"
      fill="rgba(255,255,255,0.35)"
    />
  </svg>
);
