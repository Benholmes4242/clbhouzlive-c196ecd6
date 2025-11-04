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
      {/* Unified pill input with inline send icon */}
      <div className="relative">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="Ask Echo anything…"
          aria-label="Ask Echo"
          className="w-full h-12 rounded-2xl pr-12 pl-4 text-[15px] placeholder:opacity-60 outline-none transition"
          style={{
            background: 'var(--hub-glass)',
            border: '1px solid var(--hub-stroke-strong)',
            color: 'var(--hub-text)',
            backdropFilter: 'blur(var(--hub-blur))',
            WebkitBackdropFilter: 'blur(var(--hub-blur))',
            boxShadow: 'var(--hub-shadow-tile)',
          }}
        />

        {/* Send icon - no background, flush inside */}
        <button
          type="button"
          onClick={submit}
          aria-label="Send to Echo"
          disabled={!text.trim()}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-0 transition disabled:opacity-40"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--hub-text-dim)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-dim)'}
        >
          <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
        </button>
      </div>

      {/* Hairline divider */}
      <div
        className="mt-4"
        style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)',
        }}
      />

      {/* Custom text-only View all */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => nav('/hub/echo/history')}
          className="text-[15px] transition"
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
    </Tile>
  );
}
