/**
 * Hub Swing Page
 * Full-screen page with standard Hub light theme styling
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SwingCoach from '@/components/ai-chat/SwingCoach';
import { HubHeader } from '../components/HubHeader';
import '../home/hubThemeLight.css';

export function HubSwingPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const [analysisText, setAnalysisText] = useState('');

  const goBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      nav(-1);
    } else {
      nav('/hub', { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: 'var(--hub-backdrop)',
          backdropFilter: `blur(var(--hub-backdrop-blur))`,
          WebkitBackdropFilter: `blur(var(--hub-backdrop-blur))`,
        }} 
      />
      
      {/* Glass Sheet */}
      <div
        className="hub-glass-page fixed inset-0 flex flex-col"
        style={{
          background: 'var(--hub-bg-start)',
          border: '1px solid var(--hub-stroke-subtle)',
          boxShadow: 'var(--hub-shadow-main)',
        }}
      >
        <HubHeader title="Swing Coach" onBack={goBack} />

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
