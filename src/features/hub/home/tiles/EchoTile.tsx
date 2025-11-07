import * as React from 'react';
import { Tile } from '../components/Tile';
import { useEchoHistory } from '../../hooks/useEchoHistory';
import { useHub } from '@/features/hub/useHub';
import { Send } from 'lucide-react';
import '../echo-tip.css';

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

  const tips = [
    'Best drivers under £400 right now?',
    'Plan a 3-night golf trip to Ireland',
    'Fix my slice (driver)',
    'Build me a 4-week practice plan',
  ];

  const [tipIdx, setTipIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  // Auto-advance every 7s (respect reduced motion)
  React.useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setTipIdx(i => (i + 1) % tips.length), 7000);
    return () => clearInterval(id);
  }, [paused, tips.length]);

  const sendTip = (t: string) =>
    navigateFromHub(`/hub/echo?msg=${encodeURIComponent(t)}`);

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
            style={{
              width: '100%',
              height: '40px',
              borderRadius: '14px',
              padding: '0 44px 0 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              outline: 0,
              fontSize: '15px',
              color: 'var(--hub-text)',
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

        {/* Tip carousel – text only, centered, two-line clamp, clickable */}
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); sendTip(tips[tipIdx]); }}
          onKeyDown={(e) => { if (e.key === 'Enter') sendTip(tips[tipIdx]); }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          aria-label={`Ask Echo: ${tips[tipIdx]}`}
          style={{
            marginTop: 12,
            marginBottom: 'auto',
            padding: '2px 8px',
            cursor: 'pointer',
          }}
        >
          <div className="echo-tip-line">{tips[tipIdx]}</div>
        </div>
      </div>
    </Tile>
  );
}
