import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

const INK = '#0F172A';
const INK_55 = '#64748B';
const AMBER = '#F7931E';
const GREEN = '#059669';
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
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '28px 36px',
        textAlign: 'center',
        fontFamily: FONT,
      }}
    >
      <div style={{ width: 140, height: 140, position: 'relative', marginBottom: 28 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <defs>
            <linearGradient id="orbit-grad-1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={AMBER} />
              <stop offset="100%" stopColor="#FBA738" stopOpacity="0" />
            </linearGradient>
          </defs>

          <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(247,147,30,0.10)" strokeWidth="2" />
          <circle cx="70" cy="70" r="44" fill="none" stroke="rgba(247,147,30,0.16)" strokeWidth="2" />

          <circle cx="70" cy="70" r="28" fill="rgba(247,147,30,0.10)">
            <animate attributeName="r" values="26;30;26" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.10;0.20;0.10" dur="2s" repeatCount="indefinite" />
          </circle>

          <circle
            cx="70" cy="70" r="60"
            fill="none"
            stroke="url(#orbit-grad-1)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="120 376"
            transform="rotate(-90 70 70)"
          >
            <animateTransform
              attributeName="transform" type="rotate"
              from="-90 70 70" to="270 70 70"
              dur="2.4s" repeatCount="indefinite"
            />
          </circle>

          <circle
            cx="70" cy="70" r="44"
            fill="none"
            stroke={AMBER}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="60 276"
            transform="rotate(45 70 70)"
          >
            <animateTransform
              attributeName="transform" type="rotate"
              from="45 70 70" to="-315 70 70"
              dur="1.8s" repeatCount="indefinite"
            />
          </circle>

          <g transform="translate(70 70)">
            <line x1="-2" y1="-14" x2="-2" y2="14" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M -2 -12 L 14 -8 L -2 -4 Z" fill={AMBER} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        </svg>
      </div>

      <div style={{ width: '100%', maxWidth: 280, textAlign: 'left' }}>
        {STEPS.map((label, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          return (
            <div
              key={label}
              style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '10px 0',
                opacity: i > activeStep ? 0.55 : 1,
                transition: 'opacity 400ms ease',
              }}
            >
              <div
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone ? GREEN : isActive ? 'rgba(247,147,30,0.18)' : 'rgba(15,23,42,0.05)',
                  border: isDone
                    ? `1.5px solid ${GREEN}`
                    : isActive
                      ? `1.5px solid ${AMBER}`
                      : '1.5px solid rgba(15,23,42,0.15)',
                  color: '#fff',
                  transition: 'all 400ms ease',
                }}
              >
                {isDone && <Check size={12} strokeWidth={3} />}
                {isActive && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: AMBER,
                    animation: 'pulse 1.4s ease-in-out infinite',
                  }} />
                )}
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? INK : INK_55,
                  transition: 'all 400ms ease',
                }}
              >
                {label}
                {isActive && '…'}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default SyncingScreen;
