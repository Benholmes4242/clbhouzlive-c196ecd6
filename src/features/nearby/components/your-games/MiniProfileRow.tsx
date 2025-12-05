/**
 * MiniProfileRow - Profile row for game details
 */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface MiniProfileRowProps {
  avatarUrl?: string | null;
  name: string;
  subtitle?: string;
  badgeLabel?: string;
}

export function MiniProfileRow({ avatarUrl, name, subtitle, badgeLabel }: MiniProfileRowProps) {
  const initials = name.charAt(0).toUpperCase();
  
  return (
    <div className="miniProfileRow">
      <div className="miniProfileRow__avatar">
        <SquircleAvatar
          size={42}
          src={avatarUrl}
          alt={name}
          fallback={initials}
        />
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
