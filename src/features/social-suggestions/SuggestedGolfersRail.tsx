/**
 * GOLFERS YOU MIGHT KNOW (BRIEF_EXPLORE_LEADERBOARD_STATES §4).
 *
 * A horizontal rail of reason-led cards, beneath the see-all — the scores come
 * first and the remedy comes after. It reads the SAME suggestion engine as the
 * Activity block, the after-a-round prompt and /golferstofollow
 * (get_suggested_golfers): one engine, four surfaces, and every row already
 * carries the reason that put it there, so no copy is invented here.
 *
 * FOLLOWING SOMEONE MOVES THE BOARD IMMEDIATELY. The board reads are
 * invalidated on toggle, so a member who follows a golfer with rounds in the
 * window sees the effect of the thing they were just asked to do, without a
 * reload.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { FollowButton, RowAvatar, type RowActorLike } from '@/features/social-lists-v2/rowParts';
import { getProfilePathById } from '@/lib/profileRoutes';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { reasonText } from './SuggestedGolferRow';
import { useSuggestedGolfers, type SuggestedGolfer } from './useSuggestedGolfers';

const CARD_W = 148;

function toRow(g: SuggestedGolfer): RowActorLike {
  return {
    actor_type: 'personal',
    actor_id: g.user_id,
    display_name: g.display_name,
    username: g.username,
    avatar_url: g.profile_photo_url,
    viewer_follows: false,
  };
}

export function SuggestedGolfersRail({ surface }: { surface: string }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useSuggestedGolfers(12);

  const golfers = data ?? [];
  /* A rail with nothing in it is not rendered: an empty rail is not
     information, and the block above it already carries the explanation. */
  if (golfers.length === 0) return null;

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ ...KICKER, color: A.DIM, marginBottom: 10 }}>
        {t('suggestedGolfers.railKicker', 'GOLFERS YOU MIGHT KNOW')}
      </div>
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide"
        style={{ paddingBottom: 2 }}
      >
        {golfers.map((g) => {
          const row = toRow(g);
          return (
            <div
              key={g.user_id}
              style={{
                width: CARD_W,
                flex: `0 0 ${CARD_W}px`,
                background: A.PANEL,
                border: `1px solid ${A.HAIR}`,
                borderRadius: 16,
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  analyticsEvents.track('suggested_golfer_opened', { surface });
                  navigate(getProfilePathById(g.user_id, g.username));
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  cursor: 'pointer',
                }}
              >
                <RowAvatar row={row} size={48} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: A.INK,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g.display_name ?? g.username ?? ''}
                </span>
                {/* THE REASON IS THE POINT: why we suggest them, and why
                    following them would fill the board. */}
                <span
                  style={{
                    fontSize: 10,
                    lineHeight: 1.35,
                    color: A.DIM,
                    textAlign: 'center',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {reasonText(g, t as never)}
                </span>
              </button>
              <FollowButton
                row={row}
                onFollowChange={(following) => {
                  analyticsEvents.track('suggested_golfer_follow_toggled', { surface, following });
                  /* The board is a circle read: a new follow can change it. */
                  qc.invalidateQueries({ queryKey: ['discover', 'board-page'] });
                  qc.invalidateQueries({ queryKey: ['discover', 'board-facets'] });
                  qc.invalidateQueries({ queryKey: ['amateur', 'circle-size'] });
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
