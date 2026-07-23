import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { INK, DIM, FAINT, HAIR, GREEN, GREEN_BG, FONT } from './approachStages';

const STEPS = [
  'Verifying with England Golf',
  'Saving your handicap',
  'Importing your scores',
  'Finding your friends',
] as const;

const PERCENTS = [15, 45, 75, 96] as const;

export const SyncingScreen: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (reduced) {
      setActiveStep(STEPS.length - 1);
      return;
    }
    const timer = window.setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1300);
    return () => window.clearInterval(timer);
  }, [reduced]);

  const percent = PERCENTS[activeStep];
  const r = 50;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ fontFamily: FONT, padding: '20px 0 8px', justifyContent: 'space-between' }}
    >
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24, alignItems: 'center' }}>
        {/* Status headline */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div
            key={activeStep}
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: INK,
              animation: reduced ? 'none' : 'wcFadeUp 450ms ease',
            }}
          >
            {STEPS[activeStep]}
            <span style={{ color: GREEN }}>{'\u2026'}</span>
          </div>
          <div style={{ fontSize: 13, color: FAINT, marginTop: 6 }}>
            The ball's rolling. A few seconds.
          </div>
        </div>

        {/* Progress ring */}
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="rgba(5,150,105,0.07)" />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={GREEN}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              style={{ transition: reduced ? 'none' : 'stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              color: INK,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {percent}%
          </div>
        </div>

        {/* Step list */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {STEPS.map((label, i) => {
            const isDone = i < activeStep;
            const isActive = i === activeStep;
            return (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: isActive ? '#fff' : 'transparent',
                  border: isActive ? `1px solid ${HAIR}` : '1px solid transparent',
                  borderRadius: 13,
                  transition: 'all 350ms ease',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDone ? GREEN : isActive ? '#fff' : 'transparent',
                    border: isDone
                      ? `1.5px solid ${GREEN}`
                      : isActive
                      ? `1.5px solid ${GREEN}`
                      : `1.5px solid ${HAIR}`,
                    color: '#fff',
                    transition: 'all 350ms ease',
                  }}
                >
                  {isDone && <Check size={13} strokeWidth={3} />}
                  {isActive && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: GREEN,
                        animation: reduced ? 'none' : 'wcDotPulse 1.4s ease-in-out infinite',
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? INK : isDone ? INK : FAINT,
                    transition: 'color 350ms ease',
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* No CTA on sync — hold */}
      <div />
    </div>
  );
};

export default SyncingScreen;
