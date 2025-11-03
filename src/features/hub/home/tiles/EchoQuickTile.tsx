/**
 * Echo Quick Chat Tile
 * Quick access to send an Echo message from the dashboard
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { TileHeader } from '../components/TileHeader';

export function EchoQuickTile() {
  const [text, setText] = useState('');
  const nav = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    nav(`/hub/echo/chat?msg=${encodeURIComponent(msg)}`);
    setText('');
  };

  return (
    <Tile className="min-h-[128px]">
      <TileHeader 
        title="Echo" 
        subtitle="Ask anything about golf" 
        onViewAll={() => nav('/hub/echo/chat')} 
      />
      <form onSubmit={onSubmit} className="flex gap-2 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask Echo anything…"
          aria-label="Ask Echo"
          className="flex-1 h-11 md:h-12 rounded-2xl border border-white/12 bg-white/04 backdrop-blur px-3.5 text-[15px] placeholder:text-white/45 text-white outline-none focus:border-white/20 transition-colors"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}
        />
        <button 
          type="submit"
          disabled={!text.trim()}
          className="shrink-0 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-white transition-all duration-200 disabled:opacity-40"
          style={{
            background: '#FF8C32',
            border: 'none',
          }}
        >
          Send
        </button>
      </form>
    </Tile>
  );
}
