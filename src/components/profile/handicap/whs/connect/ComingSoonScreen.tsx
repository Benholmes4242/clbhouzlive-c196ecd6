import React from 'react';
import { Mail } from 'lucide-react';
import { MiniFlag } from './MiniFlag';
import type { WhsCountry } from '@/lib/whs/whsCountries';

const INK = '#0F172A';
const INK_55 = '#64748B';
const AMBER = '#F7931E';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  country: WhsCountry;
  onNotifyMe: (country: WhsCountry) => void;
  onChangeCountry: () => void;
}

const ComingSoonArt: React.FC<{ iso: string }> = ({ iso }) => (
  <svg width="110" height="110" viewBox="0 0 110 110" fill="none" aria-hidden>
    <ellipse cx="55" cy="100" rx="28" ry="3" fill="rgba(15,23,42,0.10)" />
    <line x1="35" y1="14" x2="35" y2="98" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    <defs>
      <clipPath id="flag-triangle">
        <path d="M 35 16 L 84 24 L 35 36 Z" />
      </clipPath>
    </defs>
    <g clipPath="url(#flag-triangle)">
      <foreignObject x="35" y="14" width="50" height="24">
        {/* @ts-ignore xmlns is required on foreignObject children */}
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%' }}>
          <MiniFlag iso={iso} />
        </div>
      </foreignObject>
    </g>
    <path d="M 35 16 L 84 24 L 35 36 Z" fill="none" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M 18 98 Q 55 86 92 98 Z" fill={INK} opacity="0.85" />
    <circle cx="78" cy="78" r="14" fill={AMBER} stroke="#fff" strokeWidth="2" />
    <line x1="78" y1="78" x2="78" y2="72" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <line x1="78" y1="78" x2="82" y2="80" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ComingSoonScreen: React.FC<Props> = ({ country, onNotifyMe, onChangeCountry }) => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px 36px',
        textAlign: 'center',
        fontFamily: FONT,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <ComingSoonArt iso={country.iso} />
      </div>

      <h2 style={{
        fontSize: 24, fontWeight: 800, color: INK,
        letterSpacing: '-0.02em', lineHeight: 1.15,
        margin: '0 0 10px',
      }}>
        Coming soon
      </h2>

      <p style={{
        fontSize: 14, color: INK_55, lineHeight: 1.5,
        margin: '0 0 28px', maxWidth: 290,
      }}>
        We're working with <strong style={{ color: INK }}>{country.body}</strong> to bring your handicap to clbhouz. Want a heads-up when it's ready?
      </p>

      <button
        type="button"
        onClick={() => onNotifyMe(country)}
        style={{
          width: '100%', maxWidth: 320,
          padding: '14px', borderRadius: 999,
          background: 'linear-gradient(180deg, #FBA738 0%, #F7931E 100%)',
          color: '#fff', fontSize: 15, fontWeight: 700,
          border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          gap: 8,
          boxShadow: '0 4px 16px rgba(247,147,30,0.28)',
          marginBottom: 14,
          fontFamily: FONT,
        }}
      >
        <Mail size={18} strokeWidth={2.3} />
        Notify me when ready
      </button>

      <button
        type="button"
        onClick={onChangeCountry}
        style={{
          fontSize: 13, color: INK_55, fontWeight: 500,
          background: 'transparent', border: 'none', cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationColor: 'rgba(15,23,42,0.20)',
          textUnderlineOffset: 3,
          fontFamily: FONT,
        }}
      >
        Pick a different country
      </button>
    </div>
  );
};

export default ComingSoonScreen;
