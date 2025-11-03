/**
 * Echo Quick Chat Tile
 * Compact tile with input capped and send button fixed width
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { ViewAllPill } from '../components/ViewAllPill';

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
    <Tile 
      title="Echo" 
      subtitle="Ask anything about golf" 
      variant="compact"
      right={<ViewAllPill onClick={() => nav('/hub/echo/chat')} />}
    >
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask Echo anything…"
          aria-label="Ask Echo"
          className="h-11 flex-1 min-w-0 rounded-xl px-3.5 text-white placeholder:text-white/40 bg-white/5 border border-white/12 outline-none focus:border-white/20 transition-colors"
        />
        <button 
          type="submit"
          disabled={!text.trim()}
          className="h-11 w-[80px] shrink-0 rounded-xl border border-white/15 text-white/90 hover:bg-white/10 transition disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </Tile>
  );
}
