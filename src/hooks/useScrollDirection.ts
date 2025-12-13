import { useEffect, useState, useCallback } from 'react';

/**
 * ⚠️ AUTO-HIDE DISABLED: This hook now always returns isHidden: false
 * The header is always visible regardless of scroll direction.
 * 
 * Original behavior: Returns isHidden: true when scrolling down, false when scrolling up
 */
export function useScrollDirection(threshold = 8) {
  // DISABLED: Always return false (header never hidden)
  const [isHidden] = useState(false);

  // Keep the scroll listener for potential future re-enabling, but don't update state
  // This is a no-op effect that maintains API compatibility
  useEffect(() => {
    // No-op: scroll direction detection disabled
  }, [threshold]);

  return { isHidden };
}
