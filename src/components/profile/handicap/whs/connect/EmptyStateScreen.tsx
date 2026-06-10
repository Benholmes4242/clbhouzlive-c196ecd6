import React from 'react';
import { ChevronRight } from 'lucide-react';

const INK = '#0F172A';
const INK_55 = '#64748B';
const AMBER = '#F7931E';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  onPickCountry: () => void;
  onWhyConnect?: () => void;
}

const HeroArt: React.FC = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
    <defs>
      <radialGradient id="globe-grad" cx="0.35" cy="0.30" r="0.75">
        <stop offset="0%" stopColor="#FFE5C2"/>
        <stop offset="60%" stopColor="#F7931E"/>
        <stop offset="100%" stopColor="#C97211"/>
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="108" rx="32" ry="4" fill="rgba(15,23,42,0.12)" />
    <circle cx="60" cy="58" r="42" fill="url(#globe-grad)" stroke="rgba(15,23,42,0.55)" strokeWidth="2" />
    <ellipse cx="60" cy="58" rx="42" ry="14" fill="none" stroke="rgba(15,23,42,0.40)" strokeWidth="1" />
    <ellipse cx="60" cy="58" rx="22" ry="42" fill="none" stroke="rgba(15,23,42,0.40)" strokeWidth="1" />
    <line x1="18" y1="58" x2="102" y2="58" stroke="rgba(15,23,42,0.40)" strokeWidth="1" />
    <line x1="60" y1="16" x2="60" y2="-2" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
    <path d="M 60 0 L 78 4 L 60 8 Z" fill={AMBER} stroke="#0F172A" strokeWidth="1.5" strokeLinejoin="round" />
    <ellipse cx="48" cy="42" rx="8" ry="6" fill="rgba(255,255,255,0.30)" />
  </svg>
);

export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onWhyConnect }) => {
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
        <HeroArt />
      </div>

      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: INK,
          lineHeight: 1.15,
          margin: '0 0 10px',
          maxWidth: 280,
        }}
      >
        Connect your handicap
      </h2>

      <p
        style={{
          fontSize: 14,
          color: INK_55,
          lineHeight: 1.5,
          margin: '0 0 28px',
          maxWidth: 290,
        }}
      >
        Track every round, see your index move in real time, and play against friends — wherever you golf.
      </p>

      <button
        type="button"
        onClick={onPickCountry}
        style={{
          width: '100%',
          maxWidth: 320,
          borderRadius: 16,
          border: '1px solid rgba(15,23,42,0.10)',
          background: '#fff',
          padding: '14px 14px 14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          fontFamily: FONT,
          textAlign: 'left',
          marginBottom: onWhyConnect ? 16 : 0,
        }}
      >
        <div
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(247,147,30,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10" r="3" />
            <path d="M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 9.5, fontWeight: 800,
            color: INK_55, letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 2,
          }}>
            START HERE
          </div>
          <div style={{
            fontSize: 15, fontWeight: 700,
            color: INK, letterSpacing: '-0.01em',
          }}>
            Select your country
          </div>
        </div>
        <ChevronRight size={20} color="rgba(15,23,42,0.40)" strokeWidth={2} />
      </button>

      {onWhyConnect && (
        <button
          type="button"
          onClick={onWhyConnect}
          style={{
            fontSize: 13, color: INK_55, fontWeight: 500,
            cursor: 'pointer', border: 'none',
            background: 'transparent', fontFamily: FONT,
            textDecoration: 'underline',
            textDecorationColor: 'rgba(100,116,139,0.40)',
            textUnderlineOffset: 3,
          }}
        >
          Why connect?
        </button>
      )}
    </div>
  );
};

export default EmptyStateScreen;
