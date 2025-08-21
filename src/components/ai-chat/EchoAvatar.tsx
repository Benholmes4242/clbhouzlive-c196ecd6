import React from 'react';
import { PiWaveform } from 'react-icons/pi';

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
    <div 
      className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] border border-white/10 shadow-lg overflow-hidden"
      style={{ width: size, height: size }}
    >
      <PiWaveform 
        size={getIconSize()} 
        className="text-white/90 transition-all duration-200 ease-in-out"
        style={{
          animation: `echoWave ${getAnimationDuration()} ease-in-out infinite`
        }}
      />
      
      {/* Shimmer effect for processing state */}
      {state === 'processing' && (
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
          style={{
            animation: 'shimmer 2s ease-in-out infinite',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)'
          }}
        />
      )}
      
      {/* Inner highlight */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-60" />
    </div>
  );
};

export default EchoAvatar;