/**
 * Shared "You and …" card markup (CB113), extracted from ClubYouCard so the
 * club and non-club cards cannot drift. Presentational only: callers own
 * reads, copy and visibility. ClubYouCard passes max 4 faces; business 3.
 */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

export interface YouCardFace { user_id: string; display_name: string | null; profile_photo_url?: string | null }

export function YouCardShell({ dataAttr, kicker, kickerStyle, first, second, faces }: {
  dataAttr: 'data-club-you' | 'data-business-you';
  kicker: React.ReactNode;
  kickerStyle?: React.CSSProperties;
  first: React.ReactNode;
  second?: React.ReactNode;
  faces: { players: YouCardFace[]; max: number; names: React.ReactNode; rest: React.ReactNode } | null;
}) {
  return <section className="club-you-card" {...{ [dataAttr]: '' }}>
      <p className="club-you-kicker" style={kickerStyle}>{kicker}</p>
      <h2 className="club-you-title">{first}{second && <> <span>{second}</span></>}</h2>
      {faces && <div className="club-you-faces" data-club-you-faces="">
        <div className="club-you-stack" aria-hidden="true">{faces.players.slice(0, faces.max).map((player, index) => <span key={player.user_id} data-face={player.user_id} style={{ marginLeft: index === 0 ? 0 : -8, display: 'inline-flex' }}><SquircleAvatar size={28} src={player.profile_photo_url} alt={player.display_name ?? ''} userId={player.user_id} hairlineRing /></span>)}</div>
        <p>{faces.names && <b>{faces.names}</b>}{faces.rest}</p>
      </div>}
    </section>;
}
