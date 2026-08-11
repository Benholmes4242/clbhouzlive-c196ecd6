import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { INK, MUTE, DIM, BORDER, TRACK, GOOD, LABEL } from './designTokens';
import { FlowBody, FlowHead } from './Primitives';

/**
 * SCREEN 4 - SYNCING. No spinner, NO FIGURE.
 *
 * connect-whs is ONE synchronous call that returns only when the whole import
 * is finished - it streams nothing back, and the connection row (and therefore
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
    <FlowBody>
      <FlowHead
        kicker={t('whsConnect.sync.kicker')}
        kickerColor={GOOD}
        size={27}
        headline={t('whsConnect.sync.headline')}
        sub={t('whsConnect.sync.sub')}
      />

      <div style={{ marginTop: 24 }}>
        {STEP_KEYS.map((key, i) => {
          const passed = i < current;
          const isCurrent = i === current;
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: i === 0 ? '0 0 13px' : '13px 0',
                borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
              }}
            >
              <span
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 999,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: passed ? GOOD : 'transparent',
                  border: passed
                    ? 'none'
                    : `1.5px solid ${isCurrent ? GOOD : TRACK}`,
                  transition: 'background 200ms ease, border-color 200ms ease',
                }}
              >
                {passed ? <Check size={9} strokeWidth={3.2} color="#FFF" /> : null}
              </span>
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: isCurrent ? 700 : 400,
                  color: passed || isCurrent ? INK : MUTE,
                }}
              >
                {t(`whsConnect.sync.${key}`)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ ...LABEL, color: DIM, marginTop: 18, paddingBottom: 24 }}>
        {t('whsConnect.sync.note')}
      </div>
    </FlowBody>
  );
};

export default SyncingScreen;
