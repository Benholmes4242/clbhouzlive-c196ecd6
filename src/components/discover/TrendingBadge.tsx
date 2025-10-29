import React from 'react';
import { Flame } from 'lucide-react';

interface TrendingBadgeProps {
  className?: string;
}

const TrendingBadge: React.FC<TrendingBadgeProps> = ({ className = '' }) => {
  return (
    <div 
      className={`flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm z-10 ${className}`}
      style={{
        background: 'rgba(0,0,0,.6)',
        border: '1px solid rgba(255,255,255,.12)'
      }}
    >
      <Flame className="w-3 h-3 text-orange-400" />
      <span className="text-[12px] font-semibold text-white">Trending</span>
    </div>
  );
};

export default TrendingBadge;
