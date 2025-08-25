import React from 'react';

interface XPBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
}

const XPBadge: React.FC<XPBadgeProps> = ({ xp, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm', 
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={`relative flex items-center ${sizeClasses[size]} rounded-xl shadow-lg shadow-orange-500/20 overflow-hidden`} 
         style={{ borderRadius: '8px' }}>
      {/* Orange liquid glass background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/30 to-orange-600/30 border border-orange-400/40" 
           style={{ 
             backdropFilter: 'blur(40px) saturate(180%)', 
             borderRadius: '8px',
             background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.3) 0%, rgba(249, 115, 22, 0.3) 100%)'
           }} />
      
      {/* Additional orange glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-300/10 to-transparent" 
           style={{ borderRadius: '8px' }} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-1">
        <span className="text-white font-bold">{xp}</span>
        <span className="text-orange-100 font-medium">XP</span>
      </div>
    </div>
  );
};

export default XPBadge;