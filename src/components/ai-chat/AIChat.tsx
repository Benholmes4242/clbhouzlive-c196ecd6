import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useModalDetector } from '@/hooks/useModalDetector';
import FloatingAIButton from './FloatingAIButton';
import AIChatOverlay from './AIChatOverlay';

const AIChat: React.FC = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { user, loading } = useSupabaseSession();
  const { hasModalOpen } = useModalDetector();
  const location = useLocation();
  const previousLocationRef = useRef(location.pathname);

  // Check if we're on an auth page
  const isAuthPage = location.pathname === '/auth' || location.pathname === '/create-profile';

  // Echo should never render on auth pages, when user is not authenticated, or when modals are open
  const shouldRenderEcho = !loading && user && !isAuthPage && !isTransitioning && !hasModalOpen;

  // Handle route changes - destroy Echo before navigation and hide during transition
  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousLocationRef.current;

    if (currentPath !== previousPath) {
      // Route is changing - start transition
      setIsTransitioning(true);
      
      // Close overlay immediately
      if (isOverlayOpen) {
        setIsOverlayOpen(false);
      }
      
      // Update the previous location reference
      previousLocationRef.current = currentPath;
      
      // Wait for page to settle before showing Echo again
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300); // Small delay to ensure page has loaded
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isOverlayOpen]);

  // Don't render Echo at all if conditions aren't met
  if (!shouldRenderEcho) {
    return null;
  }

  return (
    <>
      <FloatingAIButton onClick={() => setIsOverlayOpen(true)} />
      <AIChatOverlay 
        isOpen={isOverlayOpen} 
        onClose={() => setIsOverlayOpen(false)} 
      />
    </>
  );
};

export default AIChat;