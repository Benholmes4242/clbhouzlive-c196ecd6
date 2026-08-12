import React from 'react';
import { MapPin } from 'lucide-react';
import { BG_2, T60, T100, GREEN, LINE_2, FONT } from './_shared/tokens';
import { formatFriendName } from './_shared/formatName';
import { TITLE } from '@/lib/tokens/type';

export interface SheetHeaderProps {
  avatarUrl: string | null;
  name: string;
  /** Only for clbhouz users */
  handle: string | null;
  /** Only for clbhouz users */
  bio: string | null;
  /** For WHS-only friends — replaces bio */
  whsContext?: {
    homeClub: string | null;
    lastSeenRelativeTime: string | null;
  } | null;
  pill: { label: string; tone: 'friends' | 'whs' } | null;
  /** Tap avatar/name to navigate (clbhouz users only) */
  onClick?: (() => void) | null;
}

export const SheetHeader: React.FC<SheetHeaderProps> = ({
  avatarUrl,
  name,
  handle,
  bio,
  whsContext,
  pill,
  onClick,
}) => {
  const isTappable = !!onClick;

  const headerContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          position: 'relative',
          width: 56,
          height: 56,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34%',
            overflow: 'hidden',
            background: BG_2,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={formatFriendName(name)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <PlaceholderSilhouette />
          )}
        </div>
        {/* Traced hairline overlay -- dark sheet canon */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34%',
            border: '1px solid rgba(255,255,255,0.22)',
            pointerEvents: 'none',
          }}
        />
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
              ...TITLE,
              color: T100,
              lineHeight: 1.05,
              fontFamily: FONT,
            }}
          >
            {formatFriendName(name)}
          </h2>
          {pill && <Pill label={pill.label} tone={pill.tone} />}
        </div>
        {handle && handle !== name && (
          <div style={{ fontSize: 14, color: T60, marginTop: 2 }}>
            @{handle}
          </div>
        )}
        {whsContext && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
              fontSize: 12,
              color: T60,
            }}
          >
            <MapPin size={12} strokeWidth={2} />
            <span>
              {whsContext.homeClub ?? 'No home club'}
              {whsContext.lastSeenRelativeTime &&
                ` · ${whsContext.lastSeenRelativeTime}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '10px 20px 12px', fontFamily: FONT }}>
      {isTappable ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={`View ${formatFriendName(name)}'s handicap`}
          style={{
            all: 'unset',
            display: 'block',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'opacity 120ms ease',
          }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '0.7';
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '1';
          }}
          onPointerLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '1';
          }}
        >
          {headerContent}
        </button>
      ) : (
        headerContent
      )}
      {bio && (
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 13,
            color: T100,
            lineHeight: 1.4,
          }}
        >
          {bio}
        </p>
      )}
    </div>
  );
};

const Pill: React.FC<{ label: string; tone: 'friends' | 'whs' }> = ({
  label,
  tone,
}) => {
  const palette =
    tone === 'friends'
      ? {
          bg: 'rgba(52,211,153,0.12)',
          color: GREEN,
        }
      : {
          bg: BG_2,
          color: T60,
        };
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        background: palette.bg,
        color: palette.color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
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
