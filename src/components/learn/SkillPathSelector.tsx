import React from 'react';
import { cn } from '@/lib/utils';
import { useSkillLevel, SkillLevel } from '@/hooks/useSkillLevel';

const SKILL_LEVELS: { id: SkillLevel; label: string; description: string }[] = [
  { id: 'beginner', label: 'Beginner', description: 'Just starting out' },
  { id: 'improver', label: 'Improver', description: 'Building foundations' },
  { id: 'confident', label: 'Confident', description: 'Ready to refine' },
  { id: 'competitive', label: 'Competitive', description: 'Playing to win' },
];

interface SkillPathSelectorProps {
  onChange?: (level: SkillLevel) => void;
}

/**
 * SkillPathSelector - Core mechanic for Learn tab
 * Single selection, persisted per user
 * All content below responds to this selection
 */
export const SkillPathSelector: React.FC<SkillPathSelectorProps> = ({ onChange }) => {
  const { skillLevel, setSkillLevel } = useSkillLevel();

  const handleSelect = (level: SkillLevel) => {
    setSkillLevel(level);
    onChange?.(level);
  };

  return (
    <div className="px-5 pb-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
        Your level
      </p>
      <div className="flex flex-wrap gap-2">
        {SKILL_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => handleSelect(level.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              "border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              skillLevel === level.id
                ? "bg-slate-800 text-white border-slate-700"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700/50"
            )}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SkillPathSelector;
