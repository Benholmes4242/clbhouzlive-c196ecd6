/**
 * Echo Quick Chat Tile
 * Compact Harmony layout with hairline divider
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Tile } from '../components/Tile';

export function EchoQuickTile() {
  const [text, setText] = useState('');
  const nav = useNavigate();

  const submit = () => {
    const msg = text.trim();
    if (!msg) return;
    nav(`/hub/echo/chat?msg=${encodeURIComponent(msg)}`);
    setText('');
  };

  return (
    <Tile 
      title="Echo" 
      subtitle="Ask anything about golf"
    >
      <div className="flex h-full flex-col">
        {/* Top spacer */}
        <div className="h-2" />

        {/* Form with unified pill */}
        <form
          className="relative"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask Echo anything…"
            aria-label="Ask Echo"
            className="w-full h-12 rounded-2xl pl-4 pr-12 text-[15px] outline-none transition placeholder:opacity-60"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center transition disabled:opacity-40 hover:opacity-90 active:opacity-80"
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

        {/* Flexible spacer pushes footer to bottom */}
        <div className="flex-1" />

        {/* Bottom footer: divider + View all */}
        <div className="mt-4">
          <div
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
            }}
          />
          <button
            onClick={() => nav('/hub/echo/history')}
            className="ml-auto mt-3 block text-[15px] font-medium transition"
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
