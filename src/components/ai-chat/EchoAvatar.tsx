import React from 'react';

interface EchoAvatarProps {
  state: 'idle' | 'listening' | 'processing';
  size?: number; // in pixels
}

const EchoAvatar: React.FC<EchoAvatarProps> = ({ state, size = 32 }) => {
  const getAnimationClass = () => {
    switch (state) {
      case 'idle': return 'animate-pulse-gentle';
      case 'listening': return 'animate-pulse-active';
      case 'processing': return 'animate-pulse-fast';
      default: return 'animate-pulse-gentle';
    }
  };

  const getWaveformSize = () => {
    // Scale the waveform to be about 60% of the container
    return size * 0.6;
  };

  return (
    <div 
      className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] border border-white/10 shadow-lg"
      style={{ width: size, height: size }}
    >
      {/* Waveform SVG */}
      <div
        className={`${getAnimationClass()} transition-all duration-200 ease-in-out`}
        style={{
          width: getWaveformSize(),
          height: getWaveformSize(),
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-white/90"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Recreating the waveform pattern from your image */}
          <circle cx="8" cy="85" r="3" />
          <rect x="15" y="70" width="3" height="20" rx="1.5" />
          <rect x="22" y="50" width="3" height="40" rx="1.5" />
          <rect x="29" y="35" width="3" height="55" rx="1.5" />
          <rect x="36" y="45" width="3" height="45" rx="1.5" />
          <rect x="43" y="30" width="3" height="60" rx="1.5" />
          <rect x="50" y="15" width="3" height="70" rx="1.5" />
          <rect x="57" y="25" width="3" height="60" rx="1.5" />
          <rect x="64" y="40" width="3" height="50" rx="1.5" />
          <rect x="71" y="55" width="3" height="35" rx="1.5" />
          <rect x="78" y="65" width="3" height="25" rx="1.5" />
          <rect x="85" y="75" width="3" height="15" rx="1.5" />
          <circle cx="92" cy="85" r="3" />
        </svg>
      </div>
      
      {/* Shimmer effect for processing state */}
      {state === 'processing' && (
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
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