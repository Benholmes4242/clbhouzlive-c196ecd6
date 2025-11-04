/**
 * Echo Quick Chat Tile
 * Compact Harmony layout with hairline divider
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Tile } from '../components/Tile';

const SUGGESTIONS = [
  'Plan me a 3-night golf trip to Ireland',
  'When is the next major?',
  'Which pro has the most hole-in-ones?',
];

function sanitize(str: string) {
  return str.replace(/\s+/g, ' ').trim();
}

export function EchoQuickTile() {
  const [text, setText] = useState('');
  const nav = useNavigate();

  const submit = () => {
    const msg = text.trim();
    if (!msg) return;
    nav(`/hub/echo/chat?msg=${encodeURIComponent(msg)}`);
    setText('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    const q = sanitize(suggestion);
    setText(q);
    setTimeout(() => {
      nav(`/hub/echo/chat?msg=${encodeURIComponent(q)}`);
      setText('');
    }, 150);
  };

  return (
    <Tile 
      title="Echo" 
      subtitle="Ask anything about golf"
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <form
            className="relative mt-3"
            onSubmit={(e) => { e.preventDefault(); submit(); }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask Echo"
              aria-label="Ask Echo"
              className="w-full h-11 rounded-2xl pl-4 pr-12 text-[15px] outline-none transition placeholder:opacity-60"
              style={{
                background: 'var(--hub-glass)',
                border: '1px solid var(--hub-stroke-strong)',
                color: 'var(--hub-text)',
                backdropFilter: 'blur(var(--hub-blur))',
                WebkitBackdropFilter: 'blur(var(--hub-blur))',
              }}
            />

            {/* Send icon button at far right inside pill */}
            <button
              type="submit"
              onClick={submit}
              aria-label="Send to Echo"
              disabled={!text.trim()}
              className="absolute right-[8px] top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center transition disabled:opacity-40 hover:opacity-90 active:opacity-80"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--hub-text)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
            </button>
          </form>

          {/* Suggestions */}
          <div className="mt-3 sm:mt-4 grid grid-cols-1 xs:grid-cols-2 gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="inline-flex items-center justify-between w-full rounded-2xl px-3 h-10 border transition active:scale-[0.995]"
                style={{
                  borderColor: 'rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: 'rgba(255,255,255,0.85)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                aria-label={`Ask Echo: ${s}`}
              >
                <span className="truncate text-[15px]">{s}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70 flex-shrink-0 ml-2">
                  <path fill="currentColor" d="M9 6l6 6-6 6" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom footer: divider + View all */}
        <div className="mt-6 sm:mt-8">
          <div
            className="h-px"
            style={{
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '1px',
              width: '100%',
            }}
          />
          <button
            onClick={() => nav('/hub/echo/history')}
            className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium transition"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
            aria-label="View all Echo"
          >
            View all →
          </button>
        </div>
      </div>
    </Tile>
  );
}
