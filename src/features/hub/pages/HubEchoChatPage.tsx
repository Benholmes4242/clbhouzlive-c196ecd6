/**
 * Hub Echo Chat Page
 * Full-screen glass page (standalone), opens over the origin page.
 */
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AIChatOverlay from '@/components/ai-chat/AIChatOverlay';
import '../home/hubTheme.css';

export function HubEchoChatPage() {
  const nav = useNavigate();
  const loc = useLocation();

  // Apply hub-open class for glass theme
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const handleBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      nav(-1);
    } else {
      nav('/clubhouse', { replace: true });
    }
  };

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999] flex flex-col"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Header - matches golfers page styling */}
      <header 
        className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'var(--hub-stroke)',
          background: 'rgba(22, 24, 27, 0.98)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          transition: 'all 160ms ease-out',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          contain: 'paint',
        }}
      >
        <button
          onClick={handleBack}
          className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
          aria-label="Back to Hub"
        >
          ‹ Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">Echo</h1>
        <div className="w-16" />
      </header>

      {/* Echo Chat - using existing system in pane mode */}
      <div className="flex-1 overflow-hidden">
        <AIChatOverlay
          isOpen={true}
          onClose={() => {}}
          initialTab="chat"
          paneMode={true}
          layout="page"
        />
      </div>
    </div>
  );
}
