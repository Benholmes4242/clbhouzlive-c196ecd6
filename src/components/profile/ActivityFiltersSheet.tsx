import React from 'react';
import { Video, Image, MapPin, Sparkles, Check } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

export type ActivityFilterType = 'all' | 'videos' | 'photos' | 'courses';

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
];

/**
 * ActivityFiltersSheet - Bottom sheet for filtering activity feed
 * Uses slate color palette for premium, consistent styling
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
        <DrawerHeader className="text-left pb-2 pt-4">
          <DrawerTitle className="text-lg font-semibold text-foreground">Filter posts</DrawerTitle>
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
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl",
                  "transition-all duration-200",
                  isActive 
                    ? "bg-slate-100 dark:bg-slate-800" 
                    : "hover:bg-muted/50"
                )}
              >
                {/* Icon container with slate styling */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  "transition-colors duration-200",
                  isActive 
                    ? "bg-slate-200 dark:bg-slate-700" 
                    : "bg-muted/50"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    isActive ? "text-slate-700 dark:text-slate-200" : "text-muted-foreground"
                  )} />
                </div>
                
                {/* Label and description */}
                <div className="flex-1 text-left">
                  <div className={cn(
                    "font-medium text-sm",
                    isActive ? "text-foreground" : "text-foreground"
                  )}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
                
                {/* Active indicator checkmark */}
                {isActive && (
                  <Check className="w-5 h-5 text-slate-600 dark:text-slate-300" />
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
