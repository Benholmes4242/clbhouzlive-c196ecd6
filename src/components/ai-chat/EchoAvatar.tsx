import React from 'react';
import { PiWaveform } from 'react-icons/pi';

interface EchoAvatarProps {
  state: 'idle' | 'listening' | 'processing';
  size?: number; // in pixels
}

function superellipsePath(w: number, h: number, n = 5, steps = 200) {
  const a = w / 2, b = h / 2, m = 2 / n;
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    const x = Math.sign(ct) * a * Math.pow(Math.abs(ct), m) + a;
    const y = Math.sign(st) * b * Math.pow(Math.abs(st), m) + b;
    pts.push(`${x},${y}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

const EchoAvatar: React.FC<EchoAvatarProps> = ({ state, size = 32 }) => {
  const id = React.useId();
  const d = superellipsePath(size, size, 5, 220);

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
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
      aria-label="Echo AI Assistant"
      role="img"
    >
      <defs>
        <clipPath id={id} clipPathUnits="userSpaceOnUse">
          <path d={d} />
        </clipPath>
        <linearGradient id={`${id}-highlight`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Frosted white background */}
      <path d={d} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      
      {/* Inner highlight */}
      <path d={d} fill={`url(#${id}-highlight)`} opacity="0.8" />
      
      {/* Icon */}
      <foreignObject width={size} height={size} clipPath={`url(#${id})`}>
        <div
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PiWaveform 
            size={getIconSize()} 
            className="text-black/80 transition-all duration-200 ease-in-out"
            style={{
              animation: `echoWave ${getAnimationDuration()} ease-in-out infinite`
            }}
          />
        </div>
      </foreignObject>

      {/* Shimmer effect for processing state */}
      {state === 'processing' && (
        <path 
          d={d} 
          fill="url(#shimmer-grad)"
          opacity="0.3"
          style={{
            animation: 'shimmer 2s ease-in-out infinite'
          }}
        />
      )}
    </svg>
  );
};

export default EchoAvatar;