import React from 'react';
import { Sparkles } from 'lucide-react';
import { GAM } from '../../tokens';
import { relativeTime } from '@/lib/gam/visuals';
import { TierRow } from './TierRow';
import { FriendsBlock } from './FriendsBlock';
import { isShowpiece } from '../_shared/showpieces';
import { MATERIAL_PALETTES } from '../_shared/rarityPalette';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';

interface Props {
  item: Extract<TrophyItem, { kind: 'achievement' }>;
  viewerUserId: string;
}

const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: color ?? 'var(--hcp-t-60)',
      marginBottom: 8,
    }}
  >
    {children}
  </div>
);

export const AchievementBody: React.FC<Props> = ({ item, viewerUserId }) => {
  const next = item.nextThreshold;
  const current = item.currentValue ?? 0;
  const showProgress = !item.earned && next != null;
  const nextTier = item.tiers.find((t) => !t.earned);

  return (
    <div
      style={{
        padding: '16px 20px 18px',
        fontFamily: GAM.FONT_GEIST,
        color: 'var(--hcp-t-100)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 21,
            fontWeight: 900,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            margin: 0,
            color: 'var(--hcp-t-100)',
          }}
        >
          {item.name}
        </h2>
        <p
          style={{
            fontSize: 13.5,
            color: 'var(--hcp-t-60)',
            lineHeight: 1.45,
            margin: '8px 0 0',
          }}
        >
          {item.description}
        </p>
      </div>

      {showProgress && next != null && nextTier && (
        <div
          style={{
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line)',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <Eyebrow color={GAM.AMBER}>NEXT — {nextTier.name}</Eyebrow>
            <div style={{ fontSize: 11, color: 'var(--hcp-t-80)', fontWeight: 700, ...GAM.TABULAR }}>
              {current} / {next}
            </div>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--hcp-bg-2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.round((current / Math.max(1, next)) * 100))}%`,
                height: '100%',
                background: GAM.AMBER,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--hcp-t-60)', marginTop: 8 }}>
            <span style={{ color: GAM.AMBER, fontWeight: 800, ...GAM.TABULAR }}>{Math.max(0, next - current)}</span>{' '}
            to go
          </div>
        </div>
      )}

      {item.tiers.length > 1 && (
        <div>
          <Eyebrow>TIERS</Eyebrow>
          <div>
            {item.tiers.map((t) => (
              <TierRow key={t.tier} tier={t} metric={item.counterMetric} isShowpiece={isShowpiece(item.badgeId)} />
            ))}
          </div>
          <TierKey />
        </div>
      )}

      <FriendsBlock badgeId={item.badgeId} viewerUserId={viewerUserId} />

      {item.earned && item.earnedAt && item.tiers.length <= 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: GAM.AMBER,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <Sparkles size={12} />
          Earned {relativeTime(item.earnedAt)}
        </div>
      )}
    </div>
  );
};

const TierKey: React.FC = () => {
  const tiers = [1, 2, 3, 4, 5] as const;
  return (
    <div
      style={{
        marginTop: 14,
        padding: '12px 14px',
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--hcp-t-60)',
          lineHeight: 1.45,
          marginBottom: 10,
        }}
      >
        Tiered achievements climb through five materials as you progress:
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tiers.map((n) => {
          const p = MATERIAL_PALETTES[n];
          const name = p.label.charAt(0) + p.label.slice(1).toLowerCase();
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              {/* faceted gem swatch (rotated square w/ gradient + soft glow) */}
              <span
                aria-hidden
                style={{
                  width: 16,
                  height: 16,
                  background: `linear-gradient(135deg, ${p.color} 0%, ${p.color} 45%, ${p.border} 100%)`,
                  border: `1px solid ${p.border}`,
                  borderRadius: 4,
                  transform: 'rotate(45deg)',
                  flexShrink: 0,
                  boxShadow: `0 0 8px -1px ${p.color}`,
                }}
              />
              {/* name — fixed width so bars align */}
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--hcp-t-100)',
                  letterSpacing: '0.02em',
                  width: 72,
                  flexShrink: 0,
                }}
              >
                {name}
              </span>
              {/* material progress bar — fills proportionally to tier (1/5 .. 5/5) */}
              <span
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${(n / 5) * 100}%`,
                    background: p.color,
                    opacity: 0.9,
                    borderRadius: 2,
                  }}
                />
              </span>
              {/* level tag */}
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: 'var(--hcp-t-40)',
                  letterSpacing: '0.06em',
                  flexShrink: 0,
                  ...GAM.TABULAR,
                }}
              >
                LVL {n}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementBody;

