import React from 'react';
import type { WhsCountry } from '@/lib/whs/whsCountries';
import { MUTE, H1, H1_SUB, CAPTION } from './designTokens';
import { Panel, PrimaryButton, FooterBar, CopyBlock } from './Primitives';

interface Props {
  country: WhsCountry;
  /** @deprecated kept for backwards compat, no longer invoked */
  onNotifyMe?: (country: WhsCountry) => void;
  onChangeCountry: () => void;
}

export const ComingSoonScreen: React.FC<Props> = ({ country, onChangeCountry }) => (
  <>
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px' }}>
      <CopyBlock kicker={country.body}>
        <h1 style={{ ...H1, fontSize: 21 }}>{country.name} is not open yet</h1>
        <p style={H1_SUB}>
          {country.body} has not opened an API we can read from. England Golf is the one live
          federation today.
        </p>
      </CopyBlock>

      <Panel kicker="What you can still do">
        <div style={{ ...CAPTION, color: MUTE }}>
          You can post rounds by hand, and everything else on clbhouz works exactly the same. If
          you also hold an England Golf membership, connect that instead.
        </div>
      </Panel>
    </div>

    <FooterBar>
      <PrimaryButton onClick={onChangeCountry}>Choose a different country</PrimaryButton>
    </FooterBar>
  </>
);

export default ComingSoonScreen;
