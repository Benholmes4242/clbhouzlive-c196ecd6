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
          className="flex-1 min-w-0 rounded-2xl h-11 px-4 text-[15px] transition focus:outline-none focus:ring-2 placeholder:opacity-40"
          style={{
            background: 'var(--hub-glass-bg)',
            border: '1px solid var(--hub-stroke)',
            color: 'var(--hub-text)',
            backdropFilter: 'blur(12px)',
          }}
        />
        <button 
          type="submit"
          disabled={!text.trim()}
          aria-label="Send"
          className="rounded-2xl h-11 w-11 flex items-center justify-center transition disabled:opacity-40"
          style={{
            border: '1px solid var(--hub-stroke)',
            background: 'var(--hub-glass-bg)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="1.6">
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </Tile>
  );
}
