import React from 'react';
import { Camera, Images } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MediaSourceTab = 'gallery' | 'camera';

interface MediaSourceTabsProps {
  activeTab: MediaSourceTab;
  onTabChange: (tab: MediaSourceTab) => void;
  disabled?: boolean;
}

export function MediaSourceTabs({
  activeTab,
  onTabChange,
  disabled,
}: MediaSourceTabsProps) {
  const tabs: { id: MediaSourceTab; label: string; icon: typeof Camera }[] = [
    { id: 'gallery', label: 'Gallery', icon: Images },
    { id: 'camera', label: 'Camera', icon: Camera },
  ];
  
  return (
    <div className="flex items-center justify-center gap-2 p-2 bg-background border-t border-border">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-full',
              'font-medium text-sm',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
