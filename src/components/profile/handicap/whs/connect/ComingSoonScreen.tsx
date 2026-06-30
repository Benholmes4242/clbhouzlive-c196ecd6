import React from 'react';
import { MiniFlag } from './MiniFlag';
import type { WhsCountry } from '@/lib/whs/whsCountries';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  country: WhsCountry;
  onNotifyMe: (country: WhsCountry) => void;
  onChangeCountry: () => void;
}

export const ComingSoonScreen: React.FC<Props> = ({ country, onNotifyMe, onChangeCountry }) => {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${HAIR}`,
        borderRadius: 16,
        padding: '32px 22px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        fontFamily: FONT,
      }}
    >
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
        {country.name} is coming soon
      </h2>

      <p
        style={{
          fontSize: 14,
          color: INK_45,
          lineHeight: 1.5,
          margin: '0 0 24px',
          maxWidth: 300,
        }}
      >
        We're working with <strong style={{ color: INK, fontWeight: 700 }}>{country.body}</strong> to bring your handicap to clbhouz. Want a heads-up when it's ready?
      </p>

      <button
        type="button"
        onClick={() => onNotifyMe(country)}
        style={{
          width: '100%',
          maxWidth: 360,
          minHeight: 52,
          padding: '14px',
          borderRadius: 14,
          background: INK,
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          fontFamily: FONT,
          marginBottom: 12,
        }}
      >
        Notify me when ready
      </button>

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
    </div>
  );
};

export default ComingSoonScreen;
