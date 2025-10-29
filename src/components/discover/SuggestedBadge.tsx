import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestedBadgeProps {
  className?: string;
}

const SuggestedBadge: React.FC<SuggestedBadgeProps> = ({ className = '' }) => {
  return (
    <div 
      className={`flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm z-10 ${className}`}
      style={{
        background: 'rgba(0,0,0,.6)',
        border: '1px solid rgba(255,255,255,.12)'
      }}
    >
      <Sparkles className="w-3 h-3 text-blue-400" />
      <span className="text-[12px] font-semibold text-white">Suggested</span>
    </div>
  );
};

export default SuggestedBadge;
