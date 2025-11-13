/**
 * Apple Glass Screen
 * Shared wrapper for Hub child pages with VisionOS-style environment
 */

import React from 'react';
import '../home/hubTheme.css';

interface AppleGlassScreenProps {
  children: React.ReactNode;
}

export function AppleGlassScreen({ children }: AppleGlassScreenProps) {
  return (
    <div 
      className="apple-glass-screen"
      style={{
        position: 'relative',
        minHeight: '100vh',
        paddingBottom: 'env(safe-area-inset-bottom)',
        // Same environment as Hub: dark background + vignette + saturate
        background: `
          radial-gradient(
            circle at center,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.25) 55%,
            rgba(0, 0, 0, 0.45) 100%
          ),
          rgba(0, 0, 0, 0.82)
        `,
        backdropFilter: 'saturate(0.8)',
        WebkitBackdropFilter: 'saturate(0.8)',
        color: '#fff',
      }}
    >
      {children}
    </div>
  );
}

interface AppleGlassHeaderProps {
  onBack: () => void;
  title: string;
}

export function AppleGlassHeader({ onBack, title }: AppleGlassHeaderProps) {
  return (
    <header 
      className="apple-glass-header"
      style={{
        padding: '12px 16px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
        background: 'rgba(0, 0, 0, 0.85)',
        borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <button
        onClick={onBack}
        className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
        aria-label="Back"
      >
        ‹ Back
      </button>
      <h1 className="text-white/90 text-[17px] font-semibold">{title}</h1>
      <div className="w-16" />
    </header>
  );
}

interface AppleGlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function AppleGlassPanel({ children, className = '' }: AppleGlassPanelProps) {
  return (
    <div 
      className={`apple-glass-panel ${className}`}
      style={{
        background: `
          radial-gradient(circle at top, rgba(255,255,255,0.03), transparent 60%),
          linear-gradient(to bottom, rgba(255,255,255,0.015), rgba(0,0,0,0.2))
        `,
        backgroundColor: '#1C1C1E',
        borderRadius: '22px',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        boxShadow: '0 8px 18px rgba(0,0,0,0.40)',
      }}
    >
      {children}
    </div>
  );
}
