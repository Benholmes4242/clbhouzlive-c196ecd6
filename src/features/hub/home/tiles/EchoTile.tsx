import * as React from 'react';
import { Tile } from '../components/Tile';
import { useEchoHistory } from '../../hooks/useEchoHistory';
import { useOpenSheet } from '../../sheets/useOpenSheet';

function timeAgo(iso?: string) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function EchoTile() {
  const { data: recent, isLoading } = useEchoHistory();
  const [input, setInput] = React.useState('');
  const openSheet = useOpenSheet();

  const openEcho = (seedPrompt?: string) => {
    openSheet('echo', seedPrompt ? { msg: seedPrompt } : undefined);
  };

  return (
    <Tile 
      title="Echo" 
      subtitle="Ask me anything"
      onViewAll={() => openEcho()}
    >
      <div className="flex flex-col gap-3 h-full">
        {/* Ask input */}
        <div className="echo-input" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.18)',
        }}>
          <input
            aria-label="Ask Echo"
            placeholder="Ask Echo"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) { openEcho(input); setInput(''); } }}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              border: 0,
              outline: 0,
              fontSize: '15px',
              background: 'transparent',
              color: 'var(--hub-text)',
            }}
          />
          <button
            className="send"
            disabled={!input.trim()}
            onClick={(e) => { e.stopPropagation(); openEcho(input); setInput(''); }}
            aria-label="Send to Echo"
            style={{
              border: 0,
              background: 'transparent',
              fontSize: '16px',
              color: 'var(--hub-text)',
              cursor: input.trim() ? 'pointer' : 'default',
              opacity: input.trim() ? 1 : 0.4,
            }}
          >
            ➤
          </button>
        </div>

        {/* Suggestions */}
        <div className="chip-row" style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          <button 
            className="chip"
            onClick={(e) => { e.stopPropagation(); openEcho('Plan me a 3-night golf trip to Ireland'); }}
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              whiteSpace: 'nowrap',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--hub-text-body)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Plan me a 3-night golf trip to Ireland
          </button>
          <button 
            className="chip"
            onClick={(e) => { e.stopPropagation(); openEcho('When is the next major?'); }}
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              whiteSpace: 'nowrap',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--hub-text-body)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            When is the next major?
          </button>
        </div>

        {/* Single recent preview */}
        <button
          className="recent-row"
          onClick={(e) => { e.stopPropagation(); openEcho(); }}
          aria-label="Open Echo history"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            padding: 0,
            border: 0,
            textAlign: 'left',
            background: 'transparent',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <div 
            className="bubble" 
            style={{
              flex: 1,
              maxHeight: '44px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '10px 12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--hub-text-body)',
              fontSize: '14px',
            }}
          >
            {isLoading ? 'Loading…' : (recent?.preview ?? 'No chats yet — ask Echo above.')}
          </div>
          <div 
            className="ts" 
            style={{
              fontSize: '12px',
              opacity: 0.7,
              color: 'var(--hub-text-body)',
              whiteSpace: 'nowrap',
            }}
          >
            {recent?.when ? timeAgo(recent.when) : ''}
          </div>
        </button>
      </div>
    </Tile>
  );
}
