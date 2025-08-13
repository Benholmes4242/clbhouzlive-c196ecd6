import { useState, useEffect, useRef } from 'react';

export const useCoursesJourneyPinning = (activeTab: string) => {
  const [isJourneyPinned, setIsJourneyPinned] = useState(false);
  const journeyRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab !== 'courses') {
      setIsJourneyPinned(false);
      return;
    }

    const handleScroll = () => {
      if (!journeyRef.current || !containerRef.current) return;

      const journeyElement = journeyRef.current;
      const containerElement = containerRef.current;
      const rect = journeyElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();
      
      // Pin when the journey section reaches the top of its container
      const shouldPin = rect.top <= containerRect.top + 80; // 80px for sticky tab bar
      
      setIsJourneyPinned(shouldPin);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Initial check
      handleScroll();
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [activeTab]);

  return {
    isJourneyPinned,
    journeyRef,
    containerRef
  };
};