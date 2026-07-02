import React from 'react';
import { ArrowRight, Check, TrendingUp } from 'lucide-react';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const FIELD_FILL = '#F8FAFC';
const GREEN = '#059669';
const GREEN_TINT = 'rgba(5,150,105,0.16)';
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
        padding: '30px 22px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        fontFamily: FONT,
      }}
    >
      {/* Success mark: green check inside soft green ring */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: GREEN_TINT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: '50%',
            background: GREEN,
            boxShadow: '0 10px 24px rgba(5,150,105,0.30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={32} color="#fff" strokeWidth={3} />
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: GREEN,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        You're connected
      </div>

      <h2
        style={{
          fontSize: 25,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.02em',
          margin: '0 0 18px',
        }}
      >
        Welcome aboard, {firstName}
      </h2>

      {/* Hero handicap panel: charcoal gradient + green radial glow */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 360,
          background:
            'linear-gradient(160deg, #12141c 0%, #1c2030 100%)',
          borderRadius: 18,
          padding: '22px 22px 20px',
          color: '#fff',
          marginBottom: 14,
          textAlign: 'left',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(15,23,42,0.22)',
        }}
      >
        {/* radial glow */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            background:
              'radial-gradient(circle, rgba(5,150,105,0.35) 0%, rgba(5,150,105,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: '#34d399',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              Handicap index
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(52,211,153,0.16)',
                color: '#34d399',
                borderRadius: 999,
                padding: '3px 8px',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <TrendingUp size={11} strokeWidth={2.6} />
              Live
            </div>
          </div>

          <div
            style={{
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
              marginBottom: homeClub ? 10 : 0,
            }}
          >
            {formatHandicap(handicapIndex)}
          </div>
          {homeClub && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              at {homeClub}
            </div>
          )}
        </div>
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
        Everything's live. Your handicap updates automatically after every counting round.
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
