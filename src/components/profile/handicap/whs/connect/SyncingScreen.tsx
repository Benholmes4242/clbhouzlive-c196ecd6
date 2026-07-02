import React, { useEffect, useState } from 'react';
import { Check, Flag } from 'lucide-react';

const INK = '#0F172A';
const INK_30 = '#94A3B8';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const FIELD_FILL = '#F8FAFC';
const GREEN = '#059669';
const GREEN_BG = 'rgba(5,150,105,0.08)';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const STEPS = [
  'Verifying with England Golf',
  'Saving your handicap',
  'Importing your scores',
  'Finding your friends',
] as const;

export const SyncingScreen: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${HAIR}`,
        borderRadius: 16,
        padding: '36px 22px 30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: FONT,
      }}
    >
      {/* Green ring */}
      <div style={{ width: 92, height: 92, position: 'relative', marginBottom: 24 }}>
        <svg width="92" height="92" viewBox="0 0 92 92">
          <circle cx="46" cy="46" r="40" fill={GREEN_BG} />
          <circle
            cx="46"
            cy="46"
            r="40"
            fill="none"
            stroke={GREEN}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="70 252"
            transform="rotate(-90 46 46)"
            style={{ transformOrigin: '46px 46px', animation: 'whs-spin 0.9s linear infinite' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Flag size={32} color={GREEN} strokeWidth={2.2} />
        </div>
      </div>

      <div style={{ fontSize: 17, fontWeight: 700, color: INK, marginBottom: 22, letterSpacing: '-0.01em' }}>
        Connecting your official WHS handicap
      </div>

      <div style={{ width: '100%', maxWidth: 320, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {STEPS.map((label, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          return (
            <div
              key={label}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: '8px 0',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDone ? GREEN : isActive ? GREEN_BG : FIELD_FILL,
                  border: isDone
                    ? `1.5px solid ${GREEN}`
                    : isActive
                    ? `1.5px solid ${GREEN}`
                    : `1px solid ${HAIR}`,
                  color: '#fff',
                  transition: 'all 300ms ease',
                }}
              >
                {isDone && <Check size={14} strokeWidth={3} />}
                {isActive && (
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: GREEN,
                      animation: 'whs-pulse 1.4s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: 15.5,
                  fontWeight: isActive ? 700 : isDone ? 500 : 500,
                  color: isActive ? INK : isDone ? INK : INK_30,
                  transition: 'color 300ms ease',
                }}
              >
                {label}
                {isActive && '...'}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12.5, color: INK_45, marginTop: 22 }}>
        This usually takes a few seconds.
      </div>

      <style>{`
        @keyframes whs-spin { to { transform: rotate(360deg); } }
        @keyframes whs-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default SyncingScreen;
