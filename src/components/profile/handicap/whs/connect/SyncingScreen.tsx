import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { CANVAS, INK, MUTE, DIM, BORDER, TRACK, GOOD, LABEL_LG } from './designTokens';
import { Stage, StageHead } from './Primitives';

/**
 * STAGE 4 - SYNCING. NO RING, no spinner, NO FIGURE.
 *
 * connect-whs is ONE synchronous call that returns only when the import is
 * finished - it streams nothing back, and the connection row (and therefore
 * whs_imported_counts) does not exist until it resolves. So there is NO real
 * rounds-so-far figure, and a fabricated one on this screen would be the worst
 * possible place for one. There is therefore no figure slot at all.
 *
 * THE STEP TIMER IS COSMETIC. It loops, and the caption says plainly that the
 * steps are what the server is doing in order - we cannot know which one it has
 * reached. THE SCREEN ENDS WHEN callConnectWhs RESOLVES, never on the timer.
 */
const STEP_MS = 1400;
const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const;

export const SyncingScreen: React.FC = () => {
  const { t } = useTranslation('handicap');
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((p) => (p + 1) % STEP_KEYS.length), STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <Stage>
      <StageHead
        kicker={t('whsConnect.sync.kicker')}
        kickerColor={GOOD}
        headline={t('whsConnect.sync.headline')}
        lead={t('whsConnect.sync.sub')}
      />

      <div style={{ marginTop: 40 }}>
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
              <span
                style={{
                  width: 17,
                  height: 17,
                  borderRadius: 999,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: passed ? GOOD : 'transparent',
                  border: passed ? 'none' : `1.5px solid ${isCurrent ? GOOD : TRACK}`,
                  transition: 'background 200ms ease, border-color 200ms ease',
                }}
              >
                {passed ? <Check size={10} strokeWidth={3.2} color={CANVAS} /> : null}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: isCurrent ? 700 : 400,
                  letterSpacing: '-0.01em',
                  color: passed || isCurrent ? INK : MUTE,
                }}
              >
                {t(`whsConnect.sync.${key}`)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ ...LABEL_LG, color: DIM, marginTop: 22, paddingBottom: 28 }}>
        {t('whsConnect.sync.note')}
      </div>
    </Stage>
  );
};

export default SyncingScreen;
