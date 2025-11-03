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
      onViewAll={() => nav('/hub/echo/history')}
    >
      {/* Input row */}
      <div className="flex items-center gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="Ask Echo anything…"
          aria-label="Ask Echo"
          className="flex-1 min-w-0 h-11 rounded-2xl px-4 text-[15px] placeholder:opacity-45 focus:outline-none focus:ring-2 transition"
          style={{
            background: 'var(--hub-glass-subtle)',
            border: '1px solid var(--hub-stroke-subtle)',
            color: 'var(--hub-text)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        />

        <button
          onClick={submit}
          aria-label="Send to Echo"
          className="h-11 w-11 rounded-2xl flex items-center justify-center transition focus:outline-none disabled:opacity-40"
          disabled={!text.trim()}
          style={{
            background: 'transparent',
            border: '1px solid var(--hub-stroke-subtle)',
            color: 'var(--hub-text-sub)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
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

      {/* Bottom spacer for View all button */}
      <div className="h-2" />
    </Tile>
  );
}
