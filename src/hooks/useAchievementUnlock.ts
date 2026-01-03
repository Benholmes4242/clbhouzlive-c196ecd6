/**
 * useAchievementUnlock - Single-fire achievement unlock detection
 * 
 * Tracks previously unlocked achievements and detects when a new unlock occurs.
 * Animations/confetti/haptics ONLY trigger on locked → unlocked transition.
 * 
 * No replays when:
 * - Reopening the app
 * - Revisiting achievements page
 * - Opening an already-unlocked bottom sheet
 */

import { useEffect, useRef, useState } from 'react';

const UNLOCKED_STORAGE_KEY = 'clbhouz_unlocked_achievements';

interface UnlockedAchievements {
  milestones: number[]; // Thresholds that are unlocked
  regional: string[]; // List slugs that are complete
}

function getStoredUnlocks(): UnlockedAchievements {
  try {
    const stored = localStorage.getItem(UNLOCKED_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to read unlocked achievements:', e);
  }
  return { milestones: [], regional: [] };
}

function storeUnlocks(unlocks: UnlockedAchievements) {
  try {
    localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(unlocks));
  } catch (e) {
    console.warn('Failed to store unlocked achievements:', e);
  }
}

export interface UnlockAnimationState {
  shouldAnimate: boolean;
  hasAnimated: boolean;
  markAnimated: () => void;
}

/**
 * Hook to detect if an achievement should show unlock animation
 * Returns true ONLY on first unlock detection, never again
 */
export function useAchievementUnlock(
  type: 'milestone' | 'regional',
  identifier: number | string, // threshold for milestone, listSlug for regional
  isCurrentlyUnlocked: boolean,
  isOpen: boolean
): UnlockAnimationState {
  const [hasAnimated, setHasAnimated] = useState(false);
  const previouslyUnlockedRef = useRef<boolean | null>(null);
  const animationTriggeredRef = useRef(false);

  // Check if this was previously unlocked
  useEffect(() => {
    if (!isOpen) return;
    
    const stored = getStoredUnlocks();
    const wasUnlocked = type === 'milestone'
      ? stored.milestones.includes(identifier as number)
      : stored.regional.includes(identifier as string);
    
    previouslyUnlockedRef.current = wasUnlocked;
  }, [isOpen, type, identifier]);

  // Detect new unlock
  const shouldAnimate = 
    isOpen &&
    isCurrentlyUnlocked &&
    previouslyUnlockedRef.current === false &&
    !animationTriggeredRef.current;

  const markAnimated = () => {
    if (animationTriggeredRef.current) return;
    
    animationTriggeredRef.current = true;
    setHasAnimated(true);
    
    // Store this unlock so it never animates again
    const stored = getStoredUnlocks();
    if (type === 'milestone') {
      if (!stored.milestones.includes(identifier as number)) {
        stored.milestones.push(identifier as number);
      }
    } else {
      if (!stored.regional.includes(identifier as string)) {
        stored.regional.push(identifier as string);
      }
    }
    storeUnlocks(stored);
  };

  // Reset when sheet closes
  useEffect(() => {
    if (!isOpen) {
      animationTriggeredRef.current = false;
      setHasAnimated(false);
      previouslyUnlockedRef.current = null;
    }
  }, [isOpen]);

  return {
    shouldAnimate,
    hasAnimated,
    markAnimated,
  };
}

/**
 * For batch unlocks: returns only the highest achievement that should animate
 * (prevents dopamine overload from multiple celebrations)
 */
export function getHighestNewUnlock(
  milestoneThresholds: number[],
  totalPlayed: number
): number | null {
  const stored = getStoredUnlocks();
  const newUnlocks = milestoneThresholds
    .filter(t => totalPlayed >= t && !stored.milestones.includes(t))
    .sort((a, b) => b - a);
  
  return newUnlocks[0] || null;
}
