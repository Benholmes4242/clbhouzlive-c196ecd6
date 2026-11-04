/**
 * BRIEF_SUGGESTED_GOLFERS S3.1 - the Activity block. Three reason-led rows,
 * placed inside the feed after the first day group, with a SEE ALL link to
 * /find-people. Renders nothing unless the viewer follows fewer than
 * SUGGESTION_FOLLOW_THRESHOLD people and the rpc actually returned reasons.
 *
 * WF2 §9 (privacy fix): the block now reads usePeopleSuggestions
 * (get_people_suggestions) instead of useSuggestedGolfers
 * (get_suggested_golfers, which returned handicaps WITHOUT a visibility
 * check). handicap_index arrives null unless the viewer may see it, so the
 * handicap appears only when the server allows it. Rows show the Find people
 * golferReason / golferFigures lines; the gate and the 3-row layout are
 * unchanged. See all is mute, not amber (amber is reserved for the brand
 * mark and VerifiedBadge).
 */
import { useTranslation } from 'react-i18next';
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { useNavigate } from 'react-router-dom';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { getProfilePathById } from '@/lib/profileRoutes';
import {
  RowAvatar,
  FollowButton,
  ROW_FONT,
  type RowActorLike,
} from '@/features/social-lists-v2/rowParts';
import { usePeopleSuggestions } from '@/features/find-people/usePeopleSuggestions';
import {
  golferFigures,
  golferReason,
  type PersonSuggestion,
} from '@/features/find-people/findPeopleRules';
import { useSuggestionGate } from './useSuggestedGolfers';

const MUTE = 'rgba(248,250,252,0.62)';

export function SuggestedGolfersBlock({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const gate = useSuggestionGate();
  const q = usePeopleSuggestions(rows, gate.eligible);

  if (!gate.eligible) return null;
  const people = (q.data ?? []).slice(0, rows);
  if (people.length === 0) return null;

  return (
    <section style={{ fontFamily: ROW_FONT, padding: '10px 0 6px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '8px 18px 6px',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.DIM,
          }}
        >
          {t('suggestedGolfers.heading')}
        </div>
        <button
          type="button"
          onClick={() => navigate('/find-people')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: MUTE,
            fontFamily: ROW_FONT,
            cursor: 'pointer',
          }}
        >
          {t('suggestedGolfers.seeAll')}
        </button>
      </div>
      <div
        style={{
          background: A.PANEL,
          border: `0.5px solid ${A.BORDER}`,
          borderRadius: 14,
          margin: '0 14px',
          overflow: 'hidden',
        }}
      >
        {people.map((g, i) => (
          <BlockGolferRow key={g.user_id} golfer={g} showDivider={i < people.length - 1} />
        ))}
      </div>
    </section>
  );
}

/** The block's row: SuggestedGolferRow's layout, but the reason and figures
 *  come from the Find people rules (WF2 §9). */
function BlockGolferRow({
  golfer,
  showDivider = false,
}: {
  golfer: PersonSuggestion;
  showDivider?: boolean;
}) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const row: RowActorLike = {
    actor_type: 'personal',
    actor_id: golfer.user_id,
    display_name: golfer.display_name,
    username: golfer.username,
    avatar_url: golfer.profile_photo_url,
    viewer_follows: false,
  };
  const reason = golferReason(golfer);
  const figures = golferFigures(golfer);

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
        {/* REASON FIRST - AXIS 9 / 0.14em, every reason line is dim (amber is brand mark/VerifiedBadge only). */}
        {reason ? (
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: A.DIM,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 6,
            }}
          >
            {t(reason.key, { ...reason.vars, defaultValue: reason.def })}
          </div>
        ) : null}
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
              <InlineProMemberName userId={golfer.user_id}>{golfer.display_name ?? golfer.username ?? ''}</InlineProMemberName>
            </div>
            {figures ? (
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: A.DIM,
                  marginTop: 1,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {figures}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <FollowButton row={row} />
    </div>
  );
}

export default SuggestedGolfersBlock;
