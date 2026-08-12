import React from 'react';
import type { LucideIcon } from 'lucide-react';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const AMBER = '#F7931E';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
      borderRadius: 12,
      background: '#1B1E27',
      border: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: 'rgba(247,147,30,0.14)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      aria-hidden
    >
      <Icon size={17} color={AMBER} strokeWidth={2.25} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: AMBER,
          marginBottom: 2,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.45,
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        {description}
      </div>
    </div>
  </div>
);

export default FeatureCard;
