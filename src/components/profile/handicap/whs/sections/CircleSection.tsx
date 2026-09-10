/**
 * CircleSection — SECTION I of the one-page handicap brief.
 *
 * Flat replacement for FriendsLeaderboardSection: no Panel, no radius, no
 * tint, hairlines between rows and nothing above the first.
 *
 * THE RANK IS THE HEADING and the gap is the sub-line, so the three-figure
 * standing strip is off the page. The percentile is gone outright: it restated
 * a rank the member can already read, and it disagreed with it (5th of 24 is
 * the 21st percentile, not 25%).
 *
 * THE MEMBER'S ROW IS AMBER TEXT — position, name and figure. No wash, no
 * band, no frame. Amber text is the statement.
 *
 * ONE COLUMN, ONE QUANTITY. The old row printed a rank-movement chip under a
 * column headed 30D beside an unlabelled index, so two quantities sat in one
 * strip. This section prints the index only, and the meta says so ("By index"),
 * which is also what the list sorts on.
 *
 * TAPPING A ROW GOES THROUGH useMemberTapResolver — the existing three-way
 * resolver (synced -> compare, on clbhouz but unsynced -> nudge, WHS-only ->
 * invite). There is no second resolver here, and a row that cannot resolve is
 * not a button: an inert tap that fires an event reports as a working feature.
 *
 * ONE CLUB SOURCE FOR CLBHOUZ MEMBERS. get_friend_leaderboard returns the
 * England Golf club for friends and the clbhouz club for the self row, so the
 * viewer read "Sundridge Park Golf Club" beside other members' "Sundridge
 * Park". No normaliser (rejected July 2026): the clbhouz value is
 * batch-resolved for every row that has a clbhouz account, in one read, so
 * every member row uses the same field. WHS-only friends have no clbhouz
 * profile, so they keep the England Golf value — the only value they have.
 *
 * NINE-HOLE ROUNDS NEED NO TREATMENT: an index is already normalised.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useFriendLeaderboard, useFriendLeaderboardRankDeltas } from '@/lib/whs/hooks';
import { buildLeaderboardCohorts } from '@/lib/whs/utils/buildLeaderboardCohorts';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { formatOrdinal } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useMemberTapResolver } from '@/components/friend-sheet/useMemberTapResolver';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

import { SeeAllRow } from './SeeAllRow';
import { HcpSection } from './HcpSection';
import { CHART } from '../charts/tokens';
import FullLeaderboardSheet from './friends-leaderboard-v2/FullLeaderboardSheet';
import { CircleRow, CircleFlameLegend, hasFlame } from './friends-leaderboard-v2/CircleRow';
import { useCircleClubs } from './friends-leaderboard-v2/useCircleClubs';

interface Props {
  userId: string;
}

/** A row only responds where the resolver has somewhere to go. */
function isResolvable(e: FriendLeaderboardEntry): boolean {
  if (e.is_self) return false;
  if (e.friend_user_id) return true;
  return e.friend_passport_id != null;
}

