import React, { useMemo, useState } from 'react';
import { useLastRound } from '@/lib/whs/hooks';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import { CinemaFriendCard } from './recently-played/cinema-friend-card';
import { CinemaCardSkeleton } from './last-round-card';
import { DarkSectionHeader } from './_shared/darkAtoms';

interface Props {
  connectionId: string;
  userId: string;
}

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

export const LastRoundCard: React.FC<Props> = ({ connectionId, userId }) => {
  const { data: lastRound, isLoading } = useLastRound(connectionId);
  const { data: profile } = useUserProfile(userId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const activity = useMemo<WhsFriendActivityWithImage | null>(() => {
    if (!lastRound) return null;
    const delta = lastRound.handicap_delta ?? null;
    // Synthesize so CinemaFriendEyebrow's impactDelta = friend_handicap_index - handicap_index_at_time = delta
    const handicap_index_at_time = delta !== null ? 0 : null;
    const friend_handicap_index = delta !== null ? delta : null;
    return {
      friend_row_id: lastRound.id,
      friend_passport_id: 0,
      friend_name: profile?.display_name ?? profile?.username ?? 'You',
      friend_thumbnail_url: profile?.profile_photo_url ?? null,
      friend_user_id: userId,
      friend_connection_id: connectionId,
      is_clbhouz_user: true,
      last_round_played_at: lastRound.play_date,
      last_round_course_name: lastRound.course?.name ?? 'Unknown course',
      last_round_adjusted_gross: lastRound.adjusted_gross ?? null,
      last_round_stableford: lastRound.stableford_points ?? null,
      last_round_differential: lastRound.handicap_differential ?? null,
      last_round_score_id: lastRound.id,
      course_thumbnail_image: lastRound.course_thumbnail_image ?? null,
      is_course_best: false,
      friend_handicap_index,
      is_counter: lastRound.is_counter ?? false,
      handicap_index_at_time,
      viewer_has_reacted: false,
      total_reactions: 0,
    } as unknown as WhsFriendActivityWithImage;
  }, [lastRound, profile, userId, connectionId]);

  if (isLoading) {
    return (
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="Last Round" />
        <div style={{ padding: '0 20px' }}>
          <CinemaCardSkeleton />
        </div>
      </section>
    );
  }

  if (!lastRound || !activity) {
    return (
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="Last Round" />
        <div style={{ padding: '0 20px' }}>
          <p style={{ fontSize: 14, color: 'var(--hcp-t-60)', fontFamily: FONT_GEIST }}>
            Your rounds will appear here as soon as you start posting scores in MyEG.
          </p>
        </div>
      </section>
    );
  }

  const formattedDate = lastRound.play_date
    ? new Date(lastRound.play_date)
        .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
        .toUpperCase()
    : undefined;

  return (
    <>
      <section style={{ marginTop: 32, fontFamily: FONT_GEIST }}>
        <DarkSectionHeader eyebrow="Last Round" right={formattedDate} />
        <CinemaFriendCard activity={activity} onClick={() => setSheetOpen(true)} />
      </section>

      <RoundDetailSheet
        variant="user"
        scoreId={lastRound.id}
        connectionId={connectionId}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        handicapDelta={lastRound.handicap_delta ?? null}
      />
    </>
  );
};

export default LastRoundCard;
