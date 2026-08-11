import React from 'react';
import { useTranslation } from 'react-i18next';
import { MUTE, DIM, CAPTION, LABEL } from './designTokens';
import { PrimaryButton, Action, FooterBar, FlowBody, FlowHead, Panel } from './Primitives';
import ParRings from './ParRings';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
}

/**
 * SCREEN 1 - INTRO. Federation-neutral: no governing body is named here.
 *
 * The evidence is the ANALYTICS, not the admin: three par-type rings, the same
 * shape screen 5 delivers with the member's own figures.
 *
 * THESE FIGURES ARE HARDCODED, SYNTHETIC AND LABELLED AS AN EXAMPLE. They are
 * not a real member's record and must never be dressed as the viewer's own.
 */
const EXAMPLE = {
  par3: { value: 0.48, holes: 932 },
  par4: { value: 0.71, holes: 2098 },
  par5: { value: 0.34, holes: 864 },
  rounds: 233,
};

export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline }) => {
  const { t } = useTranslation('handicap');

  return (
    <>
      <FlowBody>
        <FlowHead
          headline={t('whsConnect.intro.headline')}
          sub={t('whsConnect.intro.sub')}
        />

        <div style={{ marginTop: 22 }}>
          <Panel>
            <div style={{ ...LABEL, marginBottom: 6 }}>{t('whsConnect.rings.label')}</div>
            <div style={{ ...CAPTION, color: MUTE, marginBottom: 16 }}>
              {t('whsConnect.rings.caption')}
            </div>
            <ParRings
              par3={EXAMPLE.par3}
              par4={EXAMPLE.par4}
              par5={EXAMPLE.par5}
              size={86}
              labels={{
                par3: t('whsConnect.rings.par3'),
                par4: t('whsConnect.rings.par4'),
                par5: t('whsConnect.rings.par5'),
              }}
              holesLabel={(n) => t('whsConnect.rings.holes', { n })}
            />
            <div style={{ ...LABEL, fontSize: 7, color: DIM, marginTop: 16 }}>
              {t('whsConnect.rings.example', { rounds: EXAMPLE.rounds })}
            </div>
          </Panel>
        </div>
        <div style={{ height: 24 }} />
      </FlowBody>

      <FooterBar>
        <PrimaryButton onClick={onPickCountry}>{t('whsConnect.intro.cta')}</PrimaryButton>
        {onDecline ? (
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
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
