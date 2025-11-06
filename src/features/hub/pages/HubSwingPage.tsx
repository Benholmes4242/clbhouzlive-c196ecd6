/**
 * Hub Swing Page
 * Full-screen glass overlay for Swing Coach video upload & analysis.
 * Matches the pattern of other Hub page overlays (Golfers, Echo, Create Game).
 */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHub } from '@/features/hub/useHub';
import SwingCoach from '@/components/ai-chat/SwingCoach';
import '../home/hubTheme.css';

export function HubSwingPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { open } = useHub();
  const [analysisText, setAnalysisText] = useState('');

  const goBack = () => {
    const bg = (loc.state as any)?.backgroundLocation;
    if (bg) {
      // Return to Hub overlay over the same origin
      open();
      nav(-1);
    } else {
      // Deep link fallback
      nav('/clubhouse', { replace: true });
    }
  };

  return (
    <div className="hub-glass-page">
      {/* Header */}
      <header className="hub-page-header">
        <button className="hub-back" onClick={goBack} aria-label="Back">
          ‹ Back
        </button>
        <h1 className="hub-title">Swing Coach</h1>
        <div style={{ width: 44 }} />
      </header>

      {/* Swing Coach content */}
      <div className="hub-page-body">
        <SwingCoach
          onAnalysisTextChange={setAnalysisText}
          analysisText={analysisText}
        />
      </div>
    </div>
  );
}
