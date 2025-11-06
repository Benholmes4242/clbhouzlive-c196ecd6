import * as React from 'react';
import { Tile } from '../components/Tile';
import { useEchoHistory } from '../../hooks/useEchoHistory';
import { useHub } from '@/features/hub/useHub';
import { Send } from 'lucide-react';

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

  const RAW_PROMPTS = [
    'Build me a 4-week practice plan',
    "What's the next major?",
    'Best drivers under £400 right now?',
    'How do I stop slicing my driver?',
    'Plan a 3-night golf trip to Ireland',
  ];

  const MAX_CHARS = 90;
  const prompts = RAW_PROMPTS.map(p => p.length > MAX_CHARS ? p.slice(0, MAX_CHARS - 1) + '…' : p);

  const [carouselIdx, setCarouselIdx] = React.useState(0);
  const [carouselPaused, setCarouselPaused] = React.useState(false);

  React.useEffect(() => {
    if (carouselPaused) return;
    const timer = setInterval(() => {
      setCarouselIdx((i) => (i + 1) % prompts.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [carouselPaused, prompts.length]);

  const handleSend = () => {
    if (input.trim()) {
      navigateFromHub('/hub/echo');
      setInput('');
    }
  };

  return (
    <Tile 
      title="Echo" 
      align="center"
      footer={
        <div className="mt-auto pt-2">
          <div 
            className="h-px"
            style={{
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '1px',
              width: '100%',
            }}
          />
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              navigateFromHub('/hub/echo/history'); 
            }}
            className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium transition"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
            aria-label="View echo history"
          >
            View all →
          </button>
        </div>
      }
    >
      <div 
        className="echo-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Ask input with send button */}
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

        {/* Carousel - centered between input and footer */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            navigateFromHub('/hub/echo');
          }}
          onMouseEnter={() => setCarouselPaused(true)}
          onMouseLeave={() => setCarouselPaused(false)}
          onTouchStart={() => setCarouselPaused(true)}
          onTouchEnd={() => setCarouselPaused(false)}
          style={{
            marginTop: 'auto',
            marginBottom: 'auto',
            height: 'calc(1.25em * 2 + 6px)',
            overflow: 'hidden',
            padding: '3px 0',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              display: 'flex',
              height: '100%',
              transition: 'transform 0.35s ease',
              transform: `translateX(-${carouselIdx * 100}%)`,
            }}
          >
            {prompts.map((prompt, i) => (
              <div
                key={i}
                style={{
                  minWidth: '100%',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                  lineHeight: '1.25',
                  padding: '0 8px',
                  fontSize: '15px',
                  whiteSpace: 'normal',
                  textOverflow: 'ellipsis',
                  color: 'var(--hub-text-body)',
                  textAlign: 'center',
                }}
              >
                "{prompt}"
              </div>
            ))}
          </div>
        </div>
      </div>
    </Tile>
  );
}
