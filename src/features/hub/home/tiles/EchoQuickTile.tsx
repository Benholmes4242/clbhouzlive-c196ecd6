/**
 * Echo Quick Chat Tile
 * Quick access to send an Echo message from the dashboard
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TileHeader } from '../parts/TileHeader';
import { SendHorizontal } from 'lucide-react';

interface EchoQuickTileProps {
  className?: string;
}

export function EchoQuickTile({ className }: EchoQuickTileProps) {
  const [text, setText] = useState('');
  const nav = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    // Navigate to chat with query param to auto-send message
    nav(`/hub/echo/chat?msg=${encodeURIComponent(text.trim())}`);
  };

  return (
    <section className={className}>
      <TileHeader 
        title="Echo" 
        subtitle="Ask anything about golf" 
        viewAllTo="/hub/echo/chat" 
      />
      <form onSubmit={onSubmit} className="row" style={{ gap: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask Echo anything…"
          aria-label="Ask Echo"
          className="flex-1 border rounded-xl px-3.5 py-3 bg-white/02 text-white placeholder:text-white/40"
          style={{
            borderColor: 'var(--hub-stroke)',
            borderRadius: '14px',
          }}
        />
        <button 
          type="submit"
          disabled={!text.trim()} 
          className="chip flex items-center gap-1.5"
          aria-pressed="false"
        >
          Send <SendHorizontal className="w-3.5 h-3.5" />
        </button>
      </form>
    </section>
  );
}
