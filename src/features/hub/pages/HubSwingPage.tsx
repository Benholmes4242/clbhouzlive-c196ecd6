/**
 * Hub Swing Page
 * Full-screen liquid-glass page overlaying the origin page.
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SwingCoach from '@/components/ai-chat/SwingCoach';
import { AppleGlassScreen, AppleGlassHeader } from '../components/AppleGlassScreen';
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
      // Deep link fallback
      nav('/clubhouse', { replace: true });
    }
  };

  return (
    <AppleGlassScreen>
      <AppleGlassHeader onBack={goBack} title="Swing Coach" />

      {/* Swing Coach content */}
      <div className="flex-1 overflow-hidden">
        <SwingCoach
          onAnalysisTextChange={setAnalysisText}
          analysisText={analysisText}
        />
      </div>
    </AppleGlassScreen>
  );
}
