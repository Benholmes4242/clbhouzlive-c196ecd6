import React from 'react';
import { Bell, Heart, Users, Building2, Mail, Sparkles } from 'lucide-react';
import { ActivityTabId } from '@/hooks/useActivityFeed';

interface ActivityEmptyStateProps {
  tab: ActivityTabId;
}

const TAB_EMPTY_STATES: Record<ActivityTabId, { icon: React.ReactNode; title: string; description: string }> = {
  all: {
    icon: <Bell className="h-10 w-10 text-muted-foreground/50" />,
    title: 'No activity yet',
    description: 'When golfers like, comment, follow or message you, updates will show here.',
  },
  you: {
    icon: <Heart className="h-10 w-10 text-muted-foreground/50" />,
    title: 'No interactions yet',
    description: 'Likes, comments and mentions on your moments will appear here.',
  },
  following: {
    icon: <Users className="h-10 w-10 text-muted-foreground/50" />,
    title: 'No updates from friends',
    description: 'Activity from people you follow will show here.',
  },
  clubs: {
    icon: <Building2 className="h-10 w-10 text-muted-foreground/50" />,
    title: 'No club updates',
    description: 'Updates from clubs and courses you follow will appear here.',
  },
  messages: {
    icon: <Mail className="h-10 w-10 text-muted-foreground/50" />,
    title: 'No messages yet',
    description: 'Direct messages and conversation updates will show here.',
  },
  system: {
    icon: <Sparkles className="h-10 w-10 text-muted-foreground/50" />,
    title: 'No system updates',
    description: 'App updates, tips and important notices will appear here.',
  },
};

export const ActivityEmptyState: React.FC<ActivityEmptyStateProps> = ({ tab }) => {
  const state = TAB_EMPTY_STATES[tab];

  return (
    <div className="mt-12 flex flex-col items-center text-center gap-3 px-6">
      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
        {state.icon}
      </div>
      <p className="text-sm font-medium text-foreground">{state.title}</p>
      <p className="text-xs text-muted-foreground max-w-[280px]">
        {state.description}
      </p>
    </div>
  );
};
