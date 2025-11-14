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
    'When is the next major?',
    'Who won the Ryder Cup in 2025?',
    'Plan me a 5-night golf trip to the USA.',
    'Plan me a 3-day island golf tour.',
    "What's the best driver on the market right now?",
    'What wedges should I use?',
    'What bounce should my wedges have?',
    'Give me chipping tips.',
    'How do I fix my slice?',
    'How do I hit further?',
    "What's a good putting drill?",
    'Recommend a golf podcast.',
    'Show me the top 10 courses in Scotland.',
    'How do I play better in the wind?',
    'Create a weekly practice plan for me.',
  ];

  const [tipIdx, setTipIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [isFirstTip, setIsFirstTip] = React.useState(true);

  // Auto-advance: 3s for first tip, then 7s for subsequent tips
  React.useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    
    const duration = isFirstTip ? 3000 : 7000;
    const id = setTimeout(() => {
      setTipIdx(i => (i + 1) % tips.length);
      setIsFirstTip(false);
    }, duration);
    
    return () => clearTimeout(id);
  }, [paused, tips.length, tipIdx, isFirstTip]);

  const sendTip = (t: string) =>
    navigateFromHub(`/hub/echo?msg=${encodeURIComponent(t)}`);

  const handleSend = () => {
    const text = input.trim();
    if (text) {
      navigateFromHub(`/hub/echo?msg=${encodeURIComponent(text)}`);
      setInput('');
    }
  };

  const lightTap = () => {
    try {
      (window.navigator as any)?.vibrate?.(5);
    } catch {}
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
        {/* Subtitle */}
        <p className="mt-0.5 text-[12px] text-[color:var(--hub-text-muted)] leading-snug">
          Ask Echo anything — golf tips, trips, rules and more.
        </p>
        {/* View Chats CTA - positioned on tile */}
        <button
          onClick={(e) => { 
            e.stopPropagation();
            lightTap();
            navigateFromHub('/hub/echo/history'); 
          }}
          className="text-[15px] font-medium transition hub-tile-pressable"
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
          onSubmit={(e) => { e.preventDefault(); lightTap(); handleSend(); e.stopPropagation(); }}
          style={{ position: 'relative', marginTop: '12px' }}
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
          <div className="echo-tip-line">"{tips[tipIdx]}"</div>
        </div>
      </div>
    </Tile>
  );
}
