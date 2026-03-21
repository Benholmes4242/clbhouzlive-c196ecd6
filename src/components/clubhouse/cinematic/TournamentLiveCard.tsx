// TournamentLiveCard — NUKED. Cinema rebuild coming in Phase 2.
// All wiring (props interface, imports, FeedSlide usage) preserved below.

import React from 'react';
import type { TournamentLiveFeedPost } from '@/components/media-system/types/media';

export interface TournamentLiveCardProps {
  post:                  TournamentLiveFeedPost;
  isActive:              boolean;
  onComment:             () => void;
  onLike:                () => void;
  likeOverride?:         { isLiked: boolean; count: number };
  commentCountOverride?: number;
}

export const TournamentLiveCard: React.FC<TournamentLiveCardProps> = ({
  post, isActive, onComment, onLike, likeOverride, commentCountOverride,
}) => {
  // Phase 2: Cinema rebuild replaces this placeholder
  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 600 }}>
        {post.liveMeta?.tournamentName ?? 'Live Tournament'}
      </span>
    </div>
  );
};

export default TournamentLiveCard;
