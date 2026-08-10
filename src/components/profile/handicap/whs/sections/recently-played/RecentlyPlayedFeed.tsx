/**
 * RecentlyPlayedFeed - friends' rounds, as rows.
 *
 * No card per row, no rule between rows, no paged carousel: one house row per
 * round with fixed figure columns. The rows sit inside a single panel so the
 * section still reads as one object.
 *
 * Renders NOTHING when there are no rounds.
 */
import React, { useState } from 'react';
import { useFriendsActivity } from '@/lib/whs/hooks';
import { Skeleton } from '@/components/ui/skeleton';

import FriendRoundRow, { type FriendRoundVariant } from './FriendRoundRow';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import { CHART } from '../../charts';
import type { WhsFriendActivityWithImage, FriendLeaderboardEntry } from '@/lib/whs/types';
import { useMemberTapResolver } from '@/components/friend-sheet/useMemberTapResolver';
import { useInviteSheet } from '@/hooks/useInviteSheet';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

/** This surface's dark LABEL: 7/700/0.16em. */
const FOOT_LABEL: React.CSSProperties = {
  fontSize: 7,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  lineHeight: 1.4,
  margin: 0,
};

/** DISTINCT friends, not rows - the same friend appears on every round they
 *  post, which is exactly why the per-row action repeated five or six times. */
const friendKey = (a: WhsFriendActivityWithImage): string =>
  a.friend_passport_id ?? a.friend_row_id ?? a.friend_name;

const countDistinct = (
  items: WhsFriendActivityWithImage[],
  variant: FriendRoundVariant,
): number => new Set(items.filter((i) => variantFor(i) === variant).map(friendKey)).size;

interface Props {
  ownerUserId: string;
}

const toWhsOnlyEntry = (a: WhsFriendActivityWithImage): FriendLeaderboardEntry => ({
  is_self: false,
  friend_user_id: null,
  friend_connection_id: a.friend_connection_id,
  friend_passport_id: a.friend_passport_id ?? null,
  friend_row_id: a.friend_row_id ?? null,
  friend_name: a.friend_name,
  friend_thumbnail_url: a.friend_thumbnail_url,
  friend_profile_photo_url: a.friend_profile_photo_url ?? null,
  friend_handicap_index: a.friend_handicap_index,
  friend_home_club: null,
  last_round_played_at: a.last_round_played_at,
  last_round_course_name: a.last_round_course_name,
  is_clbhouz_user: false,
  handicap_30d_ago: null,
  handicap_30d_delta: null,
  rounds_last_30d: 0,
});

const variantFor = (a: WhsFriendActivityWithImage): FriendRoundVariant =>
  a.is_clbhouz_user && a.friend_connection_id
    ? 'clbhouz-synced'
    : a.is_clbhouz_user
      ? 'clbhouz-not-synced'
      : 'eg-only';

export const RecentlyPlayedFeed: React.FC<Props> = ({ ownerUserId }) => {
  const { t } = useTranslation('common');
  const { openInviteSheet } = useInviteSheet();
  const { data, isLoading } = useFriendsActivity(ownerUserId);
  const [sheetActivity, setSheetActivity] =
    useState<WhsFriendActivityWithImage | null>(null);
  const { resolve } = useMemberTapResolver();

  const handleOpen = (item: WhsFriendActivityWithImage) => {
    // State D — Not a Clbhouz user (or unresolvable user_id) → invite
    if (!item.is_clbhouz_user || !item.friend_user_id) {
      void resolve({ whsOnlyEntry: toWhsOnlyEntry(item) });
      return;
    }
    // State C — Clbhouz member, no handicap connected → nudge to sync, NOT an
    // invite-to-clbhouz: they are already here.
    if (!item.friend_connection_id) {
      void resolve({ targetUserId: item.friend_user_id });
      return;
    }
    // State B — Synced member, no detailed scorecard for this round → compare
    if (!item.last_round_score_id) {
      void resolve({ targetUserId: item.friend_user_id });
      return;
    }
    // State A — Synced + has scorecard → real scorecard sheet
    setSheetActivity(item);
  };

  const items = data ?? [];
  const egOnly = countDistinct(items, 'eg-only');
  const notSynced = countDistinct(items, 'clbhouz-not-synced');

  // Nothing at all when the fortnight is empty.
  if (!isLoading && items.length === 0) return null;

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader
        eyebrow="FRIENDS' ROUNDS"
        right={!isLoading ? `LAST FORTNIGHT \u00B7 ${items.length}` : undefined}
      />

      {isLoading ? (
        <div style={{ padding: '0 16px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="dark"
              style={{ height: 58, borderRadius: 0, marginBottom: 1 }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            margin: '0 16px',
            background: CHART.PANEL,
            border: `1px solid ${CHART.BORDER}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {items.map((item) => (
            <FriendRoundRow
              key={
                item.last_round_score_id ??
                `${item.friend_passport_id}-${item.last_round_played_at}`
              }
              activity={item}
              variant={variantFor(item)}
              onClick={() => handleOpen(item)}
            />
          ))}
        </div>
      )}

      {/* Beneath the list: the two unconnected states, stated once each.
          They are NOT the same fact and they do not share a destination -
          'eg-only' friends are not on clbhouz (invite), 'clbhouz-not-synced'
          friends are here already with no handicap connected (nothing to
          invite them to, so the line states and does not act). */}
      {!isLoading && (egOnly > 0 || notSynced > 0) && (
        <div style={{ padding: '0 16px', marginTop: 10 }}>
          {egOnly > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '6px 0',
              }}
            >
              <p style={{ ...FOOT_LABEL, color: 'var(--hcp-t-60)' }}>
                {t('handicap.circle.rounds.notOnClbhouz', { count: egOnly })}
              </p>
              <button
                type="button"
                onClick={() => openInviteSheet('handicap_circle')}
                style={{
                  ...FOOT_LABEL,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--hcp-t-100)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {t('handicap.circle.rounds.inviteThem')}
                <ChevronRight size={11} strokeWidth={2.6} />
              </button>
            </div>
          )}
          {notSynced > 0 && (
            <p style={{ ...FOOT_LABEL, color: 'var(--hcp-t-60)', padding: '6px 0' }}>
              {t('handicap.circle.rounds.noHandicap', { count: notSynced })}
            </p>
          )}
        </div>
      )}

      <RoundDetailSheet
        scoreId={sheetActivity?.last_round_score_id ?? null}
        profileUserId={sheetActivity?.friend_user_id ?? null}
        open={!!sheetActivity}
        onClose={() => setSheetActivity(null)}
        handicapDelta={
          sheetActivity?.is_counter &&
          sheetActivity.friend_handicap_index != null &&
          sheetActivity.handicap_index_at_time != null
            ? sheetActivity.friend_handicap_index - sheetActivity.handicap_index_at_time
            : null
        }
      />
    </section>
  );
};

export default RecentlyPlayedFeed;
