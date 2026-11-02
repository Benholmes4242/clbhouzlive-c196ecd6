/** CR2 mounts this collector only for creators, preserving non-creator rounds'
 * provider/read requirements. Matching and ordering belong entirely to the RPC. */
import { useQuery } from '@tanstack/react-query';
import type React from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileRound } from '@/components/profile/rounds/useProfileRounds';
import { toFeedPosts } from '@/features/watch-v2/utils/toFeedPost';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { creatorDuration, creatorFeedRow, type RoundVideo } from './profileCreator';
import './profile-creator.css';
export function ProfileRoundVideos({ userId, viewerId, rounds, children }: { userId: string; viewerId?: string; rounds: ProfileRound[]; children: (rows: Map<string, RoundVideo[]>) => React.ReactNode }) {
  const ids = rounds.map(r => r.whs_score_id); const dates = rounds.map(r => r.play_date);
  const q = useQuery({ queryKey: ['profile-round-videos', userId, viewerId, ids, dates], enabled: !!viewerId && rounds.length > 0, queryFn: async () => {
    const { data, error } = await supabase.rpc('get_profile_round_videos', { p_user_id: userId, p_score_ids: ids, p_dates: dates });
    if (error) throw error; return data ?? [];
  } });
  const grouped = new Map<string, RoundVideo[]>();
  if (!q.isError) for (const row of q.data ?? []) grouped.set(row.score_id, [...(grouped.get(row.score_id) ?? []), row]);
  return <>{children(grouped)}</>;
}
export function RoundVideoPill({ rows, self }: { rows: RoundVideo[]; self: boolean }) {
  if (!rows.length) return null;
  const label = rows.length > 1 ? `${rows.length} videos` : creatorDuration(rows[0]?.duration_seconds);
  const open = () => { analyticsEvents.track('round_video_pill_tapped', { videos: rows.length, self }); openWithOrigin({ posts: toFeedPosts(rows.map(creatorFeedRow)), index: 0, originEl: null, posterUrl: rows[0]?.poster_url ?? null, openedFrom: 'profile-round-videos', forceStartAtZero: true }); };
  // The existing round is a button. This keyboard-operable span is not a nested
  // HTML button; propagation isolation keeps its scorecard destination intact.
  return <span role="button" tabIndex={0} className="profile-round-video" aria-label={label || 'Play video'} onClick={e => { e.stopPropagation(); open(); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); open(); } }}><svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><path d="M1 0v8l7-4z" fill="currentColor" /></svg>{label}</span>;
}
