/**
 * RegionBottomSheet - Premium region selection sheet
 * A* Polish: Clean spacing, flag+label rows, gray-900 selected state
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { X, Check } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="px-5 pb-3 pt-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DrawerTitle className="text-lg font-semibold text-gray-900 text-left">
                Select Region
              </DrawerTitle>
              <p className="text-sm text-gray-400 mt-0.5 text-left">
                Filter content by region
              </p>
            </div>
            <DrawerClose asChild>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="px-5 pb-6 space-y-2">
          {REGION_OPTIONS.map((option) => {
            const isActive = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]",
                  isActive 
                    ? "bg-gray-900 text-white" 
                    : "bg-gray-50 text-gray-700"
                )}
              >
                <span className="text-lg">{option.emoji}</span>
                <span className="flex-1 text-left">{option.label}</span>
                {isActive && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RegionBottomSheet;
