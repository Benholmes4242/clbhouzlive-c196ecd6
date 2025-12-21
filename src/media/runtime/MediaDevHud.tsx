/**
 * MediaDevHud - DEV-only overlay for runtime debugging
 * 
 * Shows real-time metrics:
 * - Active media ID, surface, reason
 * - Registry/warm pool sizes
 * - UI state (scrolling, modal, panel)
 * - TTFF + buffering metrics
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { MEDIA_DEV_HUD_V1 } from '@/config/featureFlags';
import { MediaRuntime } from './MediaRuntime';
import { cn } from '@/lib/utils';

interface HudState {
  activeId: string | null;
  activeSurface: string | null;
  activeReason: string | null;
  registrySize: number;
  warmPoolSize: number;
  isScrolling: boolean;
  isModalOpen: boolean;
  isPanelOpen: boolean;
  lastTtff: number | null;
  lastBufferingMs: number | null;
  isBuffering: boolean;
}

export const MediaDevHud = memo(function MediaDevHud() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [state, setState] = useState<HudState>({
    activeId: null,
    activeSurface: null,
    activeReason: null,
    registrySize: 0,
    warmPoolSize: 0,
    isScrolling: false,
    isModalOpen: false,
    isPanelOpen: false,
    lastTtff: null,
    lastBufferingMs: null,
    isBuffering: false,
  });

  // Poll debug info periodically
  useEffect(() => {
    if (!MEDIA_DEV_HUD_V1) return;

    const update = () => {
      const debug = MediaRuntime.getDebugInfo();
      const telemetry = MediaRuntime.getTelemetryStats();
      const activeReason = MediaRuntime.getActiveReason();
      
      setState({
        activeId: debug.activeMediaId,
        activeSurface: debug.activeSurface,
        activeReason: activeReason,
        registrySize: debug.registrySize,
        warmPoolSize: debug.warmPoolSize,
        isScrolling: debug.uiState.isScrolling,
        isModalOpen: debug.uiState.isModalOpen,
        isPanelOpen: debug.uiState.isPanelOpen,
        lastTtff: telemetry.lastTtff,
        lastBufferingMs: telemetry.lastBufferingMs,
        isBuffering: telemetry.isBuffering,
      });
    };

    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (!MEDIA_DEV_HUD_V1) return null;

  const toggle = useCallback(() => setIsExpanded(e => !e), []);

  if (!isExpanded) {
    return (
      <button
        onClick={toggle}
        className="fixed top-2 left-2 z-[9999] px-2 py-1 text-[10px] font-mono bg-black/70 text-green-400 rounded backdrop-blur-sm border border-green-500/30 hover:bg-black/80 transition-colors"
      >
        HUD
      </button>
    );
  }

  return (
    <div className="fixed top-2 left-2 z-[9999] p-2 min-w-[180px] bg-black/80 text-[10px] font-mono text-green-400 rounded-lg backdrop-blur-sm border border-green-500/30 shadow-lg">
      <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-green-500/20">
        <span className="text-green-300 font-semibold">MediaRuntime</span>
        <button
          onClick={toggle}
          className="text-green-500 hover:text-green-300 px-1"
        >
          ×
        </button>
      </div>

      <div className="space-y-0.5">
        {/* Active */}
        <Row 
          label="Active" 
          value={state.activeId ? `${state.activeId.slice(0, 8)}` : '—'} 
          highlight={!!state.activeId}
        />
        <Row label="Surface" value={state.activeSurface ?? '—'} />
        <Row label="Reason" value={state.activeReason ?? '—'} />
        
        {/* Pool sizes */}
        <div className="h-px bg-green-500/20 my-1" />
        <Row label="Registry" value={String(state.registrySize)} />
        <Row label="Warm Pool" value={String(state.warmPoolSize)} />
        
        {/* UI State */}
        <div className="h-px bg-green-500/20 my-1" />
        <Row 
          label="Scrolling" 
          value={state.isScrolling ? 'YES' : 'no'} 
          highlight={state.isScrolling}
        />
        <Row 
          label="Modal" 
          value={state.isModalOpen ? 'YES' : 'no'} 
          highlight={state.isModalOpen}
        />
        <Row 
          label="Panel" 
          value={state.isPanelOpen ? 'YES' : 'no'} 
          highlight={state.isPanelOpen}
        />
        
        {/* Metrics */}
        <div className="h-px bg-green-500/20 my-1" />
        <Row 
          label="TTFF" 
          value={state.lastTtff !== null ? `${state.lastTtff}ms` : '—'} 
        />
        <Row 
          label="Buffering" 
          value={state.isBuffering ? 'YES' : (state.lastBufferingMs !== null ? `${state.lastBufferingMs}ms` : '—')} 
          highlight={state.isBuffering}
        />
      </div>
    </div>
  );
});

function Row({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-green-500/70">{label}:</span>
      <span className={cn(
        highlight && 'text-yellow-400'
      )}>
        {value}
      </span>
    </div>
  );
}

export default MediaDevHud;
