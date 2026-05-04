/**
 * MorningMomentSection — daily-context container above the Hero Ring on /handicap.
 *
 * Renders:
 *  - Home-course weather card (or set-home-club CTA when no primary_club_id)
 *  - Friends Yesterday card (when at least one WHS friend posted yesterday)
 *
 * Owns no data fetching beyond a single profile lookup for primary_club_id +
 * the joined golf_clubs row (name + coords). Two-step query rather than
 * embedded FK join to avoid coupling to a specific constraint name.
 */
import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HomeCourseWeatherCard from './HomeCourseWeatherCard';
import FriendsYesterdayCard from './FriendsYesterdayCard';
import SetHomeClubPromptCard from './SetHomeClubPromptCard';
import { useFriendsYesterday } from '@/lib/handicap/useFriendsYesterday';
import { analyticsEvents } from '@/utils/analyticsEvents';

const INK_55 = '#64748B';
const AMBER = '#F7931E';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  userId: string;
}

interface ClubRow {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  region: string | null;
  sub_country: string | null;
}

interface MorningMomentClubData {
  primary_club_id: string | null;
  club: ClubRow | null;
}

const MorningMomentSection: React.FC<Props> = ({ userId }) => {
  const { data: clubData, isLoading: clubLoading } = useQuery<MorningMomentClubData>({
    queryKey: ['morning-moment-club', userId],
    enabled: !!userId,
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data: profile, error: profileErr } = await supabase
        .from('user_profiles')
        .select('primary_club_id')
        .eq('id', userId)
        .maybeSingle();
      if (profileErr) throw profileErr;

      const primaryClubId = (profile as any)?.primary_club_id ?? null;
      if (!primaryClubId) return { primary_club_id: null, club: null };

      const { data: club, error: clubErr } = await supabase
        .from('golf_clubs')
        .select('id, name, latitude, longitude, country, region, sub_country')
        .eq('id', primaryClubId)
        .maybeSingle();
      if (clubErr) throw clubErr;

      return {
        primary_club_id: primaryClubId,
        club: (club as unknown as ClubRow) ?? null,
      };
    },
  });

  const { data: friendsData, isLoading: friendsLoading } = useFriendsYesterday(userId);

  const todayLabel = useMemo(() => {
    return new Date()
      .toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
      .toUpperCase();
  }, []);

  const hasClubSet = !!clubData?.primary_club_id && !!clubData?.club;
  const hasFriendsData = !!friendsData && friendsData.friends.length > 0;
  const isLoading = clubLoading || friendsLoading;

  // Telemetry: fire once per session after both queries settle.
  useEffect(() => {
    if (clubLoading || friendsLoading) return;
    analyticsEvents.track('morning_moment_viewed', {
      user_id: userId,
      has_home_club: hasClubSet,
      has_weather:
        hasClubSet &&
        (clubData?.club?.latitude !== null || clubData?.club?.longitude !== null),
      has_friends_yesterday: hasFriendsData,
      friends_count: friendsData?.count ?? 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubLoading, friendsLoading, userId]);

  // While data is loading, render nothing — the Hero Ring below should still
  // appear immediately. Cards manage their own internal skeletons once mounted.
  if (isLoading) {
    return null;
  }

  // Standalone CTA: no club AND no friend data. The section IS the CTA.
  if (!hasClubSet && !hasFriendsData) {
    return <SetHomeClubPromptCard userId={userId} todayLabel={todayLabel} inline={false} />;
  }

  return (
    <section aria-label="Today" style={{ padding: '20px 16px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: AMBER }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: INK_55,
            letterSpacing: '0.22em',
            fontFamily: FONT_GEIST,
          }}
        >
          TODAY · {todayLabel}
        </span>
      </div>

      {hasClubSet && clubData!.club && (
        <HomeCourseWeatherCard club={clubData!.club!} userId={userId} />
      )}
      {!hasClubSet && (
        <SetHomeClubPromptCard userId={userId} todayLabel={null} inline />
      )}

      {hasFriendsData && <FriendsYesterdayCard data={friendsData!} userId={userId} />}
    </section>
  );
};

export default MorningMomentSection;
