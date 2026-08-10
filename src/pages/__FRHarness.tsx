import React from 'react';
import FriendRoundRow, { type FriendRoundVariant } from '@/components/profile/handicap/whs/sections/recently-played/FriendRoundRow';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

const mk = (n: string, course: string, o: Partial<WhsFriendActivityWithImage>) => ({
  friend_name: n, friend_passport_id: n, friend_row_id: n, friend_thumbnail_url: null,
  friend_profile_photo_url: null, friend_handicap_index: 10, friend_connection_id: 'c',
  last_round_played_at: '2026-08-04', last_round_course_name: course,
  last_round_adjusted_gross: 85, last_round_stableford: 36, last_round_differential: 12.4,
  last_round_score_id: 's', is_clbhouz_user: true, is_counter: true, handicap_index_at_time: 10,
  ...o,
}) as unknown as WhsFriendActivityWithImage;

const rows: [WhsFriendActivityWithImage, FriendRoundVariant][] = [
  [mk('Michael Martin', 'Sundridge Park Golf Club', {}), 'clbhouz-synced'],
  [mk('Danny Blake', 'Royal Cinque Ports Golf Club', { last_round_stableford: null, last_round_differential: null, last_round_adjusted_gross: 85 }), 'eg-only'],
  [mk('Richard Lawrence', 'Walton Heath Golf Club (Old Course)', { last_round_stableford: null }), 'clbhouz-not-synced'],
  [mk('Christopher Wetherington-Smythe', 'Knole Park Golf Club', {}), 'clbhouz-synced'],
];

export default function FRHarness() {
  return (
    <div className="hcp-dark" style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: 8 }}>
      <div id="panel" style={{ margin: '0 16px', background: '#15171F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        {rows.map(([a, v], i) => (
          <FriendRoundRow key={i} activity={a} variant={v} onClick={() => {}} />
        ))}
      </div>
    </div>
  );
}
