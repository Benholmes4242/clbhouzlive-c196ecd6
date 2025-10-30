import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import {
  DesignReviewContextType,
  FlowState,
  ALL_FLOW_STATES,
} from './types';

const DesignReviewContext = createContext<DesignReviewContextType | null>(null);

export const useDesignReview = () => {
  const context = useContext(DesignReviewContext);
  if (!context) {
    throw new Error('useDesignReview must be used within DesignReviewProvider');
  }
  return context;
};

interface DesignReviewProviderProps {
  children: ReactNode;
}

export const DesignReviewProvider: React.FC<DesignReviewProviderProps> = ({ children }) => {
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [showSpacingGuides, setShowSpacingGuides] = useState(false);

  // Check for review mode flag on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reviewParam = params.get('review');
    if (reviewParam === '1' || reviewParam === 'true') {
      setIsReviewMode(true);
      console.log('🎨 Design Review Mode ENABLED');
    }
  }, []);

  const enableReviewMode = useCallback(() => {
    setIsReviewMode(true);
    console.log('🎨 Design Review Mode ENABLED');
    toast.success('Design Review Mode enabled');
  }, []);

  const disableReviewMode = useCallback(() => {
    setIsReviewMode(false);
    setCurrentStateIndex(0);
    setShowSpacingGuides(false);
    console.log('🎨 Design Review Mode DISABLED');
    toast.info('Design Review Mode disabled');
  }, []);

  const currentState = ALL_FLOW_STATES[currentStateIndex] || null;

  const nextState = useCallback(() => {
    setCurrentStateIndex((prev) => {
      const next = Math.min(prev + 1, ALL_FLOW_STATES.length - 1);
      console.log('➡️ Next state:', ALL_FLOW_STATES[next]?.name);
      return next;
    });
  }, []);

  const prevState = useCallback(() => {
    setCurrentStateIndex((prev) => {
      const previous = Math.max(prev - 1, 0);
      console.log('⬅️ Previous state:', ALL_FLOW_STATES[previous]?.name);
      return previous;
    });
  }, []);

  const jumpToState = useCallback((index: number) => {
    if (index >= 0 && index < ALL_FLOW_STATES.length) {
      setCurrentStateIndex(index);
      console.log('🎯 Jumped to state:', ALL_FLOW_STATES[index]?.name);
    }
  }, []);

  const toggleSpacingGuides = useCallback(() => {
    setShowSpacingGuides((prev) => !prev);
  }, []);

  const captureScreenshot = useCallback(async (stateName?: string) => {
    try {
      const name = stateName || currentState?.id || 'screenshot';
      console.log('📸 Capturing screenshot:', name);

      // Find the modal element to capture
      const modalElement = document.querySelector('[role="dialog"]') as HTMLElement || 
                          document.querySelector('.fixed.inset-0') as HTMLElement ||
                          document.body;

      if (!modalElement) {
        toast.error('Could not find element to capture');
        return;
      }

      const canvas = await html2canvas(modalElement, {
        backgroundColor: '#000000',
        scale: 2, // High quality
        logging: false,
        useCORS: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to create image');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${name}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Screenshot saved: ${name}.png`);
      }, 'image/png');
    } catch (error) {
      console.error('Screenshot error:', error);
      toast.error('Failed to capture screenshot');
    }
  }, [currentState]);

  const value: DesignReviewContextType = {
    isReviewMode,
    currentStateIndex,
    currentState,
    allStates: ALL_FLOW_STATES,
    nextState,
    prevState,
    jumpToState,
    captureScreenshot,
    showSpacingGuides,
    toggleSpacingGuides,
    enableReviewMode,
    disableReviewMode,
  };

  return (
    <DesignReviewContext.Provider value={value}>
      {children}
    </DesignReviewContext.Provider>
  );
};
