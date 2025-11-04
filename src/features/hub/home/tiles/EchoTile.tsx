/**
 * Echo Tile
 * Merged Echo quick actions + recent chat preview
 */

import React, { useState } from 'react';
import { Tile } from '../components/Tile';
import { useOpenSheet } from '@/features/hub/sheets/useOpenSheet';
import { useEchoChatHistory } from '@/features/echo/hooks/useEchoChatHistory';
import { formatDistanceToNow } from 'date-fns';

const SUGGESTIONS = [
  'Best courses near me',
  'Tips to improve my swing',
];

export function EchoTile() {
  const [input, setInput] = useState('');
  const openSheet = useOpenSheet();
  const { data: history } = useEchoChatHistory({ limit: 1 });
  
  const lastChat = history?.[0];

  const submit = () => {
    if (!input.trim()) return;
    openSheet('echo', { msg: input });
    setInput('');
  };

  const handleSuggestion = (text: string) => {
    const sanitized = text.replace(/[^\w\s?]/gi, '').trim();
    openSheet('echo', { msg: sanitized });
  };

  return (
    <Tile
      title="Echo"
      subtitle="Ask me anything"
      onViewAll={() => openSheet('echo')}
    >
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        {/* Input bar */}
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Ask Echo..."
            className="w-full h-9 px-3 pr-9 rounded-xl text-[13px] transition focus:outline-none focus-visible:ring-2"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'var(--hub-text-bright)',
            }}
          />
          <button
            onClick={submit}
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[14px] transition disabled:opacity-30"
            style={{ color: 'var(--hub-text-body)' }}
            aria-label="Send message"
          >
            ↗
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] leading-tight transition whitespace-nowrap"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--hub-text-body)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Recent chat preview */}
        {lastChat && (
          <button
            onClick={() => openSheet('echo', { id: lastChat.id })}
            className="mt-auto p-2.5 rounded-xl text-left transition"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="text-[11px] mb-1" style={{ color: 'var(--hub-text-sub)' }}>
              {formatDistanceToNow(new Date(lastChat.created_at), { addSuffix: true })}
            </div>
            <div 
              className="text-[13px] line-clamp-1" 
              style={{ color: 'var(--hub-text-body)' }}
            >
              {lastChat.preview_text}
            </div>
          </button>
        )}
      </div>
    </Tile>
  );
}
