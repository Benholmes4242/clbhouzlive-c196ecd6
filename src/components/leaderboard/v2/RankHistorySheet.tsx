/**
 * RankHistorySheet - Milestone feed showing key moments in user's Top 100 journey
 * No charts, just a clean list of achievements and rank milestones
 */

import React from 'react';
import { Trophy, Target, Zap, ArrowUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RankMilestone {
  id: string;
  type: 'new_pb' | 'tier_entry' | 'fast_climber' | 'overtook_rivals';
  headline: string;
  context: string; // e.g. "All-time", "This month"
  timestamp: string; // relative or date
  value?: number; // e.g. rank number or rival count
}

interface RankHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestones: RankMilestone[];
  isLoading?: boolean;
}

function MilestoneIcon({ type }: { type: RankMilestone['type'] }) {
  const iconClass = 'w-4 h-4';
  
  switch (type) {
    case 'new_pb':
      return <Trophy className={cn(iconClass, 'text-amber-600')} />;
    case 'tier_entry':
      return <Target className={cn(iconClass, 'text-primary')} />;
    case 'fast_climber':
      return <Zap className={cn(iconClass, 'text-slate-500')} />;
    case 'overtook_rivals':
      return <ArrowUp className={cn(iconClass, 'text-slate-500')} />;
    default:
      return <Target className={cn(iconClass, 'text-muted-foreground')} />;
  }
}

function MilestoneItem({ milestone }: { milestone: RankMilestone }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-shrink-0 mt-0.5">
        <MilestoneIcon type={milestone.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {milestone.headline}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {milestone.context} · {milestone.timestamp}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-4">
        <Trophy className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-[240px] mb-4">
        Your progress will appear here as you climb the leaderboard.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/discover?tab=explore')}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Log a Top 100 course
      </Button>
    </div>
  );
}

export function RankHistorySheet({
  open,
  onOpenChange,
  milestones,
  isLoading,
}: RankHistorySheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center">Your Rank History</DrawerTitle>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Key moments in your Top 100 journey
          </p>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-3 py-3 animate-pulse">
                  <div className="w-4 h-4 rounded bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : milestones.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border/40 pb-8">
              {milestones.map((milestone) => (
                <MilestoneItem key={milestone.id} milestone={milestone} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}

// Example milestones for development/testing
export const MOCK_MILESTONES: RankMilestone[] = [
  {
    id: '1',
    type: 'new_pb',
    headline: 'New personal best: #42',
    context: 'All-time',
    timestamp: '2 days ago',
    value: 42,
  },
  {
    id: '2',
    type: 'tier_entry',
    headline: 'Entered Global Top 50',
    context: 'All-time',
    timestamp: '1 week ago',
  },
  {
    id: '3',
    type: 'fast_climber',
    headline: 'Fast climber (+14 places)',
    context: 'This month',
    timestamp: '2 weeks ago',
    value: 14,
  },
  {
    id: '4',
    type: 'overtook_rivals',
    headline: 'Overtook 3 rivals',
    context: 'This month',
    timestamp: '3 weeks ago',
    value: 3,
  },
  {
    id: '5',
    type: 'tier_entry',
    headline: 'Entered Global Top 100',
    context: 'All-time',
    timestamp: 'May 2025',
  },
];
