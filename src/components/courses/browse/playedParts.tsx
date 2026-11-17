/**
 * Shared atoms for What's been played (BRIEF_WHATS_BEEN_PLAYED): the signed-off
 * head (kicker 10/800 .18em amber, title 21/800 -.01em — the mock's own head,
 * not SectionHead's 11/19), the glass count, faces and the photo scrim.
 */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { A } from '@/features/courses/components/holes/analytical/tokens';

export const PLAYED_SCRIM = 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,.82) 100%)';
export const GOLD = '#E2B04A';
export const UNDER_RED = '#F0544A';
export const GLASS: React.CSSProperties = {
  background: 'rgba(10,10,12,.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
  boxShadow: 'inset 0 0 0 .5px rgba(255,255,255,.22)',
};
export const PLAYED_KICKER = { size: 10, lineHeight: 12 } as const;
export const PLAYED_TITLE = { size: 21, lineHeight: 25, gap: 3 } as const;

export function PlayedHead({ kicker, title, right }: { kicker: string; title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 16px', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: PLAYED_KICKER.size, lineHeight: `${PLAYED_KICKER.lineHeight}px`, fontWeight: 800, letterSpacing: '.18em', color: A.AMBER }}>{kicker}</div>
        <h2 style={{ margin: `${PLAYED_TITLE.gap}px 0 0`, fontSize: PLAYED_TITLE.size, lineHeight: `${PLAYED_TITLE.lineHeight}px`, fontWeight: 800, letterSpacing: '-.01em', color: A.INK }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

export interface Face { userId: string; photo: string | null; name: string | null }
const initials = (name: string | null) => (name ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
export function MemberFace({ face, size }: { face: Face; size: number }) {
  return <SquircleAvatar src={face.photo} userId={face.userId} size={size} alt={face.name ?? ''} fallback={initials(face.name)} surface="canvas" hairlineRing />;
}
/** Overlapping faces: `overlap` px each, `ring` px canvas ring. */
export function FaceStack({ faces, size, overlap, ring }: { faces: Face[]; size: number; overlap: number; ring?: string }) {
  return (
    <span aria-hidden="true" style={{ display: 'flex', flex: 'none' }}>
      {faces.map((f, i) => (
        <span key={f.userId} style={{ display: 'block', marginLeft: i ? -overlap : 0, borderRadius: '34%', boxShadow: ring ? `0 0 0 1.5px ${ring}` : undefined, position: 'relative', zIndex: faces.length - i }}>
          <MemberFace face={f} size={size} />
        </span>
      ))}
    </span>
  );
}
