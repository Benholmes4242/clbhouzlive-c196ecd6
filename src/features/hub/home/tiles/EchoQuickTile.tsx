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
      {/* Unified pill input */}
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

        {/* Send icon button inside the pill */}
        <button
          type="button"
          onClick={submit}
          aria-label="Send to Echo"
          disabled={!text.trim()}
          className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl grid place-items-center transition disabled:opacity-40 hover:bg-[var(--hub-glass-hover)] active:scale-97"
          style={{
            background: 'var(--hub-glass-subtle)',
            border: '1px solid var(--hub-stroke)',
            color: 'var(--hub-text)',
            backdropFilter: 'blur(var(--hub-blur))',
            WebkitBackdropFilter: 'blur(var(--hub-blur))',
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
