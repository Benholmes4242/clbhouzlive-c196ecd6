import * as React from 'react';
import { useState } from 'react';
import { Tile } from '../components/Tile';
import { Send } from 'lucide-react';
import { HubEchoSheet } from '../../components/HubEchoSheet';
import '../echo-tip.css';

export function EchoTile() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

  const tips = [
    'When is the next major?',
    'Plan me a golf trip to the USA.',
    "What's the best driver right now?",
    'Give me chipping tips.',
    'How do I fix my slice?',
    "What's a good putting drill?",
    'Show me top courses in Scotland.',
    'How do I play better in the wind?',
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

  const openSheet = (msg = '') => {
    setInitialMessage(msg);
    setIsSheetOpen(true);
  };
  const closeSheet = () => {
    setIsSheetOpen(false);
    setInitialMessage('');
  };

  return (
    <>
      <div 
        onClick={() => openSheet()}
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

              {/* Sample question - tap opens sheet with that message */}
              <p 
                className="mt-2 text-[12px] leading-snug line-clamp-2 text-center cursor-pointer"
                style={{ color: 'var(--hub-text-muted)' }}
                onClick={(e) => { e.stopPropagation(); openSheet(tips[tipIdx]); }}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') openSheet(tips[tipIdx]); }}
              >
                "{tips[tipIdx]}"
              </p>
            </div>

            {/* Bottom - removed history link for V1 */}
            <div className="mt-3" />
          </div>
        </Tile>
      </div>
      
      <HubEchoSheet 
        isOpen={isSheetOpen} 
        onClose={closeSheet} 
        initialMessage={initialMessage}
      />
    </>
  );
}
