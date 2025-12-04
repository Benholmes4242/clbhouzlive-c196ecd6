import React from 'react';
import { Video, Image, MapPin, Trophy, Sparkles, Target } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

export type ActivityFilterType = 'all' | 'videos' | 'photos' | 'courses' | 'swings' | 'milestones' | 'hole-in-ones';

export interface ActivityFilters {
  type: ActivityFilterType;
}

interface ActivityFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ActivityFilters;
  onChange: (filters: ActivityFilters) => void;
}

const FILTER_OPTIONS: { id: ActivityFilterType; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'all', label: 'All posts', icon: Sparkles, description: 'Show everything' },
  { id: 'videos', label: 'Videos only', icon: Video, description: 'Just the videos' },
  { id: 'photos', label: 'Photos only', icon: Image, description: 'Just the photos' },
  { id: 'courses', label: 'Courses tagged', icon: MapPin, description: 'Posts with golf courses' },
  { id: 'swings', label: 'Golf swings', icon: Target, description: 'Swing videos' },
  { id: 'milestones', label: 'Milestones', icon: Trophy, description: 'Achievement posts' },
];

/**
 * ActivityFiltersSheet - Bottom sheet for filtering activity feed
 */
const ActivityFiltersSheet: React.FC<ActivityFiltersSheetProps> = ({
  open,
  onOpenChange,
  value,
  onChange,
}) => {
  const handleSelect = (type: ActivityFilterType) => {
    onChange({ type });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background border-t border-border">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="text-lg font-semibold">Filter posts</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-8 space-y-1">
          {FILTER_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = value.type === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
                  "transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-foreground" 
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isActive ? "bg-primary/20" : "bg-muted"
                )}>
                  <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ActivityFiltersSheet;
