import React from 'react';
import { Eye, Users, BarChart2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface InsightsMiniStripProps {
  businessId: string;
  visits7d?: number;
  followersGained?: number;
  postImpressions?: number;
  className?: string;
}

export function InsightsMiniStrip({
  businessId,
  visits7d = 0,
  followersGained = 0,
  postImpressions = 0,
  className
}: InsightsMiniStripProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/business/${businessId}/insights`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full bg-gradient-to-r from-slate-900 to-slate-800 rounded-sq-md p-4 text-white",
        "hover:from-slate-800 hover:to-slate-700 transition-all active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
          Last 7 days
        </span>
        <ChevronRight className="h-4 w-4 text-white/50" />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Eye className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <p className="text-lg font-semibold">{visits7d.toLocaleString()}</p>
          <p className="text-[10px] text-white/60 uppercase tracking-wide">Visits</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="text-lg font-semibold">
            {followersGained >= 0 ? '+' : ''}{followersGained.toLocaleString()}
          </p>
          <p className="text-[10px] text-white/60 uppercase tracking-wide">Followers</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BarChart2 className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <p className="text-lg font-semibold">{postImpressions.toLocaleString()}</p>
          <p className="text-[10px] text-white/60 uppercase tracking-wide">Impressions</p>
        </div>
      </div>
    </button>
  );
}
