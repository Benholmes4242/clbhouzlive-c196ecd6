import React from 'react';
import { Bell, Users, Star, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { ActivityTabId } from '@/hooks/useActivityFeed';

interface ActivityEmptyStateProps {
  tab: ActivityTabId;
  isAllCaughtUp?: boolean;
}

const TAB_EMPTY_STATES: Record<ActivityTabId, { icon: typeof Bell; title: string; description: string }> = {
  all: {
    icon: Bell,
    title: 'No activity yet',
    description: 'When golfers like, comment, follow or message you, updates will show here.',
  },
  friends: {
    icon: Users,
    title: 'No activity from friends',
    description: 'When your friends interact with you, their activity will appear here.',
  },
  reviews: {
    icon: Star,
    title: 'No friend reviews yet',
    description: "When your friends review golf courses, you'll see them here.",
  },
  messages: {
    icon: Mail,
    title: 'No messages yet',
    description: 'Direct messages and conversation updates will show here.',
  },
  system: {
    icon: Sparkles,
    title: 'No system updates',
    description: 'App updates, tips and important notices will appear here.',
  },
};

export const ActivityEmptyState: React.FC<ActivityEmptyStateProps> = ({ tab, isAllCaughtUp }) => {
  // Special "all caught up" state
  if (isAllCaughtUp) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        {/* Icon in gradient circle - Hub standard */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-[#64748b]" />
        </div>
        
        {/* Title */}
        <h3 className="text-base font-semibold text-[#1e293b] mb-1 text-center">
          You're all caught up
        </h3>
        
        {/* Description */}
        <p className="text-sm text-[#64748b] text-center max-w-[280px]">
          We'll let you know when there's something new.
        </p>
      </div>
    );
  }

  const state = TAB_EMPTY_STATES[tab];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Icon in gradient circle - Hub standard */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[#64748b]" />
      </div>
      
      {/* Title */}
      <h3 className="text-base font-semibold text-[#1e293b] mb-1 text-center">
        {state.title}
      </h3>
      
      {/* Description */}
      <p className="text-sm text-[#64748b] text-center max-w-[280px]">
        {state.description}
      </p>
    </div>
  );
};
