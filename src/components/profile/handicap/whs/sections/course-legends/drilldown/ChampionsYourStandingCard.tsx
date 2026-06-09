import { GAM } from '../../../gam/tokens';
import React from 'react';


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
  if (yourRounds > 0) metaParts.push(`${yourRounds} rounds`);
  if (yourBest != null) metaParts.push(`Best gross ${yourBest}`);
  const meta = metaParts.join(' · ');

  return (
    <div
      style={{
        margin: '16px 18px',
        background: 'var(--hcp-champ-card-bg, linear-gradient(135deg, #FFFAEF, #FFF6E3))',
        border: '1px solid var(--hcp-champ-wash-border, rgba(247,147,30,0.22))',
        borderRadius: 16,
        padding: 18,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(247,147,30,0.10), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <div style={{ width: 64, height: 64, position: 'relative', flexShrink: 0 }} aria-hidden>
          <div style={{ position: 'absolute', inset: 0, background: GAM.AMBER, ...squircleMaskStyle }} />
          <div
            style={{
              position: 'absolute',
              inset: 1.5,
              background: photoUrl
                ? `url(${photoUrl}) center/cover`
                : 'linear-gradient(135deg, #6b7280 0%, #94a3b8 100%)',
              ...squircleMaskStyle,
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--hcp-t-100)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 5,
            }}
          >
            Your standing
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5, minWidth: 0 }}>
            <span
              style={{
                fontSize: 21,
                fontWeight: 800,
                color: 'var(--hcp-t-100)',
                letterSpacing: '-0.025em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--hcp-t-60)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {titlesHeld} of {totalCategories} titles
            </span>
          </div>
          {meta && (
            <div style={{ fontSize: 11.5, color: 'var(--hcp-t-60)', fontWeight: 500, letterSpacing: '-0.003em', fontVariantNumeric: 'tabular-nums' }}>
              {meta}
            </div>
          )}
        </div>

        {bestRank != null && (
          <div style={{ flexShrink: 0, textAlign: 'right', paddingLeft: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--hcp-t-100)', marginTop: 4, letterSpacing: '-0.02em' }}>#</span>
              <span style={{ fontSize: 38, fontWeight: 250, color: 'var(--hcp-t-100)', letterSpacing: '-0.04em', lineHeight: 0.85, fontVariantNumeric: 'tabular-nums' }}>
                {bestRank}
              </span>
            </div>
            <div style={{ fontSize: 8.5, color: 'var(--hcp-t-40)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800, marginTop: 2 }}>
              Best rank
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChampionsYourStandingCard;
