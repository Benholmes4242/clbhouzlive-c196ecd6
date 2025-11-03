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
          className="flex-1 min-w-0 rounded-2xl h-11 px-4 text-[15px] focus:outline-none focus:ring-2 transition"
          style={{
            background: 'var(--hub-glass-bg-input)',
            border: '1px solid var(--hub-stroke-mid)',
            color: 'var(--hub-text)',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--hub-stroke-mid)'}
        />
        <button 
          type="submit"
          disabled={!text.trim()}
          aria-label="Send"
          className="rounded-2xl h-11 w-11 flex items-center justify-center transition disabled:opacity-40"
          style={{
            border: '1px solid var(--hub-stroke-strong)',
            background: 'var(--hub-glass-bg-button)',
          }}
          onMouseEnter={(e) => !text.trim() ? null : e.currentTarget.style.background = 'var(--hub-glass-bg-button-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--hub-glass-bg-button)'}
        >
          <Send size={18} style={{ color: 'var(--hub-text)' }} />
        </button>
      </form>
    </Tile>
  );
}
