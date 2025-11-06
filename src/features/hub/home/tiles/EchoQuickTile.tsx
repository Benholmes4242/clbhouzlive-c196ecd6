/**
 * Echo Quick Chat Tile
 * Compact Harmony layout with hairline divider
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Tile } from '../components/Tile';
import EchoAvatar from '@/components/ai-chat/EchoAvatar';

export function EchoQuickTile() {
  const [text, setText] = useState('');
  const nav = useNavigate();

  const comingSoon = () => {
    alert('Coming soon');
  };

  const submit = () => {
    const msg = text.trim();
    if (!msg) return;
    comingSoon();
    setText('');
  };

  return (
    <Tile 
      title={
        <div className="flex items-center gap-2">
          <span>Echo</span>
          <EchoAvatar state="idle" size={20} />
        </div>
      }
      subtitle="Ask me anything"
      footer={
        <div className="mt-auto pt-4">
          <div
            className="h-px"
            style={{
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '1px',
              width: '100%',
            }}
          />
          <button
            onClick={comingSoon}
            className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium transition"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
          >
            View all →
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Input form */}
        <form
          className="relative mt-3"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask Echo"
            className="w-full h-11 rounded-2xl pl-4 pr-12 text-[15px] outline-none transition placeholder:opacity-60"
            style={{
              background: 'var(--hub-glass)',
              border: '1px solid var(--hub-stroke-strong)',
              color: 'var(--hub-text)',
              backdropFilter: 'blur(var(--hub-blur))',
              WebkitBackdropFilter: 'blur(var(--hub-blur))',
            }}
          />

          {/* Send icon button at far right inside pill */}
          <button
            type="submit"
            onClick={submit}
            disabled={!text.trim()}
            className="absolute right-[8px] top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center transition disabled:opacity-40 hover:opacity-90 active:opacity-80"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
          </button>
        </form>
      </div>
    </Tile>
  );
}
