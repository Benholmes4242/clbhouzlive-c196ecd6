import React from 'react';
import { prefersReduced } from '@/lib/ui/motion';
import './nearby.css';

interface GolferAvatarProps {
  avatarUrl?: string;
  displayName: string;
  isOpenToPlay?: boolean;
  size?: number;
}

function PresenceRing({ status }: { status: 'openToPlay' | 'online' | 'offline' }) {
  const colors = {
    openToPlay: '#4ADE80',
    online: '#3B82F6',
    offline: 'rgba(255,255,255,0.25)'
  };
  
  const shouldPulse = status === 'openToPlay';
  
  return (
    <svg 
      className="absolute inset-0 w-full h-full" 
      style={{ overflow: 'visible' }}
    >
      <circle
        cx="50%"
        cy="50%"
        r="48%"
        fill="none"
        stroke={colors[status]}
        strokeWidth="2.5"
        style={{
          filter: shouldPulse ? 'drop-shadow(0 0 3px rgba(74,222,128,0.4))' : 'none'
        }}
        className={shouldPulse ? 'animate-[presencePulse_900ms_ease-in-out_infinite]' : ''}
      />
      {/* Mini dot indicator */}
      <circle
        cx="85%"
        cy="85%"
        r="4"
        fill={colors[status]}
        className={shouldPulse ? 'animate-[presencePulse_900ms_ease-in-out_infinite]' : ''}
      />
    </svg>
  );
}

export function GolferAvatar({ 
  avatarUrl, 
  displayName, 
  isOpenToPlay = false,
  size = 52 
}: GolferAvatarProps) {
  const presenceStatus = isOpenToPlay ? 'openToPlay' : 'offline';
  
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <PresenceRing status={presenceStatus} />
      <div
        className="avatar-wrap absolute inset-[3px] rounded-full overflow-hidden"
        data-open={isOpenToPlay ? "1" : "0"}
        onPointerMove={(e) => {
          if (prefersReduced()) return;
          const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width/2)) / r.width;
          const dy = (e.clientY - (r.top + r.height/2)) / r.height;
          e.currentTarget.style.setProperty('--rx', `${(-dy*4).toFixed(2)}deg`);
          e.currentTarget.style.setProperty('--ry', `${(dx*6).toFixed(2)}deg`);
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.setProperty('--rx', '0deg');
          e.currentTarget.style.setProperty('--ry', '0deg');
        }}
      >
        <img
          src={avatarUrl || '/placeholder.svg'}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}
