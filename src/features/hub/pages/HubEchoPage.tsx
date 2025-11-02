/**
 * Hub Echo Page
 * 
 * AI Chat interface within Hub.
 * Opens AI Chat overlay when mounted.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { openAIOverlay } from '@/controllers/aiOverlayController';

export function HubEchoPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Open AI chat overlay
    openAIOverlay('chat');

    // When overlay closes, navigate back to golfers
    const handleClose = () => {
      navigate('/hub/golfers');
    };

    // Listen for Escape key or route change
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  return (
    <div className="py-12 text-center">
      <div className="text-white/60 text-sm">
        Echo chat opening...
      </div>
    </div>
  );
}
