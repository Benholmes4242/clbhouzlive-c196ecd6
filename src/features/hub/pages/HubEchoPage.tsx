/**
 * Hub Echo Page
 * 
 * Inline AI Chat interface within Hub (Phase 3).
 * Renders chat directly without overlay.
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, History, MessageSquare } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function HubEchoPage() {
  const [activeView, setActiveView] = useState<'chat' | 'history'>('chat');

  useEffect(() => {
    // Track Echo tab open
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.echo_open.event, {
        event_category: analyticsEvents.hub.echo_open.category,
        event_label: analyticsEvents.hub.echo_open.label,
      });
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
        <TapButton
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'chat'
              ? 'bg-white/15 text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
          onClick={() => setActiveView('chat')}
        >
          <MessageSquare className="w-4 h-4 inline mr-1.5" />
          Chat
        </TapButton>
        <TapButton
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'history'
              ? 'bg-white/15 text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
          onClick={() => setActiveView('history')}
        >
          <History className="w-4 h-4 inline mr-1.5" />
          History
        </TapButton>
      </div>

      {/* Echo Coming Soon Message */}
      <div className="py-16 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10">
          <Sparkles className="w-8 h-8 text-white/80" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white/90 mb-2">Echo AI Assistant</h3>
          <p className="text-sm text-white/60 max-w-xs mx-auto">
            {activeView === 'chat' 
              ? 'AI chat interface will be integrated here in the next phase.'
              : 'Your conversation history will appear here.'}
          </p>
        </div>
        <div className="text-xs text-white/40">
          Phase 4 • Coming Soon
        </div>
      </div>
    </div>
  );
}
