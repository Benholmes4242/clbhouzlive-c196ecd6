import React from 'react';
import { cn } from '@/lib/utils';
import { ActivityType } from '@/hooks/useActivityFeed';

interface ActivityTypePillProps {
  type: ActivityType | string;
}

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  follow: { label: 'Follow', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  friend_request: { label: 'Friend', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  friend_accept: { label: 'Friend', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  friend_accepted: { label: 'Friend', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },  // Legacy
  mention: { label: 'Mention', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  tag: { label: 'Tag', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  like: { label: 'Like', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  comment: { label: 'Comment', className: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  club_update: { label: 'Club', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  course_update: { label: 'Course', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  achievement: { label: 'Achievement', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  message: { label: 'Message', className: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  dm: { label: 'Message', className: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  new_post: { label: 'Post', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  system: { label: 'System', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  event: { label: 'Event', className: 'bg-primary/10 text-primary border-primary/20' },
};

export const ActivityTypePill: React.FC<ActivityTypePillProps> = ({ type }) => {
  const config = TYPE_CONFIG[type] || { label: 'Update', className: 'bg-muted text-muted-foreground border-border' };

  return (
    <span className={cn(
      "px-2 py-0.5 text-[10px] font-medium rounded-sq-pill border",
      config.className
    )}>
      {config.label}
    </span>
  );
};
