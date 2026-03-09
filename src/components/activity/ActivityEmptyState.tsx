import React from 'react';
import { BellOff, Users } from 'lucide-react';
import { ActivityTabId } from '@/hooks/useActivityFeed';

interface ActivityEmptyStateProps {
  tab: ActivityTabId;
}

const TAB_EMPTY_STATES: Record<ActivityTabId, { icon: typeof BellOff; title: string; description: string }> = {
  all: {
    icon: BellOff,
    title: 'No notifications yet',
    description: 'When friends interact with your content, you\'ll see it here.',
  },
  friends: {
    icon: Users,
    title: 'No activity from friends',
    description: 'When your friends interact with you, their activity will appear here.',
  },
};

export const ActivityEmptyState: React.FC<ActivityEmptyStateProps> = ({ tab }) => {
  const state = TAB_EMPTY_STATES[tab];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/80 border border-border/60 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-[1rem] font-semibold text-foreground mb-1 text-center">
        {state.title}
      </h3>
      <p className="text-[0.875rem] text-muted-foreground text-center max-w-[280px]">
        {state.description}
      </p>
    </div>
  );
};
