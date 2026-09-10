import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { useFriendsActivity, whsKeys } from '@/lib/whs/hooks';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HcpSection } from '../HcpSection';
import { CHART, CHART_FONT } from '../../charts';
import FriendRoundRow, { type FriendRoundVariant } from './FriendRoundRow';
import { FriendsRoundsSheet } from './FriendsRoundsSheet';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';

const INLINE_ROUNDS = 5;
const COMPLETE_LIST_LIMIT = 200;

interface Props { ownerUserId: string; }

const variantFor = (activity: WhsFriendActivityWithImage): FriendRoundVariant =>
  activity.is_clbhouz_user && activity.friend_connection_id
    ? 'clbhouz-synced'
    : activity.is_clbhouz_user
      ? 'clbhouz-not-synced'
      : 'eg-only';

export const RecentlyPlayedFeed: React.FC<Props> = ({ ownerUserId }) => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { data, isLoading: fetching, isFetched } = useFriendsActivity(ownerUserId, COMPLETE_LIST_LIMIT);
  const isLoading = !isFetched || fetching;
  const rounds = useMemo(() => [...(data ?? [])].sort((a, b) => (b.last_round_played_at ?? '').localeCompare(a.last_round_played_at ?? '')), [data]);
  const [allOpen, setAllOpen] = useState(false);
  const [selected, setSelected] = useState<WhsFriendActivityWithImage | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || rounds.length > 0) return;
    analyticsEvents.track('handicap_section_withheld', {
      section: 'friends_rounds',
      reason: 'no_rounds_last_fortnight',
      sample_size: 0,
    });
  }, [isLoading, rounds.length]);

  const openRound = useCallback((round: WhsFriendActivityWithImage) => {
    if (!round.is_clbhouz_user || !round.last_round_score_id) return;
    analyticsEvents.track('handicap_friends_round_opened', {
      source: allOpen ? 'friends_rounds_sheet' : 'friends_rounds_section',
      whs_score_id: round.last_round_score_id,
      is_nine_hole: round.is_nine_hole || round.total_holes === 9,
    });
    setSelected(round);
  }, [allOpen]);

  const invite = useCallback(async (round: WhsFriendActivityWithImage) => {
    if (invitingId || round.friend_passport_id == null) return;
    setInvitingId(round.friend_row_id);
    try {
      const res = await callCreateInvite(round.friend_passport_id, 'copy_link');
      if (!res.ok || !res.share_url) {
        toast.error(res.message ?? t('invite.toast.createFailed'));
        return;
      }
      analyticsEvents.track('invite_sent', {
        source: allOpen ? 'handicap_friends_rounds_sheet' : 'handicap_friends_rounds',
        kind: 'friend',
        is_reshare: false,
      });
      queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
      await shareInvite({ share_url: res.share_url, share_message: res.share_message ?? '', invitee_name: res.invitee_name ?? round.friend_name });
    } finally {
      setInvitingId(null);
    }
  }, [allOpen, invitingId, queryClient, t]);

  if (isLoading) return null;

  return (
    <>
      <HcpSection
        kicker={t('handicap.friendsRounds.kicker')}
        heading={t('handicap.friendsRounds.heading')}
        meta={t('handicap.friendsRounds.meta')}
      >
        {rounds.length === 0 ? (
          <p style={{ margin: 0, fontFamily: CHART_FONT, fontSize: 12, lineHeight: '17px', color: CHART.DIM }}>
            {t('handicap.friendsRounds.empty')}
          </p>
        ) : (
          <>
            {rounds.slice(0, INLINE_ROUNDS).map((round) => (
              <FriendRoundRow
                key={`${round.friend_row_id}:${round.last_round_score_id ?? round.last_round_played_at}`}
                activity={round}
                variant={variantFor(round)}
                onOpenRound={openRound}
                onInvite={invite}
                inviting={invitingId === round.friend_row_id}
              />
            ))}
            {rounds.length > INLINE_ROUNDS && (
              /* Terminal row, same treatment as the circle's SEE ALL 24 ›:
                 uppercase 9/0.19em, the count, and the chevron on the right. */
              <button
                type="button"
                onClick={() => setAllOpen(true)}
                /* SNAGS_01 §E: NO RULE BELOW. The rule that closes the list
                   is the last FriendRoundRow's own bottom border, immediately
                   above this row; the next rule on the page belongs to the
                   footer. A second border here put three hairlines in a short
                   span, two of them doing the same job. */
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: 0, padding: '14px 0 2px', background: 'transparent', color: CHART.MUTE, textAlign: 'left', fontFamily: CHART_FONT }}
              >
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase' }}>
                  {t('handicap.friendsRounds.seeAll', { count: rounds.length })}
                </span>
                <span style={{ fontSize: 11 }}>&rsaquo;</span>
              </button>
            )}
          </>
        )}
      </HcpSection>

      <FriendsRoundsSheet open={allOpen} onClose={() => setAllOpen(false)} rounds={rounds} onOpenRound={openRound} onInvite={invite} invitingId={invitingId} />

      <RoundDetailSheet
        scoreId={selected?.last_round_score_id ?? null}
        connectionId={selected?.friend_connection_id ?? null}
        profileUserId={selected?.friend_user_id ?? null}
        open={selected != null}
        onClose={() => setSelected(null)}
        handicapDelta={selected?.is_counter && selected.friend_handicap_index != null && selected.handicap_index_at_time != null ? selected.friend_handicap_index - selected.handicap_index_at_time : null}
      />
    </>
  );
};

export default RecentlyPlayedFeed;