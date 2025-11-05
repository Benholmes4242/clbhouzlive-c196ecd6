import * as React from 'react';
import { Tile } from '../components/Tile';
import { useEchoHistory } from '../../hooks/useEchoHistory';
import { useOpenSheet } from '../../sheets/useOpenSheet';
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
  const openSheet = useOpenSheet();

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

  const openEcho = (seedPrompt?: string) => {
    openSheet('echo', seedPrompt ? { msg: seedPrompt } : undefined);
  };

  const handleSend = () => {
    if (input.trim()) {
      openEcho(input);
      setInput('');
    }
  };

  return (
    <Tile 
      title="Echo" 
      subtitle="Ask me anything"
      onViewAll={() => openEcho()}
      align="center"
    >
      <div 
        className="echo-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          gap: '10px',
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
            setInput(prompts[carouselIdx].replace(/(^"|"$)/g, ''));
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
            borderRadius: '8px',
            padding: '3px 0',
            background: 'rgba(255,255,255,0.04)',
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
                  padding: '0 10px',
                  fontSize: '12.5px',
                  whiteSpace: 'normal',
                  textOverflow: 'ellipsis',
                  color: 'var(--hub-text-body)',
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
