import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WhsCountry } from '@/lib/whs/whsCountries';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { CAPTION, DIM, MUTE, FONT } from './designTokens';
import { PrimaryButton, FooterBar, Stage, StageHead } from './Primitives';
import { useHandicapWaitlist } from './useHandicapWaitlist';
import { WaitlistState } from './WaitlistToggle';

interface Props {
  country: WhsCountry;
  onChangeCountry: () => void;
}

/**
 * STAGE 3b - NOT YET OPEN.
 *
 * A waitlist table exists (public.handicap_authority_waitlist) and this screen
 * writes to it through the same Count me in / Waiting toggle as the country
 * rows. There is still no send - no job, no edge function, no template - so the
 * screen promises no email. It also does not offer manual round entry - the
 * app has never supported it.
 */
export const ComingSoonScreen: React.FC<Props> = ({ country, onChangeCountry }) => {
  const { t } = useTranslation('handicap');
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const { joined, counts, join, leave } = useHandicapWaitlist(userId);
  const isJoined = joined.has(country.id);
  const n = counts[country.id];
  return (
  <>
    <Stage>
      <StageHead
        small
        kicker={t('whsConnect.steps.comingSoon', { country: country.name })}
        headline={`${country.name} is not open yet.`}
        lead={`${country.body} has to open an API before we can read your record. When it does, it appears in the list here.`}
      />

      <div style={{ ...CAPTION, color: DIM, marginTop: 30, paddingBottom: 28 }}>
        Nothing to sign up for. If you also hold a membership somewhere live, connect that instead.
      </div>
    </Stage>

    <FooterBar>
      <button
        type="button"
        disabled={!userId}
        aria-pressed={isJoined}
        onClick={() => (isJoined ? leave(country) : join(country))}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          padding: '13px 0',
          marginBottom: 8,
          background: 'none',
          border: 0,
          cursor: userId ? 'pointer' : 'default',
          fontFamily: FONT,
        }}
      >
        <WaitlistState joined={isJoined} />
        {n !== undefined ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: MUTE, fontVariantNumeric: 'tabular-nums lining-nums' }}>
            {`${n} waiting`}
          </span>
        ) : null}
      </button>
      <PrimaryButton onClick={onChangeCountry}>Choose another country</PrimaryButton>
    </FooterBar>
  </>
  );
};

export default ComingSoonScreen;
