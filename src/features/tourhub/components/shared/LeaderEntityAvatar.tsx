/**
 * LeaderEntityAvatar — Renders either a single player avatar OR a stacked
 * two-avatar treatment for team-format events (Zurich Classic, Grant
 * Thornton, Ryder Cup, etc.) inside the same outer bounding box.
 *
 * The outer wrapper is `size × size` so consumers don't need to change
 * their layout — drop-in replacement for the existing single-avatar slot.
 */

import { useState, useEffect } from 'react';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';

export interface TeamMemberAvatar {
  fullName: string;
  photoUrl?: string | null;
  tourCode?: string | null;
  headshotOverride?: string | null;
}

export interface LeaderEntityAvatarProps {
  /** Single-player avatar — pass when entity is a single player */
  player?: TeamMemberAvatar | null;
  /** Team members (ordered) — pass when entity is a team. 1+ members supported. */
  teamMembers?: TeamMemberAvatar[];
  size: number;
  /** Background colour of the surface behind the avatar — used for the
   *  separation ring between the two stacked team avatars. Match the surface. */
  ringColor?: string;
  /** Border styling for the outer slot — defaults to none */
  borderColor?: string;
  borderWidth?: number;
  /** Border-radius percentage (default 30% squircle) */
  radiusPct?: number;
  className?: string;
}

function resolvePhoto(m: TeamMemberAvatar): string | null {
  return getPlayerHeadshotUrl(m.fullName, m.tourCode ?? 'pga', m.headshotOverride ?? null)
    || m.photoUrl
    || null;
}

function SingleAvatar({
  src,
  alt,
  size,
  borderColor,
  borderWidth,
  radiusPct,
  silhouetteSize,
  ringColor,
  ringWidth,
}: {
  src: string | null;
  alt: string;
  size: number;
  borderColor?: string;
  borderWidth?: number;
  radiusPct: number;
  silhouetteSize: number;
  ringColor?: string;
  ringWidth?: number;
}) {
  const [err, setErr] = useState(false);
  useEffect(() => { setErr(false); }, [src]);

  const ringStyle = ringColor && ringWidth
    ? { boxShadow: `0 0 0 ${ringWidth}px ${ringColor}` }
    : {};

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: `${radiusPct}%`,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.10)',
        border: borderColor ? `${borderWidth ?? 1.5}px solid ${borderColor}` : undefined,
        ...ringStyle,
      }}
    >
      {src && !err ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      ) : (
        <PlayerSilhouette size={silhouetteSize} />
      )}
    </div>
  );
}

export function LeaderEntityAvatar({
  player,
  teamMembers,
  size,
  ringColor = '#FFFFFF',
  borderColor,
  borderWidth = 1.5,
  radiusPct = 30,
  className,
}: LeaderEntityAvatarProps) {
  // Normalise to either single or team
  const isTeam = Array.isArray(teamMembers) && teamMembers.length >= 2;

  if (!isTeam) {
    const p = player ?? teamMembers?.[0] ?? null;
    return (
      <div className={className} style={{ width: size, height: size, flexShrink: 0 }}>
        <SingleAvatar
          src={p ? resolvePhoto(p) : null}
          alt={p?.fullName ?? ''}
          size={size}
          borderColor={borderColor}
          borderWidth={borderWidth}
          radiusPct={radiusPct}
          silhouetteSize={Math.round(size * 0.6)}
        />
      </div>
    );
  }

  // Team — stacked two-avatar treatment in same bounding box
  const m1 = teamMembers![0];
  const m2 = teamMembers![1];

  // Inner avatars are ~70% of outer — they overlap by ~40% of inner width
  const inner = Math.round(size * 0.72);
  const offset = size - inner;
  const ringWidth = Math.max(1.5, Math.round(size * 0.04));

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {/* Back avatar — secondary, bottom-right */}
      <div style={{ position: 'absolute', right: 0, bottom: 0, width: inner, height: inner }}>
        <SingleAvatar
          src={resolvePhoto(m2)}
          alt={m2.fullName}
          size={inner}
          borderColor={borderColor}
          borderWidth={borderWidth}
          radiusPct={radiusPct}
          silhouetteSize={Math.round(inner * 0.6)}
        />
      </div>

      {/* Front avatar — primary, top-left, with ring for separation */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: inner, height: inner }}>
        <SingleAvatar
          src={resolvePhoto(m1)}
          alt={m1.fullName}
          size={inner}
          borderColor={borderColor}
          borderWidth={borderWidth}
          radiusPct={radiusPct}
          silhouetteSize={Math.round(inner * 0.6)}
          ringColor={ringColor}
          ringWidth={ringWidth}
        />
      </div>
    </div>
  );
}
