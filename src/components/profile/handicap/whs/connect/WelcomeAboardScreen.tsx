import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { INK, DIM, HAIR, GREEN, FONT } from './approachStages';

interface Props {
  firstName: string;
  handicapIndex: number | null;
  homeClub: string | null;
  scoresImported: number;
  friendsImported: number;
  onContinue: () => void;
}

const formatHandicap = (h: number | null): string => {
  if (h === null || h === undefined) return '--';
  return h < 0 ? `+${Math.abs(h).toFixed(1)}` : h.toFixed(1);
};

const useCountUp = (target: number | null, durationMs = 1400, reduced = false): number | null => {
  const [val, setVal] = useState<number | null>(reduced ? target : target === null ? null : 0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) {
      setVal(null);
      return;
    }
    if (reduced) {
      setVal(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const to = target;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (to - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [target, durationMs, reduced]);

  return val;
};

export const WelcomeAboardScreen: React.FC<Props> = ({
  firstName,
  handicapIndex,
  homeClub,
  scoresImported,
  friendsImported,
  onContinue,
}) => {
  const reduced = usePrefersReducedMotion();
  const animated = useCountUp(handicapIndex, 1400, reduced);
  const displayIndex = animated === null ? '--' : formatHandicap(Number(animated.toFixed(1)));

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ fontFamily: FONT, padding: '18px 0 8px', justifyContent: 'space-between' }}
    >
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
        {/* Top block */}
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: reduced ? 'none' : 'wcFadeUp 450ms ease 150ms both',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: GREEN,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              boxShadow: '0 8px 22px rgba(5,150,105,0.28)',
              animation: reduced ? 'none' : 'wcPopIn 500ms cubic-bezier(.34,1.56,.64,1) 250ms both',
            }}
          >
            <Check size={28} color="#fff" strokeWidth={3} />
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: GREEN,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Holed it
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, margin: 0, letterSpacing: '-0.02em' }}>
            Welcome aboard, {firstName}
          </h1>
          <p style={{ fontSize: 13.5, color: DIM, margin: '8px 0 0', lineHeight: 1.5, maxWidth: 300 }}>
            Your handicap now updates after every counting round.
          </p>
        </div>

        {/* Index hero card (the only dark element) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            background: 'linear-gradient(135deg, #15171F, #0F172A)',
            borderRadius: 20,
            padding: '22px 20px',
            color: '#fff',
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(15,23,42,0.22)',
            animation: reduced ? 'none' : 'wcFadeUp 450ms ease 400ms both',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 85% 15%, rgba(5,150,105,0.35), rgba(5,150,105,0) 60%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: '#34D399',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                Handicap index
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(52,211,153,0.14)',
                  color: '#34D399',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.10em',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#34D399',
                    animation: reduced ? 'none' : 'wcDotPulse 1.4s ease-in-out infinite',
                  }}
                />
                LIVE
              </div>
            </div>

            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 1.05,
                fontVariantNumeric: 'tabular-nums',
                marginTop: 8,
              }}
            >
              {displayIndex}
            </div>
            {homeClub && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                at {homeClub}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            animation: reduced ? 'none' : 'wcFadeUp 450ms ease 600ms both',
          }}
        >
          {[
            { val: scoresImported, label: 'Rounds imported' },
            { val: friendsImported, label: 'Friends found' },
          ].map((t) => (
            <div
              key={t.label}
              style={{
                background: '#fff',
                border: `1px solid ${HAIR}`,
                borderRadius: 16,
                padding: '16px 14px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 27,
                  fontWeight: 800,
                  color: INK,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  marginBottom: 6,
                }}
              >
                {t.val}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: DIM,
                  letterSpacing: '0.06em',
                }}
              >
                {t.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 0 8px' }}>
        <button
          onClick={() => onContinue()}
          style={{
            width: '100%',
            minHeight: 56,
            borderRadius: 16,
            background: INK,
            color: '#fff',
            border: 'none',
            fontFamily: FONT,
            fontSize: 16.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 8px 22px rgba(15,23,42,0.22)',
          }}
        >
          View my handicap
          <ArrowRight size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
};

export default WelcomeAboardScreen;
