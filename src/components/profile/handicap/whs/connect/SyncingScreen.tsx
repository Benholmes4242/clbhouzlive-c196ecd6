import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { CANVAS, INK, MUTE, BORDER, STEP_WAIT_RING, STEP_WAIT_INK } from './designTokens';
import { Stage, StageHead } from './Primitives';

/**
 * STAGE 4 - SYNCING. NO PROGRESS RING, NO FIGURE.
 *
 * connect-whs is ONE synchronous call that returns only when the import is
 * finished - it streams nothing back, and the connection row (and therefore
 * whs_imported_counts) does not exist until it resolves. So there is NO real
 * rounds-so-far figure, and a fabricated one on this screen would be the worst
 * possible place for one. There is therefore no figure slot at all.
 *
 * THE STEP TIMER IS COSMETIC AND ONE-WAY. It advances through the steps once,
 * on widening delays, then holds on the last step until the screen unmounts.
 * It never wraps, resets or decreases. We cannot know which step the server
 * has reached, so marks are white, never green. THE SCREEN ENDS WHEN
 * callConnectWhs RESOLVES, never on the timer.
 */
const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const;
/** Delay before advancing to step 2, 3 and 4. */
const STEP_DELAYS_MS = [1500, 4000, 9000] as const;
const LAST = STEP_KEYS.length - 1;

const MARK: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: 999,
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
};

export const SyncingScreen: React.FC = () => {
  const { t } = useTranslation('handicap');
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    STEP_DELAYS_MS.forEach((delay, i) => {
      elapsed += delay;
      const target = Math.min(i + 1, LAST);
      ids.push(setTimeout(() => setCurrent((p) => Math.max(p, target)), elapsed));
    });
    return () => ids.forEach(clearTimeout);
  }, []);

  return (
    <Stage>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .whs-sync-spinner { animation: none !important; }
        }
      `}</style>
      <StageHead
        kicker={t('whsConnect.steps.sync')}
        headline={t('whsConnect.sync.headline')}
        lead={t('whsConnect.sync.sub')}
      />

      <div style={{ marginTop: 40, paddingBottom: 28 }}>
        {STEP_KEYS.map((key, i) => {
          const passed = i < current;
          const isCurrent = i === current;
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: i === 0 ? '0 0 16px' : '16px 0',
                borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
              }}
            >
              {passed ? (
                <span style={{ ...MARK, background: INK }}>
                  <Check size={11} strokeWidth={3.4} color={CANVAS} />
                </span>
              ) : isCurrent ? (
                <span style={MARK}>
                  <svg width="100%" height="100%" viewBox="0 0 18 18" aria-hidden="true">
                    <circle
                      className="whs-sync-spinner"
                      cx={9}
                      cy={9}
                      r={7.6}
                      fill="none"
                      stroke={INK}
                      strokeWidth={1.9}
                      strokeLinecap="round"
                      strokeDasharray="15 33"
                      style={{ animation: 'spin 1.05s linear infinite', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                </span>
              ) : (
                <span style={{ ...MARK, border: `1.5px solid ${STEP_WAIT_RING}` }} />
              )}
              <span
                style={{
                  fontSize: 15,
                  fontWeight: isCurrent ? 700 : 400,
                  letterSpacing: '-0.01em',
                  color: isCurrent ? INK : passed ? MUTE : STEP_WAIT_INK,
                }}
              >
                {t(`whsConnect.sync.${key}`)}
              </span>
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

export default SyncingScreen;
