import { memo } from 'react';

const AMBER = '#F7931E';
const AMBER_DARK = '#E07E0C';
const INK = '#0F172A';

/** Quick clips — bespoke amber filled energy bolt (short-form identity). */
function ClipsMarkInner() {
  return (
    <svg width={34} height={34} viewBox="0 0 30 30" aria-hidden style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 5px rgba(247,147,30,0.35))' }}>
      <path
        d="M17.5 2 L8 17 L13.5 17 L11 28 L22 11 L16 11 Z"
        fill={AMBER}
        stroke={AMBER_DARK}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Latest videos — ink outline play ring (long-form/editorial). */
function VideosMarkInner() {
  return (
    <svg width={34} height={34} viewBox="0 0 30 30" aria-hidden style={{ flexShrink: 0 }}>
      <rect x="4" y="4" width="22" height="22" rx="8" fill="none" stroke={INK} strokeWidth={1.9} />
      <path d="M12.5 10.5 L19.5 15 L12.5 19.5 Z" fill="none" stroke={INK} strokeWidth={1.9} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Bucket list — bespoke amber filled golf pin flag (aspirational/destination identity). */
function BucketListMarkInner() {
  return (
    <svg width={34} height={34} viewBox="0 0 30 30" aria-hidden style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 5px rgba(247,147,30,0.35))' }}>
      <path d="M9 3 L9 27" fill="none" stroke={AMBER_DARK} strokeWidth={2} strokeLinecap="round" />
      <path d="M9 3.5 L22 8 L9 12.5 Z" fill={AMBER} stroke={AMBER_DARK} strokeWidth={0.5} strokeLinejoin="round" />
      <path d="M5.5 27 L12.5 27" fill="none" stroke={AMBER_DARK} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export const ClipsMark = memo(ClipsMarkInner);
export const VideosMark = memo(VideosMarkInner);
export const BucketListMark = memo(BucketListMarkInner);
