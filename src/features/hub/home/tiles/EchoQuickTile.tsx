/**
 * Echo Quick Chat Tile
 * Compact tile with wider input and paper-airplane send icon
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Tile } from '../components/Tile';

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
      onViewAll={() => nav('/hub/echo/history')}
    >
      <form onSubmit={onSubmit} className="flex items-center gap-2.5" aria-label="Ask Echo">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask Echo anything…"
          aria-label="Ask Echo"
          className="flex-1 min-w-0 rounded-2xl h-11 px-4 text-[15px] bg-white/04 border border-white/12 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/12 transition"
        />
        <button 
          type="submit"
          disabled={!text.trim()}
          aria-label="Send"
          className="rounded-2xl h-11 w-11 flex items-center justify-center border border-white/15 bg-white/08 hover:bg-white/12 transition disabled:opacity-40"
        >
          <Send size={18} className="text-white" />
        </button>
      </form>
    </Tile>
  );
}
