import { useState, useEffect } from 'react';

export type SkillLevel = 'beginner' | 'improver' | 'confident' | 'competitive';

const STORAGE_KEY = 'clbhouz_skill_level';

/**
 * Hook to manage and persist user's skill level selection
 */
export function useSkillLevel() {
  const [skillLevel, setSkillLevelState] = useState<SkillLevel>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidSkillLevel(stored)) {
        return stored as SkillLevel;
      }
    }
    return 'improver'; // Default
  });

  const setSkillLevel = (level: SkillLevel) => {
    setSkillLevelState(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, level);
    }
  };

  return { skillLevel, setSkillLevel };
}

function isValidSkillLevel(value: string): value is SkillLevel {
  return ['beginner', 'improver', 'confident', 'competitive'].includes(value);
}
