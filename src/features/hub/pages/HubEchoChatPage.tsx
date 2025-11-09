/**
 * Hub Echo Chat Page
 * Full-screen glass page (standalone), opens over the origin page.
 */
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AIChatOverlay from '@/components/ai-chat/AIChatOverlay';
import { OpaqueHeader } from '@/components/layout/OpaqueHeader';
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
      {/* Opaque header */}
      <OpaqueHeader
        title="Echo"
        onBack={handleBack}
        className="bg-background/95"
      />

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
