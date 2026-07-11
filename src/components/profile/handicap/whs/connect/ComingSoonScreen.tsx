import React from 'react';
import { MiniFlag } from './MiniFlag';
import type { WhsCountry } from '@/lib/whs/whsCountries';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const FIELD_FILL = '#F8FAFC';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  country: WhsCountry;
  /** @deprecated kept for backwards compat, no longer invoked */
  onNotifyMe?: (country: WhsCountry) => void;
  onChangeCountry: () => void;
}

export const ComingSoonScreen: React.FC<Props> = ({ country, onChangeCountry }) => {
  const shell: React.CSSProperties = {
    background: '#fff',
    border: `1px solid ${HAIR}`,
    borderRadius: 16,
    padding: '32px 22px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    fontFamily: FONT,
  };

  const secondaryBtn = (
    <button
      type="button"
      onClick={onChangeCountry}
      style={{
        fontSize: 13,
        color: INK_45,
        fontWeight: 600,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 12px',
        fontFamily: FONT,
      }}
    >
      Choose a different country
    </button>
  );

  return (
    <div style={shell}>
      <div style={{ marginBottom: 18, transform: 'scale(1.4)' }}>
        <MiniFlag iso={country.iso} />
      </div>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          margin: '0 0 10px',
          maxWidth: 290,
        }}
      >
        {country.name} isn't supported yet
      </h2>

      <p
        style={{
          fontSize: 14,
          color: INK_45,
          lineHeight: 1.5,
          margin: '0 0 18px',
          maxWidth: 320,
        }}
      >
        England Golf is supported today. More federations are on the way. We'll add <strong style={{ color: INK, fontWeight: 700 }}>{country.body}</strong> as coverage expands.
      </p>

      <div style={{ marginTop: 6, background: FIELD_FILL, borderRadius: 8, padding: 0 }} />

      {secondaryBtn}
    </div>
  );
};

export default ComingSoonScreen;
