/**
 * BRIEF_SUGGESTED_GOLFERS S2 - the reason-led row. One component for the
 * Activity block, the after-a-round prompt and the /golferstofollow page.
 *
 * The REASON is the eyebrow, above the person: nobody follows a stranger
 * because an app said so. A club reason is AMBER; every other reason is faint.
 * Following a row LEAVES IT IN PLACE (K) - the follow primitive holds its own
 * optimistic state and we never filter the list on tap.
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { getProfilePathById } from '@/lib/profileRoutes';
import {
  RowAvatar,
  FollowButton,
  ROW_FONT,
  type RowActorLike,
} from '@/features/social-lists-v2/rowParts';
import type { SuggestedGolfer } from './useSuggestedGolfers';

export function reasonText(
  g: SuggestedGolfer,
  t: (k: string, o?: Record<string, unknown>) => string,
): string {
  switch (g.reason_type) {
    case 'club':
      return t('suggestedGolfers.reason.club', { club: g.reason_club_name ?? '' });
    case 'course':
      return t('suggestedGolfers.reason.course', { course: g.reason_course_name ?? '' });
    case 'mutual':
      return t('suggestedGolfers.reason.mutual', { count: g.mutual_count ?? 0 });
    default:
      return t('suggestedGolfers.reason.active', { count: g.recent_rounds ?? 0 });
  }
}

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

export function SuggestedGolferRow({
  golfer,
  showDivider = false,
  onFollowChange,
}: {
  golfer: SuggestedGolfer;
  showDivider?: boolean;
  onFollowChange?: (following: boolean) => void;
}) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const row = toRow(golfer);
  const isClub = golfer.reason_type === 'club';

  // S2.4 - the subline omits what it does not have. No placeholders.
  const parts: string[] = [];
  if ((golfer.rounds_total ?? 0) > 0) {
    parts.push(t('suggestedGolfers.subline.rounds', { count: golfer.rounds_total ?? 0 }));
  }
  if (golfer.handicap_index !== null && golfer.handicap_index !== undefined) {
    parts.push(
      t('suggestedGolfers.subline.index', {
        index: Number(golfer.handicap_index).toFixed(1),
      }),
    );
  }

  const open = () => {
    const path = getProfilePathById(golfer.user_id);
    if (path) navigate(path);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') open();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 16px',
        cursor: 'pointer',
        fontFamily: ROW_FONT,
        borderBottom: showDivider ? `0.5px solid ${A.BORDER}` : undefined,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* REASON FIRST - AXIS 9 / 0.14em, amber for club, faint otherwise. */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isClub ? A.AMBER : A.DIM,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 6,
          }}
        >
          {reasonText(golfer, t)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <RowAvatar row={row} size={34} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: A.INK,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {golfer.display_name ?? golfer.username ?? ''}
            </div>
            {parts.length > 0 && (
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: A.DIM,
                  marginTop: 1,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {parts.join(' \u00b7 ')}
              </div>
            )}
          </div>
        </div>
      </div>
      <FollowButton row={row} onFollowChange={onFollowChange} />
    </div>
  );
}

export default SuggestedGolferRow;
