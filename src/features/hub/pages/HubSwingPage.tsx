/**
 * Hub Swing Page
 * Full-screen liquid-glass page overlaying the origin page.
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SwingCoach from '@/components/ai-chat/SwingCoach';
import '../home/hubTheme.css';

export function HubSwingPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const [analysisText, setAnalysisText] = useState('');

  const goBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      // Navigate back to close this overlay
      nav(-1);
    } else {
      // Deep link fallback - return to Hub
      nav('/hub', { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Glass Sheet */}
      <div
        className="hub-glass-page fixed inset-0 flex flex-col"
        style={{
          background: 'rgba(0, 0, 0, 0.28)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.16)',
        }}
      >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'var(--hub-stroke)',
          background: 'rgba(22, 24, 27, 0.98)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      >
        <button
          onClick={goBack}
          className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
          aria-label="Back"
        >
          ‹ Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">Swing Coach</h1>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ paddingTop: '28px' }}>
        <SwingCoach
          onAnalysisTextChange={setAnalysisText}
          analysisText={analysisText}
        />
      </div>
      </div>
    </div>
  );
}
