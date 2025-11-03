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
    const msg = text.trim();
    if (!msg) return;
    // Deep-link and let chat screen auto-send via ?msg=
    nav(`/hub/echo/chat?msg=${encodeURIComponent(msg)}`);
    setText('');
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
          style={{
            flex: 1,
            border: '1px solid var(--hub-stroke)',
            borderRadius: 14,
            padding: '12px 14px',
            background: 'rgba(255,255,255,.02)',
            color: 'var(--hub-text)',
          }}
        />
        <button className="chip" disabled={!text.trim()}>Send</button>
      </form>
    </section>
  );
}
