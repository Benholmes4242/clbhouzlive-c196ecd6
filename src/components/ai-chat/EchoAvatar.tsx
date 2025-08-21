import React from 'react';

interface EchoAvatarProps {
  state: 'idle' | 'listening' | 'processing';
  size?: number; // in pixels
}

const EchoAvatar: React.FC<EchoAvatarProps> = ({ state, size = 32 }) => {
  const barCount = 11; // Based on the waveform image
  const centerIndex = 5; // Middle bar index
  
  // Create animation delays and heights for each bar
  const getBarHeight = (index: number) => {
    const distanceFromCenter = Math.abs(index - centerIndex);
    
    switch (state) {
      case 'idle':
        // Gentle looping wave with varying heights
        return 20 + (5 - distanceFromCenter) * 4;
      case 'listening':
        // More active waveform
        return 15 + (5 - distanceFromCenter) * 6;
      case 'processing':
        // Lower amplitude, faster wave
        return 18 + (5 - distanceFromCenter) * 3;
      default:
        return 20;
    }
  };

  const getAnimationDelay = (index: number) => {
    return index * 0.1; // Stagger the animations
  };

  const getAnimationDuration = () => {
    switch (state) {
      case 'idle': return '3s';
      case 'listening': return '1.5s';
      case 'processing': return '1s';
      default: return '2s';
    }
  };

  return (
    <div 
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] border border-white/10 shadow-lg"
      style={{ width: size, height: size }}
    >
      <div className="flex items-end justify-center gap-0.5" style={{ height: size * 0.6 }}>
        {Array.from({ length: barCount }, (_, index) => (
          <div
            key={index}
            className="bg-white/90 rounded-full transition-all duration-200 ease-in-out"
            style={{
              width: Math.max(1.5, size * 0.05),
              height: `${Math.max(20, (getBarHeight(index) / 100) * (size * 0.6))}%`,
              animation: `echoWave ${getAnimationDuration()} ease-in-out infinite`,
              animationDelay: `${getAnimationDelay(index)}s`
            }}
          />
        ))}
      </div>
      
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