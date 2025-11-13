/**
 * Hub Echo Chat Page
 * Full-screen glass page (standalone), opens over the origin page.
 */
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AIChatOverlay from '@/components/ai-chat/AIChatOverlay';
import { Z } from '@/config/zIndex';
import { AppleGlassScreen, AppleGlassHeader } from '../components/AppleGlassScreen';
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
    <AppleGlassScreen>
      <AppleGlassHeader onBack={handleBack} title="Echo" />

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
    </AppleGlassScreen>
  );
}
