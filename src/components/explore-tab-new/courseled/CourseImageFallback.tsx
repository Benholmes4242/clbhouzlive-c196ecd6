import React, { useState } from 'react';

/**
 * CourseImageFallback — the ONE deterministic course image used by every
 * course-led Discover surface (BRIEF_DISCOVER_REBUILT_COURSE_LED, cross-cutting).
 *
 * Chain: (1) the course's hero image, (2) its most recent member media (passed
 * in by the caller when it holds one), (3) a deterministic gradient derived
 * from hashing the course id across six presets, with the course initials
 * centred. Never a grey box, never a broken image — an <img> that fails swaps
 * to the gradient in place.
 */

const GRADIENTS = [
  'linear-gradient(165deg,#7FA8C9 0%,#9DB88A 45%,#4C6640 100%)',
  'linear-gradient(180deg,#3D5A63 0%,#7E9C7A 55%,#2C4526 100%)',
  'linear-gradient(170deg,#95B7D4 0%,#C9D6C2 40%,#54703F 100%)',
  'linear-gradient(160deg,#2E4A3A 0%,#6E8F6A 60%,#1E3A2B 100%)',
  'linear-gradient(175deg,#E8C88A 0%,#A8B98E 50%,#4C6640 100%)',
  'linear-gradient(185deg,#6B8CA8 0%,#8FAE7E 52%,#41603A 100%)',
] as const;

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function gradientForCourse(courseId: string | null | undefined): string {
  return GRADIENTS[hash(String(courseId ?? 'course')) % GRADIENTS.length];
}

/** "Sundridge Park (East)" -> "SP". Bracketed variants never contribute. */
export function initialsForCourse(name: string | null | undefined): string {
  const clean = String(name ?? '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^A-Za-z\s]/g, ' ')
    .trim();
  if (!clean) return '';
  const words = clean.split(/\s+/).filter((w) => !/^(the|golf|club|course|and|of|at)$/i.test(w));
  const picked = (words.length > 0 ? words : clean.split(/\s+/)).slice(0, 2);
  return picked.map((w) => w[0]?.toUpperCase() ?? '').join('');
}

interface Props {
  courseId: string | null | undefined;
  courseName: string | null | undefined;
  /** Hero image, or the most recent member media when the caller holds one. */
  imageUrl?: string | null;
  /** Initials size — the mosaic tiles run larger than the rail cards. */
  initialsSize?: number;
  /**
   * TRUE while the enrichment query feeding `imageUrl` / `courseName` is still
   * in flight (BRIEF_DISCOVER_LOADING_STATES, layer 2c). A neutral shimmer at
   * the given dimensions — never the gradient, never the initials, never an
   * <img>. A fallback may only render once its source has settled.
   */
  pending?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function CourseImageFallback({
  courseId,
  courseName,
  imageUrl,
  initialsSize = 22,
  pending = false,
  style,
  children,
}: Props) {
  const [broken, setBroken] = useState(false);
  const showImage = !!imageUrl && !broken;
  const initials = initialsForCourse(courseName);

  if (pending) {
    return (
      <div
        className="clb-shimmer-light"
        aria-hidden="true"
        style={{ position: 'relative', backgroundColor: 'rgba(14,18,22,0.06)', overflow: 'hidden', ...style }}
      />
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        background: gradientForCourse(courseId),
        overflow: 'hidden',
        ...style,
      }}
    >

      {showImage ? (
        <img
          src={imageUrl as string}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      ) : (
        initials && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: initialsSize,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            {initials}
          </span>
        )
      )}
      {children}
    </div>
  );
}

export default CourseImageFallback;
