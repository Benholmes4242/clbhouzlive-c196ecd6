import { GAM } from '../../../gam/tokens';
import React from 'react';
import { Crown } from 'lucide-react';
import { CourseEyebrow } from '../_shared/CourseEyebrow';
import type { CourseSelection } from '../types';

interface Props {
  state: CourseSelection;
  youOwnedCount: number;
  totalCategories?: number;
  /** Course header photo. Null/undefined → renders gradient fallback. */
  courseHeaderImage?: string | null;
}


export const DrilldownHeader: React.FC<Props> = ({
  state,
  youOwnedCount,
  totalCategories = 6,
  courseHeaderImage,
}) => (
  <div
    className="h-40 md:h-48 lg:h-56"
    style={{
      position: 'relative',
      background: courseHeaderImage
        ? 'transparent'
        : 'linear-gradient(180deg, rgba(247,147,30,0.18) 0%, var(--hcp-bg-2) 100%)',
      overflow: 'hidden',
      fontFamily: GAM.FONT_GEIST,
    }}
  >
    {courseHeaderImage && (
      <img
        src={courseHeaderImage}
        alt=""
        aria-hidden
        loading="eager"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    )}

    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background:
          'linear-gradient(180deg, rgba(5,8,16,0.55) 0%, rgba(5,8,16,0) 100%)',
      }}
    />

    <div
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        background:
          'linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.92) 90%)',
      }}
    />

    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 11px',
          borderRadius: 999,
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(251,188,46,0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          fontSize: 11,
          fontWeight: 800,
          color: '#FBBC2E',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        <Crown size={11} strokeWidth={2.4} />
        {youOwnedCount}/{totalCategories}
      </div>
    </div>

    <div
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 14,
      }}
    >
      <CourseEyebrow
        type={state.courseType}
        region={state.courseRegion}
        country={state.courseCountry}
      />
      <div
        style={{
          marginTop: 5,
          fontSize: 22,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.022em',
          lineHeight: 1.15,
          textShadow: '0 1px 3px rgba(0,0,0,0.55)',
        }}
      >
        {state.courseName}
      </div>
    </div>
  </div>
);
