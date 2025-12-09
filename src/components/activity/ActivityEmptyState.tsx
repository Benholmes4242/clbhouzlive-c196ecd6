import React from 'react';
import { Bell, Heart, Users, Building2, Mail, Sparkles, CheckCircle2, Flag } from 'lucide-react';
import { ActivityTabId } from '@/hooks/useActivityFeed';

interface ActivityEmptyStateProps {
  tab: ActivityTabId;
  isAllCaughtUp?: boolean;
}

const TAB_EMPTY_STATES: Record<ActivityTabId, { icon: React.ReactNode; title: string; description: string }> = {
  all: {
    icon: <Bell className="h-6 w-6 text-slate-400" />,
    title: 'No activity yet',
    description: 'When golfers like, comment, follow or message you, updates will show here.',
  },
  following: {
    icon: <Users className="h-6 w-6 text-slate-400" />,
    title: 'No updates from friends',
    description: 'Activity from people you follow will show here.',
  },
  clubs: {
    icon: <Building2 className="h-6 w-6 text-slate-400" />,
    title: 'No club updates',
    description: 'Updates from golf clubs you follow will appear here.',
  },
  messages: {
    icon: <Mail className="h-6 w-6 text-slate-400" />,
    title: 'No messages yet',
    description: 'Direct messages and conversation updates will show here.',
  },
  system: {
    icon: <Sparkles className="h-6 w-6 text-slate-400" />,
    title: 'No system updates',
    description: 'App updates, tips and important notices will appear here.',
  },
};

export const ActivityEmptyState: React.FC<ActivityEmptyStateProps> = ({ tab, isAllCaughtUp }) => {
  // Special "all caught up" state - keep centered
  if (isAllCaughtUp) {
    return (
      <div className="mt-12 flex flex-col items-center text-center gap-4 px-6">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">You're all caught up</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            We'll let you know when there's something new.
          </p>
        </div>
      </div>
    );
  }

  const state = TAB_EMPTY_STATES[tab];

  // Left-aligned empty states for all tabs
  return (
    <div className="flex flex-col items-start text-left gap-2 py-10 px-4">
      {state.icon}
      <p className="text-sm font-medium text-slate-700 mt-2">{state.title}</p>
      <p className="text-xs text-slate-500 max-w-[280px]">
        {state.description}
      </p>
    </div>
  );
};
