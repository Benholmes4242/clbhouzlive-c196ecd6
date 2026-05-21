import React from 'react';
import { initials } from '@/lib/whs/utils/initials';

interface HeroPortraitProps {
  name: string | null;
  thumbnailUrl: string | null;
  height?: number;
  watermarkEmoji?: string;
}

export const HeroPortrait: React.FC<HeroPortraitProps> = ({
  name,
  thumbnailUrl,
  height = 240,
  watermarkEmoji = '🔥',
}) => {
  const hasPhoto = !!thumbnailUrl;

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
      {hasPhoto ? (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(10,14,20,0.92) 95%), url(${thumbnailUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 18%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(70% 50% at 30% 20%, rgba(247,147,30,0.20) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
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
              opacity: 0.10,
              transform: 'rotate(-12deg)',
              color: '#F7931E',
              lineHeight: 0,
              pointerEvents: 'none',
            }}
          >
            {watermarkEmoji}
          </div>
          <div
            style={{
              fontSize: 110,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.30)',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              zIndex: 1,
            }}
          >
            {initials(name ?? '?')}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroPortrait;
