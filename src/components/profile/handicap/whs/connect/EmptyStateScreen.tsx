import React from 'react';
import { useTranslation } from 'react-i18next';
import { MUTE, DIM, GOOD, LABEL_LG, CAPTION } from './designTokens';
import { PrimaryButton, Action, FooterBar, Stage, StageHead } from './Primitives';
import ParRings from './ParRings';
import { useRingSize } from './useRingSize';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
}

/**
 * STAGE 1 - INTRO. Federation-neutral: no governing body is named here.
 *
 * Full bleed. The rings are NOT in a card - they are the screen's evidence,
 * painted straight onto SURFACE at display size, the same shape stage 'done'
 * delivers with the member's own figures.
 *
 * THESE FIGURES ARE HARDCODED, SYNTHETIC AND LABELLED AS AN EXAMPLE. They are
 * not a real member's record and must never be dressed as the viewer's own.
 */
const EXAMPLE = {
  par3: { value: 0.48, holes: 664 },
  par4: { value: 0.71, holes: 1328 },
  par5: { value: 0.34, holes: 664 },
  rounds: 148,
};

export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline }) => {
  const { t } = useTranslation('handicap');
  const ringSize = useRingSize();

  return (
    <>
      <Stage>
        <StageHead
          kicker={t('whsConnect.intro.kicker')}
          headline={t('whsConnect.intro.headline')}
          lead={t('whsConnect.intro.sub')}
        />

        <div style={{ marginTop: 40 }}>
          <div style={{ ...LABEL_LG, marginBottom: 6 }}>{t('whsConnect.rings.label')}</div>
          <div style={{ ...CAPTION, color: MUTE, marginBottom: 22 }}>
            {t('whsConnect.rings.caption')}
          </div>
          <ParRings
            par3={EXAMPLE.par3}
            par4={EXAMPLE.par4}
            par5={EXAMPLE.par5}
            size={ringSize}
            labels={{
              par3: t('whsConnect.rings.par3'),
              par4: t('whsConnect.rings.par4'),
              par5: t('whsConnect.rings.par5'),
            }}
            holesLabel={(n) => t('whsConnect.rings.holes', { n })}
          />
          <div style={{ ...LABEL_LG, fontSize: 11, color: DIM, marginTop: 22 }}>
            {t('whsConnect.rings.example', { rounds: EXAMPLE.rounds })}
          </div>
        </div>
        <div style={{ height: 28 }} />
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
