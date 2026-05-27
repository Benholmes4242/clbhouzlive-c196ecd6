import React from 'react';

const AMBER = '#F7931E';

const SQUIRCLE_MASK_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 0h20c22.091 0 40 17.909 40 40v20c0 22.091-17.909 40-40 40H40C17.909 100 0 82.091 0 60V40C0 17.909 17.909 0 40 0z'/%3E%3C/svg%3E\")";

const squircleMaskStyle: React.CSSProperties = {
  WebkitMaskImage: SQUIRCLE_MASK_URL,
  maskImage: SQUIRCLE_MASK_URL,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

interface ChampionsYourStandingCardProps {
  displayName: string;
  photoUrl: string | null;
  titlesHeld: number;
  totalCategories: number;
  bestRank: number | null;
  yourRounds: number;
  yourBest: number | null;
}

export const ChampionsYourStandingCard: React.FC<ChampionsYourStandingCardProps> = ({
  displayName,
  photoUrl,
  titlesHeld,
  totalCategories,
  bestRank,
  yourRounds,
  yourBest,
}) => {
  const metaParts: string[] = [];
  metaParts.push(`${titlesHeld} of ${totalCategories} titles`);
  if (yourRounds > 0) metaParts.push(`${yourRounds} rounds`);
  if (yourBest != null) metaParts.push(`Best ${yourBest}`);
  const meta = metaParts.join(' · ');

  const cardBg = 'var(--hcp-champ-wash, #FFF8EA)';
  const cardBorder = 'var(--hcp-champ-wash-border, rgba(247,147,30,0.30))';

  return (
    <div
      style={{
        margin: '14px 16px 16px',
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        position: 'relative',
      }}
    >
      <div style={{ width: 80, height: 80, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: AMBER, ...squircleMaskStyle }} aria-hidden />
        <div
          style={{
            position: 'absolute',
            inset: 1.5,
            background: photoUrl
              ? `url(${photoUrl}) center/cover`
              : 'linear-gradient(135deg, #6b7280 0%, #94a3b8 100%)',
            ...squircleMaskStyle,
          }}
          aria-hidden
        />
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            minWidth: 28,
            height: 22,
            padding: '0 6px',
            background: 'linear-gradient(135deg, #FBBC2E 0%, #F7931E 100%)',
            border: `2px solid ${cardBg}`,
            borderRadius: 11,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
            color: '#1A1300',
            fontFamily: 'Geist Mono, monospace',
            letterSpacing: '-0.02em',
            zIndex: 2,
          }}
        >
          {titlesHeld}/{totalCategories}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: 'var(--hcp-accent-celebrate, #C97211)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          👤 Your standing
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--hcp-accent-celebrate, #C97211)',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displayName}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--hcp-t-60, #64748b)',
            fontWeight: 600,
            letterSpacing: '-0.005em',
          }}
        >
          {meta}
        </div>
      </div>

      {bestRank != null && (
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 200,
              color: 'var(--hcp-accent-celebrate, #C97211)',
              letterSpacing: '-0.030em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            #{bestRank}
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: 'var(--hcp-t-60, #94a3b8)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 800,
              marginTop: 4,
            }}
          >
            Best rank
          </div>
        </div>
      )}
    </div>
  );
};

export default ChampionsYourStandingCard;
