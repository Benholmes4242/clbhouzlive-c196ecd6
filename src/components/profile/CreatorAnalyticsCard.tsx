import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Users, Bookmark, TrendingUp, ChevronRight } from 'lucide-react';

interface CreatorAnalyticsCardProps {
  userId: string;
  className?: string;
}

/**
 * Phase 3.4: Creator Analytics (v1)
 * 
 * Read-only analytics card for creators showing:
 * - Views
 * - Reach
 * - Saves
 * 
 * Simple card visible only on creator profiles.
 * Links to full /insights page.
 */
export function CreatorAnalyticsCard({ userId, className }: CreatorAnalyticsCardProps) {
  const navigate = useNavigate();
  
  // TODO: Fetch real analytics from backend
  // For now, show placeholder data structure
  const analytics = {
    views: 1247,
    reach: 892,
    saves: 56,
    trend: '+12%',
  };

  const stats = [
    { icon: Eye, label: 'Views', value: analytics.views },
    { icon: Users, label: 'Reach', value: analytics.reach },
    { icon: Bookmark, label: 'Saves', value: analytics.saves },
  ];

  return (
    <div 
      className={className}
      style={{ 
        background: 'white',
        border: '1px solid rgba(31,36,40,0.08)',
        borderRadius: '18px',
        boxShadow: '0 2px 8px rgba(31,36,40,0.04)'
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(31,36,40,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#F7931E]" />
          <span className="text-sm font-semibold text-[#1F2428]">Creator Stats</span>
        </div>
        <span 
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ 
            background: 'rgba(52, 199, 89, 0.1)',
            color: '#34C759'
          }}
        >
          {analytics.trend} this week
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(31,36,40,0.06)' }}>
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="py-4 text-center">
            <div className="flex justify-center mb-1.5">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#EDEFF2' }}
              >
                <Icon className="h-4 w-4 text-[#5E666D]" />
              </div>
            </div>
            <p className="text-lg font-semibold text-[#1F2428] tabular-nums">
              {value.toLocaleString()}
            </p>
            <p className="text-[11px] text-[#97A1AA]">{label}</p>
          </div>
        ))}
      </div>

      {/* Footer with link to full insights */}
      <button
        onClick={() => navigate('/insights')}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAFBFC] transition-colors"
        style={{ 
          borderTop: '1px solid rgba(31,36,40,0.06)',
          background: '#FAFBFC',
          borderRadius: '0 0 18px 18px'
        }}
      >
        <span className="text-sm font-medium text-[#F7931E]">
          View Full Insights
        </span>
        <ChevronRight className="h-4 w-4 text-[#F7931E]" />
      </button>
    </div>
  );
}

export default CreatorAnalyticsCard;
