import React from 'react';
import { Video, Image, MapPin, Sparkles } from 'lucide-react';
import { AnimatedCheck } from '@/components/ui/AnimatedCheck';
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
                className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all"
                style={{
                  background: isActive 
                    ? 'var(--cm-surface-slate)' 
                    : 'var(--cm-surface-alt)',
                  border: isActive 
                    ? 'none' 
                    : '1px solid var(--cm-border-subtle)',
                  boxShadow: isActive 
                    ? '0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.1)' 
                    : 'none',
                }}
              >
                {/* Icon container matching MomentAudienceSheet */}
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ 
                    background: isActive ? 'rgba(255,255,255,0.18)' : 'var(--cm-surface-card)',
                    color: isActive ? 'white' : 'var(--cm-icon-primary)',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                
                {/* Label and description */}
                <div className="flex-1 text-left">
                  <p 
                    className="font-medium text-[13px]"
                    style={{ color: isActive ? 'white' : 'var(--cm-text-primary)' }}
                  >
                    {option.label}
                  </p>
                  <p 
                    className="text-[11px] mt-0.5"
                    style={{ color: isActive ? 'rgba(255,255,255,0.75)' : 'var(--cm-text-tertiary)' }}
                  >
                    {option.description}
                  </p>
                </div>
                
                {/* Active indicator checkmark */}
                {isActive && (
                  <div className="opacity-100">
                    <AnimatedCheck />
                  </div>
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