export const CircleSection: React.FC<Props> = ({ userId }) => {
  const { t } = useTranslation(['common']);
  const { data, isFetched } = useFriendLeaderboard(userId);
  const { data: deltasData } = useFriendLeaderboardRankDeltas(userId, 30);
  const { resolve } = useMemberTapResolver();
  const [seeAllOpen, setSeeAllOpen] = useState(false);

  const cohorts = useMemo(() => buildLeaderboardCohorts(data), [data]);

  /* ONE club source, resolved in the shared hook so the sheet cannot disagree. */
  const circleEntries = useMemo(() => cohorts.active.concat(cohorts.inactive), [cohorts]);
  const clubFor = useCircleClubs(circleEntries);

  const rank = cohorts.selfActiveRank;
  const total = cohorts.totalActive;
  const selfRow = cohorts.selfActiveIdx >= 0 ? cohorts.active[cohorts.selfActiveIdx] : null;
  const selfIndex = selfRow?.friend_handicap_index ?? null;

  /* THE SUB-LINE NEVER RENDERS AGAINST AN UNRESOLVABLE PERSON. Both indexes
     must be present, and there must be a person on the other side of the gap.
     First place reads "clear of" the next member down. */
  const other = rank === 1 ? cohorts.active[1] ?? null : cohorts.rowAbove;
  const otherIndex = other?.friend_handicap_index ?? null;
  const gap =
    selfIndex != null && otherIndex != null && other != null && !other.is_self
      ? Math.abs(selfIndex - otherIndex)
      : null;
  const subLine =
    gap != null && other != null
      ? t(rank === 1 ? 'common:handicap.circle.section.clear' : 'common:handicap.circle.section.behind', {
          gap: gap.toFixed(1),
          name: reformatFriendName(other.friend_name),
        })
      : null;

  const withheld = isFetched && total === 0;
  const fired = useRef(false);
  useEffect(() => {
    if (!withheld || fired.current) return;
    fired.current = true;
    analyticsEvents.track('handicap_section_withheld', { section: 'circle' });
  }, [withheld]);

  if (!isFetched) return null;

  if (withheld) {
    return (
      <HcpSection
        hairline
        kicker={t('common:handicap.circle.section.kicker')}
        heading={t('common:handicap.circle.section.emptyHeading')}
      >
        <p style={{ margin: 0, fontSize: 13, color: CHART.MUTE, lineHeight: 1.5 }}>
          {t('common:handicap.circle.section.emptyBody')}
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('clbhouz:open-search'))}
          style={{
            marginTop: 14,
            padding: '9px 16px',
            border: 'none',
            borderRadius: 999,
            background: CHART.AMBER,
            color: '#0B0F14',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('common:handicap.circle.section.findGolfers')}
        </button>
      </HcpSection>
    );
  }

  const handleRowTap = async (entry: FriendLeaderboardEntry) => {
    const outcome = await resolve(
      entry.friend_user_id ? { targetUserId: entry.friend_user_id } : { whsOnlyEntry: entry },
    );
    analyticsEvents.track('handicap_circle_row_tapped', {
      outcome,
      is_clbhouz_user: entry.is_clbhouz_user,
    });
  };

  return (
    <>
      <HcpSection
        hairline
        kicker={t('common:handicap.circle.section.kicker')}
        heading={
          rank != null
            ? t('common:handicap.circle.section.heading', {
                rank: formatOrdinal(rank),
                total,
              })
            : t('common:handicap.circle.section.kicker')
        }
        meta={t('common:handicap.circle.section.meta')}
      >
        {subLine && (
          <p style={{ margin: '0 0 10px', fontSize: 13, color: CHART.MUTE, lineHeight: 1.4 }}>
            {subLine}
          </p>
        )}

        {cohorts.topFive.map((entry, i) => {
          const activeIdx = cohorts.active.findIndex((e) => e === entry);
          const position = activeIdx >= 0 ? activeIdx + 1 : null;
          const isYou = entry.is_self;
          const tappable = isResolvable(entry);
          const name = isYou
            ? t('common:handicap.circle.section.you')
            : reformatFriendName(entry.friend_name);
          const club = clubFor(entry);
          const avatarSrc = pickAvatarSrc(entry.friend_thumbnail_url, entry.friend_profile_photo_url);
          const Tag: React.ElementType = tappable ? 'button' : 'div';
          return (
            <Tag
              key={isYou ? 'self' : `${entry.friend_user_id ?? entry.friend_row_id ?? entry.friend_name}`}
              type={tappable ? 'button' : undefined}
              onClick={tappable ? () => void handleRowTap(entry) : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '11px 0',
                background: 'none',
                border: 'none',
                borderTop: i === 0 ? 'none' : `1px solid ${CHART.BORDER}`,
                textAlign: 'left',
                font: 'inherit',
                color: 'inherit',
                cursor: tappable ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                style={{
                  width: 16,
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: isYou ? CHART.AMBER : CHART.DIM,
                  ...FIG,
                }}
              >
                {position ?? ''}
              </span>

              {/* 30px avatar, radius 9. A broken source used to leave an empty
                  square because the initials only render when the source is
                  absent; onError drops back to the initials instead. */}
              <Avatar
                src={avatarSrc}
                name={entry.friend_name}
                seed={entry.friend_user_id ?? entry.friend_row_id ?? entry.friend_name}
              />

              <span style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: isYou ? CHART.AMBER : CHART.INK,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {name}
                </span>
                {club && (
                  <span
                    style={{
                      display: 'block',
                      marginTop: 2,
                      fontSize: 11,
                      color: CHART.DIM,
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {club}
                  </span>
                )}
              </span>

              <span
                style={{
                  flexShrink: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: isYou ? CHART.AMBER : CHART.INK,
                  ...FIG,
                }}
              >
                {fmtHcp(entry.friend_handicap_index)}
              </span>
            </Tag>
          );
        })}

        {/* SNAGS_02 §2: the ONE extracted see-all row. Rule above only. */}
        <SeeAllRow
          label={t('common:handicap.circle.section.seeAll', { count: total })}
          onPress={() => setSeeAllOpen(true)}
        />
      </HcpSection>

      <FullLeaderboardSheet
        open={seeAllOpen}
        onClose={() => setSeeAllOpen(false)}
        cohorts={cohorts}
        deltasData={deltasData}
        onRowClick={(entry) => void handleRowTap(entry)}
        viewMode="owner"
      />
    </>
  );
};

/** Initials are the fallback for BOTH an absent source and a failed load. */
const Avatar: React.FC<{ src: string | null; name: string; seed: string }> = ({ src, name, seed }) => {
  const [failed, setFailed] = useState(false);
  const showImg = !!src && !failed;
  return (
    <span
      style={{
        position: 'relative',
        width: 30,
        height: 30,
        borderRadius: 9,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: showImg ? CHART.PANEL_2 : getAvatarFallbackGradient(seed),
        color: CHART.INK,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {showImg ? (
        <img
          src={src as string}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{getInitialsFromName(name) || '?'}</span>
      )}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9,
          border: '1px solid rgba(255,255,255,0.22)',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
};

export default CircleSection;
