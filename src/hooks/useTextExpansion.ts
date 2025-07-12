import { useState } from 'react';

/**
 * Custom hook for managing text expansion state
 * @returns Object with expansion state and handlers
 */
export const useTextExpansion = () => {
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  const handleMouseEnter = () => setIsTextExpanded(true);
  const handleMouseLeave = () => setIsTextExpanded(false);

  return {
    isTextExpanded,
    handleMouseEnter,
    handleMouseLeave,
  };
};