import React from 'react';
import { ArrowRight } from 'lucide-react';

const INK = '#0F172A';
const INK_55 = '#64748B';
const AMBER = '#F7931E';
const GREEN = '#059669';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  firstName: string;
  handicapIndex: number | null;
  homeClub: string | null;
  scoresImported: number;
  friendsImported: number;
  onContinue: () => void;
}

const formatHandicap = (h: number | null): string => {
  if (h === null || h === undefined) return '—';
  return h < 0 ? `+${Math.abs(h).toFixed(1)}` : h.toFixed(1);
};

const SuccessBadge: React.FC = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" aria-hidden>
    <defs>
      <linearGradient id="check-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor={GREEN} />
      </linearGradient>
    </defs>
    <g stroke={GREEN} strokeWidth="2" strokeLinecap="round" opacity="0.5">
      <line x1="50" y1="6" x2="50" y2="12">
        <animate attributeName="opacity" values="0;0.5;0" dur="1.2s" begin="0s" repeatCount="indefinite" />
      </line>
      <line x1="78" y1="14" x2="74" y2="20">
        <animate attributeName="opacity" values="0;0.5;0" dur="1.2s" begin="0.15s" repeatCount="indefinite" />
      </line>
      <line x1="94" y1="50" x2="86" y2="50">
        <animate attributeName="opacity" values="0;0.5;0" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
      </line>
      <line x1="78" y1="86" x2="74" y2="80">
        <animate attributeName="opacity" values="0;0.5;0" dur="1.2s" begin="0.45s" repeatCount="indefinite" />
      </line>
      <line x1="50" y1="94" x2="50" y2="88">
        <animate attributeName="opacity" values="0;0.5;0" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
      </line>
      <line x1="22" y1="86" x2="26" y2="80">
        <animate attributeName="opacity" values="0;0.5;0" dur="1.2s" begin="0.75s" repeatCount="indefinite" />
      </line>
      <line x1="6" y1="50" x2="14" y2="50">
        <animate attributeName="opacity" values="0;0.5;0" dur="1.2s" begin="0.9s" repeatCount="indefinite" />
      </line>
      <line x1="22" y1="14" x2="26" y2="20">
        <animate attributeName="opacity" values="0;0.5;0" dur="1.2s" begin="1.05s" repeatCount="indefinite" />
      </line>
    </g>
    <circle cx="50" cy="50" r="40" fill="rgba(5,150,105,0.10)" />
    <circle cx="50" cy="50" r="30" fill="rgba(5,150,105,0.18)" />
    <circle cx="50" cy="50" r="22" fill="url(#check-grad)" />
    <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    <ellipse cx="44" cy="42" rx="6" ry="4" fill="rgba(255,255,255,0.30)" />
    <polyline points="40,50 47,57 60,44"
      stroke="#fff" strokeWidth="3.5"
      strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export const WelcomeAboardScreen: React.FC<Props> = ({
  firstName, handicapIndex, homeClub,
  scoresImported, friendsImported, onContinue,
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '36px 24px 28px',
        textAlign: 'center',
        fontFamily: FONT,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <SuccessBadge />
      </div>

      <h2
        style={{
          fontSize: 24, fontWeight: 800, color: INK_ON_DARK,
          letterSpacing: '-0.02em',
          margin: '0 0 14px',
        }}
      >
        Welcome aboard, {firstName}
      </h2>

      <div
        style={{
          width: '100%', maxWidth: 320,
          background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 18,
          padding: '22px 20px',
          color: '#fff',
          marginBottom: 18,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 90% 20%, rgba(247,147,30,0.16), transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{
          position: 'relative', zIndex: 1,
          fontSize: 9.5, fontWeight: 800, color: AMBER,
          letterSpacing: '0.16em', marginBottom: 6,
        }}>
          HANDICAP INDEX
        </div>
        <div style={{
          position: 'relative', zIndex: 1,
          fontSize: 56, fontWeight: 800,
          lineHeight: 1, letterSpacing: '-0.04em',
          marginBottom: 6,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatHandicap(handicapIndex)}
        </div>
        {homeClub && (
          <div style={{
            position: 'relative', zIndex: 1,
            fontSize: 13, color: 'rgba(255,255,255,0.65)',
          }}>
            at {homeClub}
          </div>
        )}
      </div>

      <div style={{
        width: '100%', maxWidth: 320,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 22,
      }}>
        <div style={{
          background: '#fff',
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 12,
          padding: '12px 14px',
          textAlign: 'left',
        }}>
          <div style={{
            fontSize: 22, fontWeight: 800, color: INK,
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            marginBottom: 2,
          }}>
            {scoresImported}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: INK_55,
            letterSpacing: '0.10em', textTransform: 'uppercase',
          }}>
            {scoresImported === 1 ? 'ROUND' : 'ROUNDS'}
          </div>
        </div>
        <div style={{
          background: '#fff',
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 12,
          padding: '12px 14px',
          textAlign: 'left',
        }}>
          <div style={{
            fontSize: 22, fontWeight: 800, color: INK,
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            marginBottom: 2,
          }}>
            {friendsImported}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: INK_55,
            letterSpacing: '0.10em', textTransform: 'uppercase',
          }}>
            {friendsImported === 1 ? 'FRIEND' : 'FRIENDS'}
          </div>
        </div>
      </div>

      <p style={{
        fontSize: 13.5, color: MUTED_ON_DARK, lineHeight: 1.5,
        margin: '0 0 22px', maxWidth: 290,
      }}>
        Everything's live — your handicap will update automatically after every counting round.
      </p>

      <button
        onClick={onContinue}
        style={{
          width: '100%', maxWidth: 320,
          padding: '14px', borderRadius: 999,
          background: 'linear-gradient(180deg, #FBA738 0%, #F7931E 100%)',
          color: '#fff', fontSize: 15, fontWeight: 700,
          border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          gap: 8,
          boxShadow: '0 4px 16px rgba(247,147,30,0.28)',
          fontFamily: FONT,
        }}
      >
        View my handicap
        <ArrowRight size={18} strokeWidth={2.4} />
      </button>
    </div>
  );
};

export default WelcomeAboardScreen;
