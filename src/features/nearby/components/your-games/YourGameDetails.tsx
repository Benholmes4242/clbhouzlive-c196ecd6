/**
 * YourGameDetails - Expanded details panel for game row
 */
import React from 'react';
import { SecondaryButton, DestructiveButton } from '@/features/hub/components/HubButtons';
import { MiniProfileRow } from './MiniProfileRow';
import type { Game, Participant } from './types';

interface YourGameDetailsProps {
  game: Game;
  variant: 'hosting' | 'joined';
  host?: Participant | null;
  members?: Participant[];
  onCancel?: (gameId: string) => void;
  onLeave?: (gameId: string) => void;
  onViewRequests?: (gameId: string) => void;
}

export function YourGameDetails({
  game,
  variant,
  host,
  members = [],
  onCancel,
  onLeave,
  onViewRequests,
}: YourGameDetailsProps) {
  return (
    <div className="yourGameRow__details">
      {/* Host section */}
      {host && (
        <section className="yourGameRow__section">
          <h3 className="yourGameRow__sectionTitle">Host</h3>
          <MiniProfileRow
            avatarUrl={host.profile_photo_url}
            name={host.display_name || (host.user_id ? 'Unknown' : 'Guest')}
            subtitle={host.eg_handicap_index ? `HCP ${host.eg_handicap_index}` : undefined}
            badgeLabel="Host"
          />
        </section>
      )}

      {/* Members section */}
      {members.length > 0 && (
        <section className="yourGameRow__section">
          <h3 className="yourGameRow__sectionTitle">
            Members <span className="yourGameRow__sectionCount">{members.length}</span>
          </h3>
          {members.map((member, idx) => (
            <MiniProfileRow
              key={member.user_id || idx}
              avatarUrl={member.profile_photo_url}
              name={member.display_name || (member.user_id ? 'Unknown' : 'Guest')}
              subtitle={member.eg_handicap_index ? `HCP ${member.eg_handicap_index}` : undefined}
            />
          ))}
        </section>
      )}

      {/* Actions */}
      <div className="yourGameRow__actions">
        {variant === 'hosting' && (
          <>
            {onViewRequests && (
              <SecondaryButton
                onClick={() => onViewRequests(game.id)}
                label="Requests"
              />
            )}
            {onCancel && (
              <DestructiveButton
                onClick={() => onCancel(game.id)}
                label="Cancel Game"
              />
            )}
          </>
        )}
        {variant === 'joined' && onLeave && (
          <DestructiveButton
            onClick={() => onLeave(game.id)}
            label="Leave Game"
          />
        )}
      </div>
    </div>
  );
}
