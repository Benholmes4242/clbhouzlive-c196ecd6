import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useModalDetector } from '@/hooks/useModalDetector';
import FloatingAIButton from './FloatingAIButton';
import AIChatOverlay from './AIChatOverlay';

const AIChat: React.FC = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { user, loading } = useSupabaseSession();
  const { hasModalOpen } = useModalDetector();
  const location = useLocation();
  const previousLocationRef = useRef(location.pathname);

  // Check if we're on an auth page
  const isAuthPage = location.pathname.startsWith('/auth') || location.pathname.startsWith('/create-profile');

  // Check if we're on an immersive profile modal by looking for it in the DOM
  const [isImmersiveModalOpen, setIsImmersiveModalOpen] = useState(false);

  // Use MutationObserver to watch for immersive modal changes
  useEffect(() => {
    const check = () => setIsImmersiveModalOpen(!!document.querySelector('[data-immersive-modal="true"]'));
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    check();
    return () => observer.disconnect();
  }, []);

  // Echo should never render on auth pages, when user is not authenticated, when modals are open, or in immersive modal
  const shouldRenderEcho = !loading && user && !isAuthPage && !isTransitioning && !hasModalOpen && !isImmersiveModalOpen;

  // Handle route changes - destroy Echo before navigation and hide during transition
  useEffect(() => {
    if (location.pathname !== previousLocationRef.current) {
      setIsTransitioning(true);
      if (isOverlayOpen) setIsOverlayOpen(false);
      previousLocationRef.current = location.pathname;
      const t = window.setTimeout(() => setIsTransitioning(false), 350);
      return () => window.clearTimeout(t);
    }
  }, [location.key, location.pathname, isOverlayOpen]);

  // Don't render Echo at all if conditions aren't met
  if (!shouldRenderEcho) {
    return null;
  }

  return (
    <>
      <FloatingAIButton 
        onClick={() => setIsOverlayOpen(true)} 
        shouldHide={isOverlayOpen || isHistoryOpen}
      />
      <AIChatOverlay 
        isOpen={isOverlayOpen} 
        onClose={() => setIsOverlayOpen(false)}
        onHistoryStateChange={setIsHistoryOpen}
      />
    </>
  );
};

export default AIChat;