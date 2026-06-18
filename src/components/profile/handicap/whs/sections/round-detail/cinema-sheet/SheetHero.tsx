import React from 'react';
import FlagSilhouetteOverlay from '@/components/whs/FlagSilhouetteOverlay';

interface Props {
  imageUrl: string | null;
  onClose: () => void;
  topEyebrow: React.ReactNode;
  topRightPill?: React.ReactNode;
  glass: React.ReactNode;
}

const FALLBACK = 'linear-gradient(140deg,#2d3a2d 0%,#4a5d4a 25%,#6b7a5a 50%,#8a9670 72%,#c4a574 88%,#d4956b 100%)';

/** 340px Cinema hero — gradient/photo, atmospheric scrims, drag handle, close X, eyebrow, optional pill, glass tile. */
export const SheetHero: React.FC<Props> = ({ imageUrl, onClose, topEyebrow, topRightPill, glass }) => (
  <div
    style={{
      position: 'relative',
      width: '100%',
      minHeight: 280,
      flex: '1 0 280px',
      background: FALLBACK,
      overflow: 'hidden',
    }}
  >

    {imageUrl ? (
      <img
        src={imageUrl}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    ) : (
      <FlagSilhouetteOverlay opacity={0.12} />
    )}
    {/* atmospheric */}
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse 80% 60% at 50% 90%, rgba(0,0,0,0.55) 0%, transparent 70%),' +
          'radial-gradient(ellipse 60% 40% at 70% 25%, rgba(255,200,140,0.18) 0%, transparent 60%)',
      }}
    />
    {/* legibility */}
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 22%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.50) 100%)',
      }}
    />
    {/* drag handle */}
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 36,
        height: 4,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.55)',
        zIndex: 4,
      }}
    />
    {/* eyebrow */}
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 18,
        right: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        zIndex: 3,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>{topEyebrow}</div>
    </div>
    {topRightPill}
    {glass}
  </div>
);

export default SheetHero;
