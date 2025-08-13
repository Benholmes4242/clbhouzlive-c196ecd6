import { useState, useEffect } from 'react';

export interface TabSlideAnimation {
  isAnimating: boolean;
  exitingTab: string | null;
  enteringTab: string | null;
  animationClass: string;
}

export const useTabSlideTransition = (activeTab: string, onTabChange: (tab: string) => void) => {
  const [animation, setAnimation] = useState<TabSlideAnimation>({
    isAnimating: false,
    exitingTab: null,
    enteringTab: null,
    animationClass: ''
  });

  const tabs = ['activity', 'courses', 'stats', 'gear'];
  
  const getTabDirection = (fromTab: string, toTab: string): 'left' | 'right' => {
    const fromIndex = tabs.indexOf(fromTab);
    const toIndex = tabs.indexOf(toTab);
    return toIndex > fromIndex ? 'right' : 'left';
  };

  const handleTabTransition = (newTab: string) => {
    if (newTab === activeTab || animation.isAnimating) return;

    const direction = getTabDirection(activeTab, newTab);
    
    setAnimation({
      isAnimating: true,
      exitingTab: activeTab,
      enteringTab: newTab,
      animationClass: direction === 'right' ? 'tab-slide-enter-right' : 'tab-slide-enter-left'
    });

    // Start the transition after a brief delay
    setTimeout(() => {
      onTabChange(newTab);
    }, 50);

    // Reset animation state after animation completes
    setTimeout(() => {
      setAnimation({
        isAnimating: false,
        exitingTab: null,
        enteringTab: null,
        animationClass: ''
      });
    }, 330); // Slightly longer than animation duration
  };

  return {
    animation,
    handleTabTransition
  };
};