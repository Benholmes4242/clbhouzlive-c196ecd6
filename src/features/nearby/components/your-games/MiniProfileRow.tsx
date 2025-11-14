/**
 * MiniProfileRow - Profile row for game details
 */
import React from 'react';

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
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} />
        ) : (
          <div className="miniProfileRow__avatarPlaceholder">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
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
