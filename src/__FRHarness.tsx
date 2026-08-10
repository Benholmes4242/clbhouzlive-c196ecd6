import React from 'react';
import FriendRoundRow from '@/components/profile/handicap/whs/sections/recently-played/FriendRoundRow';
const mk = (o: any) => ({ friend_name: 'X', friend_thumbnail_url: null, friend_handicap_index: 12, last_round_played_at: '2026-08-06', last_round_course_name: 'Sundridge Park Golf Club', last_round_adjusted_gross: 82, last_round_stableford: 34, last_round_differential: 9.4, is_clbhouz_user: true, friend_connection_id: 'c', ...o } as any);
const rows = [
  [mk({ friend_name: 'Richard Lawrence' }), 'clbhouz-synced'],
  [mk({ friend_name: 'Danny Blake', is_clbhouz_user: false, friend_connection_id: null, last_round_stableford: null, last_round_differential: null, last_round_adjusted_gross: 85, last_round_course_name: 'Royal Cinque Ports Golf Club' }), 'eg-only'],
  [mk({ friend_name: 'Christopher Wetherington-Smythe', friend_connection_id: null, last_round_stableford: null, last_round_differential: null, last_round_course_name: 'Walton Heath Golf Club (Old Course)' }), 'clbhouz-not-synced'],
  [mk({ friend_name: 'Michael Martin', last_round_course_name: 'Wentworth Club (West Course)' }), 'clbhouz-synced'],
] as const;
export default function FRHarness() {
  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', padding: '16px 0' }} className="hcp-dark">
      <div id="panel" style={{ margin: '0 16px', background: '#141414', borderRadius: 16 }}>
        {rows.map(([a, v], i) => (
          <FriendRoundRow key={i} activity={a} variant={v as any} onClick={() => {}} />
        ))}
      </div>
    </div>
  );
}
