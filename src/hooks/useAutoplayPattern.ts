import { useEffect, useState } from 'react';

interface AutoplayPatternConfig {
  isMobile: boolean;
}

/**
 * Determines if a card should autoplay based on its index and device type
 */
export const useAutoplayPattern = ({ isMobile }: AutoplayPatternConfig) => {
  const [currentIsMobile, setCurrentIsMobile] = useState(isMobile);

  useEffect(() => {
    setCurrentIsMobile(isMobile);
  }, [isMobile]);

  const shouldAutoplay = (index: number): boolean => {
    // Convert to 1-based index for easier calculation
    const cardNumber = index + 1;

    if (currentIsMobile) {
      // Mobile Pattern: 1st, 4th & 5th, 8th & 9th, 12th & 13th, 16th & 17th...
      // Pattern: 1, then pairs starting every 4 cards from 4th onwards
      if (cardNumber === 1) return true;
      
      // Generate pairs: 4-5, 8-9, 12-13, 16-17...
      // Starting from 4th card, every 4th card starts a pair
      if (cardNumber >= 4) {
        const adjustedCard = cardNumber - 4; // Start from 4th card (0-based)
        const cyclePosition = adjustedCard % 4;
        return cyclePosition === 0 || cyclePosition === 1; // First two in each cycle of 4
      }
      
      return false;
    } else {
      // Desktop Pattern: 1st, 8th & 9th, 15th & 16th, 22nd & 23rd, 29th & 30th...
      // Pattern: 1, then pairs starting every 7 cards from 8th onwards
      if (cardNumber === 1) return true;
      
      // Generate pairs: 8-9, 15-16, 22-23, 29-30...
      // Starting from 8th card, every 7th card starts a pair
      if (cardNumber >= 8) {
        const adjustedCard = cardNumber - 8; // Start from 8th card (0-based)
        const cyclePosition = adjustedCard % 7;
        return cyclePosition === 0 || cyclePosition === 1; // First two in each cycle of 7
      }
      
      return false;
    }
  };

  return { shouldAutoplay };
};