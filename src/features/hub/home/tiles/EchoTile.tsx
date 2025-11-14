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

  return (
    <Tile title="" align="center">
      <div className="flex h-full flex-col justify-between">
        {/* Top section */}
        <div>
          {/* Title */}
          <h3 className="text-[20px] font-semibold text-center -mt-2" style={{ color: 'var(--hub-text-bright)' }}>
            Echo
          </h3>

          {/* Ask Echo input */}
          <div className="mt-2">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); e.stopPropagation(); }}
              style={{ position: 'relative' }}
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
          </div>

          {/* Sample question */}
          <p 
            className="mt-2 text-[12px] leading-snug line-clamp-2 cursor-pointer text-center"
            style={{ color: 'var(--hub-text-muted)' }}
            onClick={(e) => { e.stopPropagation(); sendTip(tips[tipIdx]); }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') sendTip(tips[tipIdx]); }}
          >
            "{tips[tipIdx]}"
          </p>
        </div>

        {/* Bottom link */}
        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            navigateFromHub('/hub/echo/history'); 
          }}
          className="mt-3 self-end text-[15px] font-medium inline-flex items-center gap-1"
          style={{ color: 'var(--hub-text-bright)' }}
        >
          View Chats
          <span aria-hidden>→</span>
        </button>
      </div>
    </Tile>
  );
}
