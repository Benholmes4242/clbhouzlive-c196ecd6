/**
 * VisibilityPillSelector - Compact pill-style visibility toggle
 * Replaces large colored blocks with a single row of pills
 */

import React from 'react';
import { Globe, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameVisibility } from '../types';

interface VisibilityPillSelectorProps {
  value: GameVisibility;
  onChange: (visibility: GameVisibility) => void;
  className?: string;
}

const VISIBILITY_OPTIONS: Array<{
  value: GameVisibility;
  label: string;
  icon: React.ElementType;
}> = [
  { value: 'public', label: 'Public', icon: Globe },
  { value: 'friends', label: 'Friends', icon: Users },
  { value: 'club', label: 'Club only', icon: Lock },
];

export function VisibilityPillSelector({ value, onChange, className }: VisibilityPillSelectorProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {VISIBILITY_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              "border active:scale-[0.97]",
              isSelected
                ? "bg-[var(--hub-glass-bg)] border-[var(--hub-stroke-strong)] text-[var(--hub-text)]"
                : "bg-[var(--hub-glass-bg-subtle)] border-[var(--hub-stroke-subtle)] text-[var(--hub-text-sub)] hover:bg-[var(--hub-glass-bg-hover)]"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
