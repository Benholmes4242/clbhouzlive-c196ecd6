import React from 'react';

// Enhanced mobile transition animations for profile components
export const MobileTransitions = {
  // Fade + swipe combination for immersive to profile transition
  immersiveToProfile: {
    enter: 'animate-[fadeInUp_400ms_ease-out]',
    exit: 'animate-[fadeOutDown_300ms_ease-in]'
  },
  
  // Smooth tab transitions
  tabTransition: {
    slideLeft: 'animate-[slideInLeft_250ms_ease-out]',
    slideRight: 'animate-[slideInRight_250ms_ease-out]',
    fadeIn: 'animate-[fadeIn_200ms_ease-out]'
  },

  // Stats pill strip animation
  statsPillStrip: {
    container: 'animate-[slideInUp_300ms_ease-out_100ms_both]',
    pills: 'animate-[scaleIn_200ms_ease-out_var(--delay,0ms)_both]'
  }
};

// CSS-in-JS keyframes for mobile-specific animations
export const MobileKeyframes = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeOutDown {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(20px);
    }
  }

  @keyframes slideInLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideInUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

// Custom hook for mobile transition states
export const useMobileTransitions = () => {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  
  const triggerTransition = React.useCallback((duration: number = 300) => {
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), duration);
  }, []);

  return {
    isTransitioning,
    triggerTransition,
    getTransitionClass: (animation: string) => 
      isTransitioning ? animation : ''
  };
};