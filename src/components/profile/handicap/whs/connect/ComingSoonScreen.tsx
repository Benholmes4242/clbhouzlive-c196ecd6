import React from 'react';
import type { WhsCountry } from '@/lib/whs/whsCountries';
import { CAPTION, DIM } from './designTokens';
import { PrimaryButton, FooterBar, Stage, StageHead } from './Primitives';

interface Props {
  country: WhsCountry;
  /** @deprecated no notify mechanism exists, so this is never invoked. */
  onNotifyMe?: (country: WhsCountry) => void;
  onChangeCountry: () => void;
}

/**
 * STAGE 3b - NOT YET OPEN.
 *
 * Honest dead end. There is NO notify-me mechanism in the app (no table, no
 * edge function, no mailing list), so this screen does not offer to tell the
 * member when the federation goes live. It also does not offer manual round
 * entry - the app has never supported it.
 */
export const ComingSoonScreen: React.FC<Props> = ({ country, onChangeCountry }) => (
  <>
    <Stage>
      <StageHead
        small
        kicker="Coming soon"
        headline={`${country.name} is not open yet.`}
        lead={`${country.body} has to open an API before we can read your record. When it does, it appears in the list here.`}
      />

      <div style={{ ...CAPTION, color: DIM, marginTop: 30, paddingBottom: 28 }}>
        Nothing to sign up for. If you also hold a membership somewhere live, connect that instead.
      </div>
    </Stage>

    <FooterBar>
      <PrimaryButton onClick={onChangeCountry}>Choose another country</PrimaryButton>
    </FooterBar>
  </>
);

export default ComingSoonScreen;
