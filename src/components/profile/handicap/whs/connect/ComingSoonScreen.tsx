import React from 'react';
import type { WhsCountry } from '@/lib/whs/whsCountries';
import { H1, H1_SUB, CAPTION, DIM } from './designTokens';
import { PrimaryButton, FooterBar, CopyBlock } from './Primitives';

interface Props {
  country: WhsCountry;
  /** @deprecated no notify mechanism exists, so this is never invoked. */
  onNotifyMe?: (country: WhsCountry) => void;
  onChangeCountry: () => void;
}

/**
 * SCREEN 3b - NOT YET OPEN.
 *
 * Honest dead end. There is NO notify-me mechanism in the app (no table, no
 * edge function, no mailing list), so this screen does not offer to tell the
 * member when the federation goes live. It also does not offer manual round
 * entry - the app has never supported it.
 */
export const ComingSoonScreen: React.FC<Props> = ({ country, onChangeCountry }) => (
  <>
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 16px 20px' }}>
      <CopyBlock kicker={country.body}>
        <h1 style={{ ...H1, fontSize: 26, letterSpacing: '-0.03em' }}>
          {country.name} is not open yet
        </h1>
        <p style={{ ...H1_SUB, fontSize: 14.5, fontWeight: 500 }}>
          {country.body} has not opened an API we can read from. When it does, it appears in the
          list here.
        </p>
      </CopyBlock>

      <div style={{ ...CAPTION, color: DIM, padding: '0 4px' }}>
        Nothing to sign up for. If you also hold a membership somewhere live, connect that instead.
      </div>
    </div>

    <FooterBar>
      <PrimaryButton onClick={onChangeCountry}>Choose a different country</PrimaryButton>
    </FooterBar>
  </>
);

export default ComingSoonScreen;
