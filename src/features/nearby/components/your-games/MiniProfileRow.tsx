/**
 * MiniProfileRow - Profile row for game details
 */
import React from 'react';
import { Squircle } from '@/components/ui/squircle';

interface MiniProfileRowProps {
  avatarUrl?: string | null;
  name: string;
  subtitle?: string;
  badgeLabel?: string;
}

export function MiniProfileRow({ avatarUrl, name, subtitle, badgeLabel }: MiniProfileRowProps) {
  return (
    <div className="miniProfileRow">
      <div className="miniProfileRow__avatar">
        <Squircle width={42} height={42}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.1)',
              fontSize: '16px',
              fontWeight: 600
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </Squircle>
      </div>
      <div className="miniProfileRow__info">
        <div className="miniProfileRow__name">
          {name}
          {badgeLabel && (
            <span className="miniProfileRow__badge">{badgeLabel}</span>
          )}
        </div>
        {subtitle && (
          <div className="miniProfileRow__subtitle">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
