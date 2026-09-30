import React from 'react';
import { useTranslation } from 'react-i18next';
import { MUTE, DIM, INK, AMBER, NUM } from './designTokens';
import { PrimaryButton, Action, FooterBar, Stage } from './Primitives';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
}

const PROMISES = ['analyse', 'leaderboards', 'topTen', 'community'] as const;

/** Row hairline on the stage-1 canvas (brief-specified weight). */
const PROMISE_RULE = 'rgba(255,255,255,0.11)';

/**
 * STAGE 1 - INTRO (BRIEF_WHS_INTRO_CONNECT_ONCE). Federation-neutral: no
 * governing body, no country, no figure anywhere on this screen. It says what
 * connecting opens - four plain promises - and borrows nobody's data. The
 * rings live on stage 5, with the member's real figures.
 *
 * Painted on WASH by the flow container (stage 1 only). The rows are pushed to
 * the bottom with margin-top:auto so they sit on flat canvas below the fall.
 * Reads nothing: no query, no RPC.
 */
export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline }) => {
  const { t } = useTranslation('handicap');

  return (
    <>
      <Stage>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          <div style={{ height: 120, flexShrink: 0 }} />
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: AMBER,
              marginBottom: 14,
            }}
          >
            {t('whsConnect.intro.kicker')}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              color: INK,
            }}
          >
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{t('whsConnect.intro.headlineLine1')}</span>
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{t('whsConnect.intro.headlineLine2')}</span>
          </h1>

          <div style={{ marginTop: 'auto', paddingTop: 40, display: 'flex', flexDirection: 'column' }}>
            {PROMISES.map((key, i) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  padding: '16px 0',
                  borderTop: i === 0 ? undefined : `1px solid ${PROMISE_RULE}`,
                }}
              >
                <div
                  style={{
                    ...NUM,
                    width: 24,
                    flexShrink: 0,
                    paddingTop: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: AMBER,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: INK }}>
                    {t(`whsConnect.intro.promises.${key}.title`)}
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.42, color: DIM, marginTop: 3 }}>
                    {t(`whsConnect.intro.promises.${key}.line`)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Stage>

      <FooterBar>
        <PrimaryButton onClick={onPickCountry}>{t('whsConnect.intro.cta')}</PrimaryButton>
        {onDecline ? (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Action onClick={onDecline} color={MUTE}>
              {t('whsConnect.intro.decline')}
            </Action>
          </div>
        ) : null}
      </FooterBar>
    </>
  );
};

export default EmptyStateScreen;
