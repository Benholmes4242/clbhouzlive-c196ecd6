/**
 * StaleBadge - Visual indicator when predictions need regeneration
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface StaleBadgeProps {
  className?: string;
}

export const StaleBadge: React.FC<StaleBadgeProps> = ({ className }) => (
  <div
    className={className}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '10px 16px',
      borderRadius: 12,
      background: 'rgba(245, 158, 11, 0.08)',
      border: '1px solid rgba(245, 158, 11, 0.15)',
    }}
  >
    <AlertTriangle size={14} style={{ color: 'rgba(245, 158, 11, 0.8)', flexShrink: 0 }} />
    <span
      style={{
        fontSize: '12.5px',
        fontWeight: 600,
        color: 'hsl(var(--foreground) / 0.6)',
      }}
    >
      Predictions may be outdated — field changes detected
    </span>
  </div>
);
