/**
 * PinDurationPicker - Bottom sheet to select pin duration
 */
import React from 'react';
import { X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type PinDuration = 7 | 14 | 30 | null;

interface PinDurationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (duration: PinDuration) => void;
}

const OPTIONS: { value: PinDuration; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: null, label: 'Indefinitely' },
];

export function PinDurationPicker({ isOpen, onClose, onSelect }: PinDurationPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative bg-white rounded-t-sq-lg sm:rounded-sq-lg w-full max-w-sm sm:mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Pin duration</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Options */}
        <div className="p-2">
          {OPTIONS.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => {
                onSelect(value);
                onClose();
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-sq-sm",
                "text-sm font-medium text-foreground",
                "hover:bg-muted/50 transition-colors"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}

export default PinDurationPicker;
