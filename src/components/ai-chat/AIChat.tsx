import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import FloatingAIButton from './FloatingAIButton';
import AIChatOverlay from './AIChatOverlay';

const AIChat: React.FC = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const { user, loading } = useSupabaseSession();
  const location = useLocation();
  const previousLocationRef = useRef(location.pathname);

  // Check if we're on an auth page
  const isAuthPage = location.pathname === '/auth' || location.pathname === '/create-profile';

  // Echo should never render on auth pages or when user is not authenticated
  const shouldRenderEcho = !loading && user && !isAuthPage;

  // Handle route changes - destroy Echo before navigation
  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousLocationRef.current;

    if (currentPath !== previousPath) {
      // Route changed - destroy Echo overlay before navigation completes
      if (isOverlayOpen) {
        setIsOverlayOpen(false);
      }
      
      // Update the previous location reference
      previousLocationRef.current = currentPath;
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