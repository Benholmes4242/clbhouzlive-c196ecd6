/**
 * Hub Echo Chat Page
 * Full-screen glass page (standalone), opens over the origin page.
 */
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';
import { EchoChat } from '@/features/echo/components/EchoChat';
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
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Glass header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
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

      {/* Chat body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <EchoConversationsProvider>
          <EchoChat />
        </EchoConversationsProvider>
      </div>
    </div>
  );
}
