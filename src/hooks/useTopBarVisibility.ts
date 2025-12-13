import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ⚠️ AUTO-HIDE DISABLED: TopBar is now always visible
 * This hook previously hid the top bar after 2s of inactivity.
 * Now it always returns isVisible: true and resetTimer is a no-op.
 */
export const useTopBarVisibility = () => {
  // DISABLED: Always visible
  const [isVisible] = useState(true);

  // DISABLED: No timer logic - just a no-op function for API compatibility
  const resetTimer = useCallback(() => {
    // No-op: TopBar visibility is now locked to visible
  }, []);

  return { isVisible, resetTimer };
};
