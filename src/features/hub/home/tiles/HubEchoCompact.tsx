/**
 * HubEchoCompact - Compact Echo Card for side-by-side layout
 * Navigates to Echo page with optional pre-loaded prompt
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { Send, Sparkles } from 'lucide-react';
import { haptic } from '@/utils/haptics';

const SUGGESTIONS = [
  'Plan a weekend round',
  'Best drills for consistency?',
  'Where should I play next?',
  'How do I fix my slice?',
  'Give me chipping tips',
];

export function HubEchoCompact() {
  const navigate = useNavigate();
  const [suggestionIdx, setSuggestionIdx] = React.useState(0);

  // Rotate suggestions every 5 seconds
  React.useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    
    const interval = setInterval(() => {
      setSuggestionIdx(i => (i + 1) % SUGGESTIONS.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const openEcho = (msg = '') => {
    haptic('light');
    if (msg) {
      navigate(`/echo?prompt=${encodeURIComponent(msg)}`);
    } else {
      navigate('/echo');
    }
  };

  return (
    <div 
      onClick={() => openEcho()}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openEcho(); }}
    >
      <Tile title="">
        <div className="h-full flex flex-col">
          {/* Title with icon */}
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--hub-glass-bg-input)' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--hub-accent)' }} />
            </div>
            <h3 
              className="text-[17px] font-semibold"
              style={{ color: 'var(--hub-text)' }}
            >
              Echo
            </h3>
          </div>

          {/* Input-style button */}
          <div
            className="w-full h-10 rounded-xl px-3 text-left flex items-center gap-2 transition-all"
            style={{
              background: 'var(--hub-glass-bg-input)',
              border: '1px solid var(--hub-stroke)',
            }}
          >
            <span 
              className="flex-1 text-[14px] truncate"
              style={{ color: 'var(--hub-text-dim)' }}
            >
              Ask Echo...
            </span>
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--hub-primary-bg)' }}
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Single suggestion - tap opens Echo with message */}
          <p
            className="mt-2 text-[12px] text-left leading-snug line-clamp-2 cursor-pointer"
            style={{ color: 'var(--hub-text-muted)' }}
            onClick={(e) => { e.stopPropagation(); openEcho(SUGGESTIONS[suggestionIdx]); }}
          >
            "{SUGGESTIONS[suggestionIdx]}"
          </p>

          {/* Spacer */}
          <div className="mt-auto pt-2" />
        </div>
      </Tile>
    </div>
  );
}