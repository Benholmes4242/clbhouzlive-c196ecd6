import React from 'react';
import type { BadgeRarity } from '@/lib/gam/types';
import { rarityColor, rarityColorSoft } from '@/lib/gam/visuals';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

/**
 * RarityPill — small uppercase tag for badge rarity, friend Compare indicators,
 * urgency tags in notification cards.
 */
export const RarityPill: React.FC<{ rarity: BadgeRarity; size?: 'xs' | 'sm' }> = ({
  rarity,
  size = 'xs',
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: size === 'xs' ? '2px 7px' : '3px 9px',
      fontSize: size === 'xs' ? 10 : 11,
      fontFamily: FONT,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: rarityColor[rarity],
      background: rarityColorSoft[rarity],
      border: `1px solid ${rarityColor[rarity]}44`,
      borderRadius: 999,
      lineHeight: 1.1,
    }}
  >
    {rarity}
  </span>
);

/**
 * GamCard — the standard card for gam_* surfaces. Matches dark Card from
 * darkAtoms but adds an `interactive` prop for tappable cards (scale on press).
 */
export const GamCard: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  emphasized?: boolean;
  noPad?: boolean;
  style?: React.CSSProperties;
}> = ({ children, onClick, emphasized = false, noPad = false, style }) => {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onTouchStart={onClick ? () => setPressed(true) : undefined}
      onTouchEnd={onClick ? () => setPressed(false) : undefined}
      onTouchCancel={onClick ? () => setPressed(false) : undefined}
      style={{
        background: 'var(--hcp-bg-1)',
        border: emphasized ? '1px solid var(--hcp-line-2)' : '1px solid var(--hcp-line)',
        borderRadius: 12,
        padding: noPad ? 0 : 16,
        cursor: onClick ? 'pointer' : 'default',
        transform: pressed ? 'scale(0.995)' : 'scale(1)',
        transition: 'transform 0.12s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Skeleton — pulsing placeholder. Match the dimensions of the final component.
 * Uses `gamPulse` keyframe (renamed from `pulse` to avoid clashing with
 * Tailwind's built-in `animate-pulse`).
 */
export const Skeleton: React.FC<{ height: number | string; width?: number | string; radius?: number }> = ({
  height,
  width = '100%',
  radius = 12,
}) => (
  <div
    style={{
      height,
      width,
      borderRadius: radius,
      background: 'var(--hcp-line)',
      animation: 'gamPulse 1.6s ease-in-out infinite',
    }}
  />
);

/**
 * RetryStub — small inline error with retry button.
 */
export const RetryStub: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = "Couldn't load this section",
  onRetry,
}) => (
  <div
    style={{
      background: 'var(--hcp-bg-1)',
      border: '1px solid var(--hcp-line)',
      borderRadius: 12,
      padding: 16,
      textAlign: 'center',
    }}
  >
    <div style={{ fontFamily: FONT, fontSize: 13, color: 'var(--hcp-t-60)', marginBottom: onRetry ? 10 : 0 }}>
      {message}
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          background: 'transparent',
          border: '1px solid var(--hcp-line)',
          borderRadius: 8,
          padding: '6px 14px',
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--hcp-t-100)',
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    )}
  </div>
);

/**
 * EmptyStub — centered, low-emphasis empty state.
 */
export const EmptyStub: React.FC<{
  icon?: React.ReactNode;
  title: string;
  body?: string;
  cta?: { label: string; onClick: () => void };
}> = ({ icon, title, body, cta }) => (
  <div
    style={{
      background: 'var(--hcp-bg-1)',
      border: '1px solid var(--hcp-line)',
      borderRadius: 12,
      padding: 28,
      textAlign: 'center',
    }}
  >
    {icon && <div style={{ marginBottom: 12, opacity: 0.5 }}>{icon}</div>}
    <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: 'var(--hcp-t-100)', marginBottom: body ? 6 : 0 }}>
      {title}
    </div>
    {body && (
      <div style={{ fontFamily: FONT, fontSize: 13, color: 'var(--hcp-t-60)', lineHeight: 1.4 }}>
        {body}
      </div>
    )}
    {cta && (
      <button
        onClick={cta.onClick}
        style={{
          marginTop: 14,
          background: '#F7931E',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 18px',
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {cta.label}
      </button>
    )}
  </div>
);
