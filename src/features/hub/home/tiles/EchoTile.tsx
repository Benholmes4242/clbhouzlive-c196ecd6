import * as React from 'react';
import { useState } from 'react';
import { Tile } from '../components/Tile';
import { useHub } from '@/features/hub/useHub';
import { Send } from 'lucide-react';
import { HubEchoSheet } from '../../components/HubEchoSheet';
import '../echo-tip.css';

export function EchoTile() {
  const [input, setInput] = React.useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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

  const openSheet = () => setIsSheetOpen(true);
  const closeSheet = () => setIsSheetOpen(false);

  const sendTip = (t: string) => {
    // Open sheet and it will navigate with the message
    closeSheet();
    navigateFromHub(`/hub/echo?msg=${encodeURIComponent(t)}`);
  };

  const handleSend = () => {
    const text = input.trim();
    if (text) {
      navigateFromHub(`/hub/echo?msg=${encodeURIComponent(text)}`);
      setInput('');
    }
  };

  return (
    <>
      <div 
        onClick={openSheet}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openSheet(); }}
      >
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
                <div style={{ position: 'relative' }}>
                  <div
                    className="w-full h-10 rounded-[14px] px-[14px] flex items-center"
                    style={{
                      background: 'var(--hub-glass-bg-input)',
                      border: '1px solid var(--hub-stroke)',
                    }}
                  >
                    <span 
                      className="flex-1 text-[15px]"
                      style={{ color: 'var(--hub-text-dim)' }}
                    >
                      Ask Echo
                    </span>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '12px',
                        background: 'var(--hub-glass-bg-input)',
                        color: 'var(--hub-text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6,
                      }}
                    >
                      <Send size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample question */}
              <p 
                className="mt-2 text-[12px] leading-snug line-clamp-2 text-center"
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
      </div>
      
      <HubEchoSheet isOpen={isSheetOpen} onClose={closeSheet} />
    </>
  );
}
