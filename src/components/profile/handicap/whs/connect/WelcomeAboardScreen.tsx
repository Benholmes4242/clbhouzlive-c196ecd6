import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const FIELD_FILL = '#F8FAFC';
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
  if (h === null || h === undefined) return '--';
  return h < 0 ? `+${Math.abs(h).toFixed(1)}` : h.toFixed(1);
};

export const WelcomeAboardScreen: React.FC<Props> = ({
  firstName,
  handicapIndex,
  homeClub,
  scoresImported,
  friendsImported,
  onContinue,
}) => {
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
      {/* Success medallion */}
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: '50%',
          background: GREEN,
          boxShadow: '0 8px 22px rgba(5,150,105,0.30)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Check size={38} color="#fff" strokeWidth={3} />
      </div>

      <h2
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.02em',
          margin: '0 0 18px',
        }}
      >
        Welcome aboard, {firstName}
      </h2>

      {/* Dark handicap card */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: INK,
          borderRadius: 18,
          padding: '22px 20px',
          color: '#fff',
          marginBottom: 14,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: GREEN,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Handicap index
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: homeClub ? 8 : 0,
          }}
        >
          {formatHandicap(handicapIndex)}
        </div>
        {homeClub && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>at {homeClub}</div>
        )}
      </div>

      {/* Stat tiles */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 18,
        }}
      >
        {[
          { val: scoresImported, label: scoresImported === 1 ? 'Round' : 'Rounds' },
          { val: friendsImported, label: friendsImported === 1 ? 'Friend' : 'Friends' },
        ].map((t) => (
          <div
            key={t.label}
            style={{
              background: FIELD_FILL,
              border: `1px solid ${HAIR}`,
              borderRadius: 14,
              padding: '14px 16px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: INK,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                marginBottom: 4,
              }}
            >
              {t.val}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: INK_45,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
              }}
            >
              {t.label}
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          fontSize: 13.5,
          color: INK_45,
          lineHeight: 1.5,
          margin: '0 0 18px',
          maxWidth: 300,
        }}
      >
        Everything is live. Your handicap updates automatically after every counting round.
      </p>

      <button
        onClick={onContinue}
        style={{
          width: '100%',
          maxWidth: 360,
          minHeight: 54,
          padding: '15px',
          borderRadius: 14,
          background: INK,
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
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
