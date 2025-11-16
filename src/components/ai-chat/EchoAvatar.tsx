import React from 'react';
import { PiWaveform } from 'react-icons/pi';
import { Squircle } from '@/components/ui/squircle';

interface EchoAvatarProps {
  state: 'idle' | 'listening' | 'processing';
  size?: number; // in pixels
}

const EchoAvatar: React.FC<EchoAvatarProps> = ({ state, size = 32 }) => {
  const getAnimationDuration = () => {
    switch (state) {
      case 'idle': return '3s';
      case 'listening': return '1.5s';
      case 'processing': return '1s';
      default: return '2s';
    }
  };

  const getIconSize = () => {
    return Math.max(24, size * 0.7);
  };

  return (
    <Squircle width={size} height={size}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.45)',
          border: '1px solid rgba(255,255,255,0.55)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Inner highlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            opacity: 0.8,
            pointerEvents: 'none'
          }}
        />
        
        {/* Icon */}
        <PiWaveform 
          size={getIconSize()} 
          className="text-black/80 transition-all duration-200 ease-in-out"
          style={{
            animation: `echoWave ${getAnimationDuration()} ease-in-out infinite`,
            position: 'relative',
            zIndex: 1
          }}
        />

        {/* Shimmer effect for processing state */}
        {state === 'processing' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              opacity: 0.3,
              animation: 'shimmer 2s ease-in-out infinite',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    </Squircle>
  );
};

export default EchoAvatar;