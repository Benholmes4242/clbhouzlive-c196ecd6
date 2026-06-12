import React from 'react';
import { getMobileCropPosition } from '@/utils/mobileCropUtils';

interface HeroPortraitProps {
  headerPhotoUrl: string | null;
  profilePhotoUrl: string | null;
  mobileCrop: {
    x: number | null;
    y: number | null;
    width: number | null;
    height: number | null;
  };
  height?: number;
  watermarkEmoji?: string;
}

export const HeroPortrait: React.FC<HeroPortraitProps> = ({
  headerPhotoUrl,
  profilePhotoUrl,
  mobileCrop,
  height = 240,
  watermarkEmoji = '🔥',
}) => {
  const hasHeader = !!headerPhotoUrl;
  const hasAvatar = !!profilePhotoUrl;

  // Tier 1: clbhouz header photo with user's saved mobile crop
  if (hasHeader) {
    const objectPosition = getMobileCropPosition({
      mobile_crop_x: mobileCrop.x ?? undefined,
      mobile_crop_y: mobileCrop.y ?? undefined,
      mobile_crop_width: mobileCrop.width ?? undefined,
      mobile_crop_height: mobileCrop.height ?? undefined,
    });
    return (
      <div
        aria-hidden
        style={{
          position: 'relative',
          height,
          overflow: 'hidden',
          background: '#0A0E14',
        }}
      >
        <img
          src={headerPhotoUrl ?? ''}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition,
          }}
        />
        {/* Bottom fade for name legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(10,14,20,0.92) 95%)',
            pointerEvents: 'none',
          }}
        />
        {/* Top-left amber radial accent */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(70% 50% at 30% 20%, rgba(247,147,30,0.20) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  // Tier 2: clbhouz avatar centred on a warm amber gradient
  if (hasAvatar) {
    return (
      <div
        aria-hidden
        style={{
          position: 'relative',
          height,
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, #1A1300 0%, #2A1F0A 35%, #1F2730 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(60% 60% at 50% 40%, rgba(247,147,30,0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <img
          src={profilePhotoUrl ?? ''}
          alt=""
          loading="lazy"
          style={{
            position: 'relative',
            width: 100,
            height: 100,
            borderRadius: 22,
            objectFit: 'cover',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            zIndex: 1,
          }}
        />
        {/* Bottom fade for name legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(10,14,20,0.92) 95%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  // Tier 3: gradient + watermark fallback (no photo)
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        height,
        overflow: 'hidden',
        background: '#2A1F0A',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, #1A1300 0%, #2A1F0A 35%, #1F2730 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(60% 60% at 50% 40%, rgba(247,147,30,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '60%',
            right: -20,
            fontSize: 180,
            opacity: 0.1,
            transform: 'rotate(-12deg)',
            color: '#F7931E',
            lineHeight: 0,
            pointerEvents: 'none',
          }}
        >
          {watermarkEmoji}
        </div>
      </div>
    </div>
  );
};

export default HeroPortrait;
