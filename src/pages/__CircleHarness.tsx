// TEMPORARY visual harness — deleted after screenshots.
import React, { useState } from 'react';
import LeaderboardRow from '@/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow';
import StandingFigures from '@/components/profile/handicap/whs/sections/friends-leaderboard-v2/StandingFigures';
import FullLeaderboardSheet from '@/components/profile/handicap/whs/sections/friends-leaderboard-v2/FullLeaderboardSheet';
import { buildLeaderboardCohorts } from '@/lib/whs/utils/buildLeaderboardCohorts';

const mk = (
  name: string,
  hcp: number,
  club: string | null,
  self = false,
  days = 2,
) =>
  ({
    friend_row_id: name,
    friend_user_id: name,
    friend_name: name,
    friend_home_club: club,
    friend_handicap_index: hcp,
    is_self: self,
    last_round_played_at: new Date(Date.now() - days * 86400000).toISOString(),
    handicap_30d_delta: -0.6,
    friend_thumbnail_url: null,
    friend_profile_photo_url: null,
  }) as never;

const rows = [
  mk('Christopher Wetherington-Smythe', 1.2, 'Sundridge Park Golf Club'),
  mk('Kieran Fitzpatrick-Donnelly', 2.4, 'Royal Cinque Ports Golf Club'),
  mk('Alexandra Vandermolenbergen', 3.1, 'Walton Heath Golf Club'),
  mk('You', 4.4, 'Sundridge Park Golf Club', true),
  mk('Tom Rashbrook', 5.0, 'Knole Park'),
  mk('Old Timer McStale', 12.0, 'Dormant Links Golf and Country Club', false, 300),
];

export default function CircleHarness() {
  const cohorts = buildLeaderboardCohorts(rows);
  const [open, setOpen] = useState(false);
  const self = cohorts.active[cohorts.selfActiveIdx] ?? null;
  return (
    <div className="hcp-dark" style={{ background: '#15171F', minHeight: '100vh', paddingTop: 24 }}>
      <div
        style={{
          margin: '0 16px',
          background: 'var(--hcp-bg-1, #1B1E27)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        <StandingFigures
          selfRow={self}
          rowAbove={cohorts.rowAbove}
          rank={cohorts.selfActiveRank}
          totalActive={cohorts.totalActive}
          percentileTop={25}
        />
        <div style={{ padding: '2px 16px 6px' }}>
          {cohorts.active.map((e, i) => (
            <LeaderboardRow
              key={i}
              entry={e}
              rank={i + 1}
              isStaleRow={false}
              rankDelta={{ rank_delta: i === 0 ? 2 : i === 1 ? 0 : -1, is_new: false } as never}
              onClick={e.is_self ? undefined : () => undefined}
            />
          ))}
        </div>
      </div>
      <button id="open-sheet" type="button" onClick={() => setOpen(true)} style={{ margin: 16, color: '#fff' }}>
        open sheet
      </button>
      <FullLeaderboardSheet
        open={open}
        onClose={() => setOpen(false)}
        cohorts={cohorts}
        deltasData={undefined}
        onRowClick={() => undefined}
      />
    </div>
  );
}
