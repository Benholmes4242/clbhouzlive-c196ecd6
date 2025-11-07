import * as React from 'react';
import { Tile } from '../components/Tile';
import { useEchoHistory } from '../../hooks/useEchoHistory';
import { useHub } from '@/features/hub/useHub';
import { Send } from 'lucide-react';
import '@/styles/echo-tile.css';

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
  const { navigateFromHub } = useHub();

  const quickPrompts = [
    'Best drivers under £400 right now?',
    'Plan a 3-night golf trip to Ireland',
    'Fix my slice (driver)',
    'Build me a 4-week practice plan',
  ];

  const handlePromptClick = (prompt: string) => {
    navigateFromHub(`/hub/echo?msg=${encodeURIComponent(prompt)}`);
  };

  const handleSend = () => {
    const text = input.trim();
    if (text) {
      navigateFromHub(`/hub/echo?msg=${encodeURIComponent(text)}`);
      setInput('');
    }
  };

  return (
    <Tile 
      title="Echo" 
      align="center"
    >
      <div 
        className="echo-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* View Chats CTA - positioned on tile */}
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            navigateFromHub('/hub/echo/history'); 
          }}
          className="text-[15px] font-medium transition"
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            background: 'transparent',
            border: 'none',
            color: 'var(--hub-text-body)',
            padding: 0,
            zIndex: 1,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
          aria-label="View echo history"
        >
          View Chats →
        </button>
        {/* Ask input with send button */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); e.stopPropagation(); }}
          style={{ position: 'relative', marginTop: '8px' }}
        >
          <input
            aria-label="Ask Echo"
            placeholder="Ask Echo"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="echo-input"
            style={{
              width: '100%',
              height: '40px',
              borderRadius: '14px',
              padding: '0 44px 0 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid transparent',
              outline: 0,
              fontSize: '15px',
              color: 'var(--hub-text)',
              transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '34px',
              height: '34px',
              borderRadius: '12px',
              border: 0,
              background: 'rgba(255,255,255,0.08)',
              fontSize: '16px',
              cursor: input.trim() ? 'pointer' : 'default',
              opacity: input.trim() ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={16} />
          </button>
        </form>

        {/* Quick prompts - clickable pills with scroll fade */}
        <div
          className="echo-quick-wrap"
          style={{
            position: 'relative',
            marginTop: '12px',
            marginBottom: 'auto',
          }}
        >
          <div
            className="echo-quick-scroll"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              padding: '6px 2px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePromptClick(prompt);
                }}
                aria-label={`Ask Echo: ${prompt}`}
                style={{
                  border: 0,
                  padding: '10px 14px',
                  borderRadius: '14px',
                  background: 'transparent',
                  color: 'var(--hub-text-body)',
                  whiteSpace: 'nowrap',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--hub-text)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--hub-text-body)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </Tile>
  );
}
