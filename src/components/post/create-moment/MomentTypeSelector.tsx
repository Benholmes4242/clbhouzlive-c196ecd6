import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type MomentType = 'funny' | 'challenge' | 'course-vlog' | 'tips-coaching' | 'review' | 'other';

interface MomentTypeSelectorProps {
  selected: MomentType | null;
  onSelect: (type: MomentType) => void;
  className?: string;
}

const MOMENT_TYPES: { value: MomentType; label: string }[] = [
  { value: 'funny', label: 'Funny' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'course-vlog', label: 'Course Vlog' },
  { value: 'tips-coaching', label: 'Tips & Coaching' },
  { value: 'review', label: 'Review' },
  { value: 'other', label: 'Other' },
];

/**
 * MomentTypeSelector - Required category picker for Create Moment modal
 * Single-select pills, neutral grey styling (no orange)
 * One must be selected to enable Share
 */
export const MomentTypeSelector: React.FC<MomentTypeSelectorProps> = ({
  selected,
  onSelect,
  className,
}) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <label 
        className="block text-sm font-semibold mb-2"
        style={{ color: 'var(--cm-text-primary)' }}
      >
        What type of moment is this?
      </label>
      
      <div className="flex flex-wrap gap-2">
        {MOMENT_TYPES.map((type) => {
          const isSelected = selected === type.value;
          return (
            <motion.button
              key={type.value}
              type="button"
              onClick={() => onSelect(type.value)}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.1 }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                isSelected
                  ? "text-white"
                  : "text-muted-foreground border"
              )}
              style={{
                background: isSelected ? 'var(--cm-surface-slate)' : 'transparent',
                borderColor: isSelected ? 'transparent' : 'var(--cm-border-subtle)',
              }}
            >
              {type.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MomentTypeSelector;
