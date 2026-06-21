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
  /** Course Rating (e.g. 69.4). Hidden when null. */
  cr?: number | null;
  /** Slope rating (e.g. 130). Hidden when null. */
  slope?: number | null;
}


export const DrilldownHeader: React.FC<Props> = ({
  state,
  youOwnedCount,
  totalCategories = 6,
  courseHeaderImage,
  cr = null,
  slope = null,
}) => (

  <div
    className="relative overflow-hidden"
    style={{
      height: '306px',
      fontFamily: GAM.FONT_GEIST,
    }}
  >
    {/* Gradient fallback behind image — matches GolfClubView */}
    <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-green-400 to-blue-500" />

    {courseHeaderImage && (
      <img
        src={courseHeaderImage}
        alt=""
        aria-hidden
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    )}

    {/* Dark gradient scrim — matches GolfClubView */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.05) 70%, transparent 100%)',
      }}
    />

    {/* Titles badge — drilldown-specific, top-right */}
    <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 11px',
          borderRadius: 999,
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          fontSize: 11,
          fontWeight: 800,
          color: '#FFFFFF',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        <Crown size={11} strokeWidth={2.4} />
        {youOwnedCount}/{totalCategories}
      </div>
    </div>

    {/* Bottom-left overlay — matches GolfClubView layout */}
    <div className="absolute inset-x-0 bottom-4 px-4">
      <CourseEyebrow
        type={state.courseType}
        region={state.courseRegion}
        country={state.courseCountry}
        onPhoto
      />
      <h1
        className="text-[22px] md:text-[28px] font-extrabold tracking-[-0.3px] text-white drop-shadow-2xl"
        style={{ lineHeight: 1.15, marginTop: 5, marginBottom: 4 }}
      >
        {state.courseName}
      </h1>
      {(cr != null || slope != null) && (
        <p
          className="drop-shadow-lg"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.65)',
            fontVariantNumeric: 'tabular-nums',
            margin: 0,
          }}
        >
          {[cr != null ? `CR ${cr}` : null, slope != null ? `SLOPE ${slope}` : null].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  </div>
);

