import React, { useState } from 'react';

import { getInitialsFromName } from '@/lib/avatarFallback';

/**
 * PersonAvatar — round member avatar with a person-flavoured deterministic
 * gradient fallback (never a grey circle). Same hash approach as
 * CourseImageFallback, seeded on the user id (or the name when no id exists),
 * so the same member gets the same gradient everywhere.
 */

const GRADIENTS = [
  'linear-gradient(160deg,#5B7CA8 0%,#31496B 100%)',
  'linear-gradient(160deg,#6E8F6A 0%,#2E4A3A 100%)',
  'linear-gradient(160deg,#A8825B 0%,#6B4A2C 100%)',
  'linear-gradient(160deg,#7B6EA8 0%,#43356B 100%)',
  'linear-gradient(160deg,#4E8B8B 0%,#224E51 100%)',
  'linear-gradient(160deg,#A85B6E 0%,#6B2C3E 100%)',
] as const;

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function gradientForPerson(seed: string | null | undefined): string {
  return GRADIENTS[hash(String(seed ?? 'member')) % GRADIENTS.length];
}

interface Props {
  size?: number;
  src?: string | null;
  name?: string | null;
  userId?: string | null;
  style?: React.CSSProperties;
}

export function PersonAvatar({ size = 30, src, name, userId, style }: Props) {
  const [broken, setBroken] = useState(false);
  const showImage = !!src && !broken;
  const initials = getInitialsFromName(name) || '?';

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 999,
        overflow: 'hidden',
        background: gradientForPerson(userId ?? name),
        boxShadow: 'inset 0 0 0 1px rgba(14,18,22,0.06)',
        ...style,
      }}
    >
      {showImage ? (
        <img
          src={src as string}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.round(size * 0.38),
            fontWeight: 800,
            letterSpacing: '0.01em',
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

export default PersonAvatar;
