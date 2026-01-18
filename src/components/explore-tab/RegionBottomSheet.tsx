/**
 * RegionBottomSheet - Bottom sheet for selecting regions in Explore
 * 
 * Matches the style of the sort bottom sheet from DiscoverCommandCenter:
 * - Drawer component with handle bar
 * - Grid of region options with emojis
 * - Check mark on selected item
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { AnimatedCheck } from '@/components/ui/AnimatedCheck';
import { triggerHaptic } from '@/lib/ui/haptics';
import { RegionKey } from '@/hooks/useExploreMoments';

export type RegionValue = 'all' | RegionKey;

interface RegionOption {
  value: RegionValue;
  label: string;
  emoji: string;
}

const REGION_OPTIONS: RegionOption[] = [
  { value: 'all', label: 'All regions', emoji: '🌐' },
  { value: 'GBI', label: 'GB & Ireland', emoji: '🇬🇧' },
  { value: 'EU', label: 'Europe', emoji: '🇪🇺' },
  { value: 'USA', label: 'USA', emoji: '🇺🇸' },
  { value: 'ROW', label: 'Rest of World', emoji: '🌍' },
];

interface RegionBottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value: RegionValue;
  onChange: (value: RegionValue) => void;
}

export const RegionBottomSheet: React.FC<RegionBottomSheetProps> = ({
  isOpen,
  onOpenChange,
  value,
  onChange,
}) => {
  const handleSelect = (regionValue: RegionValue) => {
    triggerHaptic('selection');
    onChange(regionValue);
    onOpenChange(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="px-4 pb-2 pt-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DrawerTitle
                className="text-lg font-semibold text-left"
                style={{ color: 'var(--cm-text-primary)' }}
              >
                Select Region
              </DrawerTitle>
              <p 
                className="text-sm mt-0.5 text-left"
                style={{ color: 'var(--cm-text-secondary)' }}
              >
                Filter content by region
              </p>
            </div>
            <DrawerClose asChild>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--cm-surface-alt)' }}
                aria-label="Close"
              >
                <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div 
          className="px-4 pb-6 overflow-y-auto"
          style={{
            maxHeight: 'calc(75vh - 120px)',
          }}
        >
          <div className="space-y-1.5">
            {REGION_OPTIONS.map((option) => {
              const isActive = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all active:scale-[0.98] border",
                    isActive 
                      ? "bg-[#f8fafc] border-[#e2e8f0] text-[#1e293b]" 
                      : "bg-transparent border-transparent text-[#64748b] hover:bg-[#f8fafc]"
                  )}
                >
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl",
                      isActive ? "bg-white" : "bg-[#f1f5f9]"
                    )}
                  >
                    {option.emoji}
                  </div>
                  <span className="flex-1 text-left font-medium">
                    {option.label}
                  </span>
                  {isActive && <AnimatedCheck />}
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RegionBottomSheet;
