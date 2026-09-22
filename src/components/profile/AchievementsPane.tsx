/**
 * AchievementsPane — the achievements tab on ProfilePageV2.
 *
 * BRIEF_PROFILE_ACHIEVEMENTS_REAL — WHAT THIS PANE USED TO BE.
 * It shipped an XP system: `const totalXP = 2500`, a 10,000 XP milestone, four
 * named "rings", two progress rings, a tier ladder, a celebration effect and
 * dozens of hardcoded achievement rows with invented progress strings
 * ("23 / 50 rounds", "Best: 16 pars"). Every member saw the same numbers. There
 * IS no XP in this platform — the gamification layer counts badges, course
 * titles and standings — so none of it could be "connected to real data".
 *
 * WHAT IT IS NOW. Two stored figures and a way into the Trophy Room, where the
 * badges and crowns themselves live. Both figures are READ (see
 * useProfileAchievementFigures); nothing here computes, sums or ranks. No tier,
 * level or rank is claimed, because no such value is stored. A read that fails
 * prints an em dash, not a zero.
 */
import React, { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '@/i18n/format';
import { useProfileAchievementFigures } from '@/hooks/gam/useProfileAchievementFigures';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface AchievementsPaneProps {
  userId?: string;
  userDisplayName?: string;
  userHandicap?: string | number;
  userProfilePhotoUrl?: string;
  isCurrentUser?: boolean;
}

const LABEL =
  'text-[11px] font-bold uppercase tracking-[0.13em] text-muted-foreground';

const Figure: React.FC<{ label: string; value: number | null; testId: string }> = ({
  label,
  value,
  testId,
}) => (
  <div className="flex-1 min-w-0" data-figure={testId}>
    <div className={LABEL}>{label}</div>
    <div
      className="mt-1 text-[32px] font-extrabold leading-none text-foreground tabular-nums"
      data-figure-value={testId}
    >
      {/* Not known prints an em dash. A failed read is not a zero. */}
      {value == null ? '—' : formatNumber(value)}
    </div>
  </div>
);

const AchievementsPane: React.FC<AchievementsPaneProps> = ({
  userId,
  isCurrentUser = true,
}) => {
  const navigate = useNavigate();
  const { data, isError, isFetched } = useProfileAchievementFigures(userId);

  /* isFetched, not isLoading: the query is disabled without a userId, and a
     disabled query has never run. */
  const known = isFetched && !isError;
  const badges: number | null = known ? (data?.badges ?? 0) : null;
  const titles: number | null = known ? (data?.titles ?? 0) : null;

  /* The failure stops being invisible — same series as the hero counters. */
  useEffect(() => {
    if (!isError || !userId) return;
    analyticsEvents.track('profile_counter_read_failed', {
      counters: 'badges_titles',
      source: 'useProfileAchievementFigures',
      profile_user_id: userId,
      is_self: !!isCurrentUser,
    });
  }, [isError, userId, isCurrentUser]);

  const isEmpty = known && badges === 0 && titles === 0;

  /* The Trophy Room sheet is mounted on the handicap page (GamMount), not
     here, so the way in is the established ?gam=trophies deep link. */
  const openTrophyRoom = () => {
    navigate(
      isCurrentUser || !userId
        ? '/handicap?gam=trophies'
        : `/handicap/${userId}?gam=trophies`,
    );
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 pt-6 pb-[130px] md:pb-[60px]">
      <div className="rounded-2xl border border-border bg-card p-4">
        {isEmpty ? (
          <p className="text-sm text-muted-foreground" data-achievements-empty="true">
            {isCurrentUser
              ? 'No badges earned and no course titles held yet. Post a round and the record starts here.'
              : 'No badges earned and no course titles held yet.'}
          </p>
        ) : (
          <div className="flex items-start gap-4">
            <Figure label="Badges earned" value={badges} testId="badges" />
            <Figure label="Course titles" value={titles} testId="titles" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={openTrophyRoom}
        aria-label="Open the Trophy Room"
        data-trophy-room-entry="true"
        className="mt-3 w-full flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left"
      >
        <span className={LABEL}>Trophy Room</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </div>
  );
};

export default AchievementsPane;
