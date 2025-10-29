import React from 'react';
import { Flame, Sparkles } from 'lucide-react';

interface TrendingBadgeProps {
  className?: string;
  type?: 'trending' | 'suggested';
}

const TrendingBadge: React.FC<TrendingBadgeProps> = ({ className = '', type = 'trending' }) => {
  const isTrending = type === 'trending';
  
  return (
    <div 
      className={`flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm z-10 ${className}`}
      style={{
        background: 'rgba(0,0,0,.6)',
        border: '1px solid rgba(255,255,255,.12)'
      }}
    >
      {isTrending ? (
        <>
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-[12px] font-semibold text-white">Trending</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span className="text-[12px] font-semibold text-white">Suggested</span>
        </>
      )}
    </div>
  );
};

export default TrendingBadge;
