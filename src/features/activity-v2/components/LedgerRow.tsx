/**
 * LedgerRow — universal Activity V2 row.
 * Flex, gap 11, padding '9px 18px'. Left visual (40px squircle) ->
 * body column -> optional right element -> unread dot.
 */

import React, { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { FIGURE } from '@/lib/tokens/type';
import { reviewLabelColor } from '@/components/shared/ReviewGhostScore';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { useSharePromptFor, type SharePromptCandidate } from '../hooks/useSharePrompt';
import type { ActivityFeedRowV2 } from '../hooks/useActivityFeedV2';
import { getActivityLink } from '../utils/activityLinks';
import { getActorRouteByType } from '@/types/actor';
import { resolveKind, composeCommentBody, ACT, type KindSpec } from './ledgerKinds';


const SF_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  row: ActivityFeedRowV2;
  onMarkRead: (id: string) => void;
  onLongPress: (row: ActivityFeedRowV2) => void;
}


/** Bold the leading actor_display_name in a raw body string (prefix match). */
function renderBody(text: string, actorName: string | null | undefined): React.ReactNode {
  if (!actorName || !text.startsWith(actorName)) return text;
  const rest = text.slice(actorName.length);
  return (
    <>
      <span style={{ fontWeight: 700 }}>{actorName}</span>
      {rest}
    </>
  );
}

/**
 * Stacked likers. The liker payload is URLS ONLY (`liker_avatar_urls`) — no ids
 * or names — so a liker avatar can only ever be a PHOTO here. When the list is
 * empty we fall back to the actor, and only then do we pass actor identity, so
 * the initials can never belong to somebody other than the face they replace.
 */
const StackedLikers: React.FC<{
  urls: string[];
  actorUrl?: string | null;
  actorName?: string | null;
  actorUserId?: string | null;
  /** Where the ACTOR face goes when it is the front avatar. */
  onActorPress?: () => void;
}> = ({ urls, actorUrl, actorName, actorUserId, onActorPress }) => {
  const list = urls.filter(Boolean).slice(0, 2);
  const frontIsLiker = !!list[0];
  const front = list[0] ?? actorUrl ?? null;
  const back = list[1] ?? null;
  return (
    <div style={{ position: 'relative', width: 46, height: 40, flexShrink: 0 }}>
      {back && (
        <div style={{ position: 'absolute', left: 12, top: 3 }}>
          <SquircleAvatar
            size={34}
            src={back}
            alt=""
            hairlineRing
          />
        </div>
      )}
      <div style={{ position: 'absolute', left: 0, top: 6 }}>
        <SquircleAvatar
          size={34}
          src={front}
          alt={frontIsLiker ? '' : (actorName ?? '')}
          /* userId here is NOT a route — it only seeds the deterministic
             fallback colour. Navigation comes from onActorPress. */
          userId={frontIsLiker ? null : actorUserId}
          onClick={frontIsLiker ? undefined : onActorPress}
          hairlineRing
        />
      </div>
    </div>
  );
};


const IconTile: React.FC<{ spec: NonNullable<KindSpec['tile']> }> = ({ spec }) => {
  const Icon = spec.icon;
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: spec.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={18} color={spec.fg} strokeWidth={2.2} />
    </div>
  );
};

// -- Follow-back pill (reuses useFollowState / useToggleFollow) --------
const FollowBackPill: React.FC<{ targetUserId: string; name: string }> = ({
  targetUserId,
  name,
}) => {
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const viewerActorType: 'personal' | 'business' = activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? user?.id;
  const toggle = useToggleFollow();
  const { isFollowing: cached } = useFollowState({
    targetActorType: 'personal',
    targetActorId: targetUserId,
    viewerActorType,
    viewerActorId,
  });
  if (cached) return null;
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        if (!user?.id || !viewerActorId) return;
        try {
          await toggle.mutateAsync({
            targetActorType: 'personal',
            targetActorId: targetUserId,
            targetUserId,
            viewerActorType,
            viewerActorId,
            viewerUserId: user.id,
            isFollowing: false,
          });
        } catch {
          /* swallow */
        }
      }}
      disabled={toggle.isPending}
      style={{
        padding: '7px 12px',
        borderRadius: 20,
        background: ACT.INK,
        // §2.2: the label follows the inverted fill, or it is white on white.
        color: ACT.CANVAS,
        fontSize: 12,
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer',
        fontFamily: SF_STACK,
        opacity: toggle.isPending ? 0.6 : 1,
      }}
      aria-label={`Follow back ${name}`}
    >
      {toggle.isPending ? '…' : 'Follow back'}
    </button>
  );
};

const ResolvePill: React.FC = () => (
  <span
    style={{
      padding: '6px 10px',
      borderRadius: 20,
      border: `1px solid ${ACT.AMBER}`,
      color: ACT.AMBER_DEEP,
      fontSize: 11.5,
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      fontFamily: SF_STACK,
    }}
  >
    Resolve <ChevronRight size={12} strokeWidth={2.5} />
  </span>
);

// -- C4 share prompt action ------------------------------------------
// Reuses the RoundDetailSheet path: openPostStudioForCourse. Never posts.
const SharePromptAction: React.FC<{ candidate: SharePromptCandidate }> = ({ candidate }) => {
  const { t } = useTranslation('common');
  const openPostStudioForCourse = usePostStudioStore((st) => st.openPostStudioForCourse);
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    analyticsEvents.track('share_prompt_shown', {
      notif_id: candidate.notif_id,
      notif_type: candidate.notif_type,
      category: candidate.category,
      course_id: candidate.course_id,
      whs_score_id: candidate.whs_score_id,
    });
  }, [candidate]);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        analyticsEvents.track('share_prompt_tapped', {
          notif_id: candidate.notif_id,
          notif_type: candidate.notif_type,
          category: candidate.category,
          course_id: candidate.course_id,
          whs_score_id: candidate.whs_score_id,
        });
        analyticsEvents.track('round_share_opened', {
          whs_score_id: candidate.whs_score_id,
          course_id: candidate.course_id,
          source: 'share_prompt',
        });
        openPostStudioForCourse({
          course: {
            id: candidate.course_id,
            name: candidate.course_name ?? '',
            country: candidate.course_country,
          },
        });
      }}
      style={{
        marginTop: 7,
        padding: '6px 11px',
        borderRadius: 20,
        border: `1px solid ${ACT.AMBER}`,
        background: 'transparent',
        color: ACT.AMBER_DEEP,
        fontSize: 11.5,
        fontWeight: 700,
        fontFamily: SF_STACK,
        cursor: 'pointer',
      }}
    >
      {t('sharePrompt.action')}
    </button>
  );
};

// ---------------------------------------------------------------------

export const LedgerRow: React.FC<Props> = ({ row, onMarkRead, onLongPress }) => {

  const navigate = useNavigate();
  const location = useLocation();
  const spec = resolveKind(row);
  // C4 — only the daily-cap winner returns a candidate; RPC does all gating.
  const sharePrompt = useSharePromptFor(row.notif_id);

  const isUnread = !row.is_read;
  const body = row.message ?? row.title ?? '';
  const data = (row.data && typeof row.data === 'object' ? row.data : {}) as Record<string, string | undefined>;

  const holdTimer = useRef<number | null>(null);
  const heldRef = useRef(false);

  const startHold = () => {
    heldRef.current = false;
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      heldRef.current = true;
      onLongPress(row);
    }, 500);
  };
  const cancelHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  /* AN INERT ROW LOOKS INERT. A notification that resolves to no route (an
     announcement that is the whole message) must not present as a link: no
     button role, no pointer cursor, no navigation. Long-press (mute) still
     works — that is a row action, not a destination. */
  const isInert = !getActivityLink(row);

  const handleClick = () => {
    if (heldRef.current) return;
    if (isUnread) onMarkRead(row.notif_id);
    const url = getActivityLink(row);
    if (!url) return;
    const opensReviewWizard = url.startsWith('/rate-course-v2/') || /^\/courses\/[^/]+\/rate\/?$/.test(url.split('?')[0]);
    if (opensReviewWizard) {
      navigate(url, { state: { backgroundLocation: location } });
      return;
    }
    navigate(url);
  };


  /* THE ACTOR'S DESTINATION IS THE ACTOR THAT IS SHOWN. A business-sourced
     notification renders the business logo and name, so its avatar opens the
     BUSINESS profile. actor_user_id remains the person for blocking, muting and
     the friends filter; actor_kind + actor_route_id are navigation only. */
  const actorRoute = (() => {
    const id = row.actor_route_id ?? row.actor_user_id;
    if (!id) return null;
    return getActorRouteByType(row.actor_kind ?? 'personal', id);
  })();
  /* stopPropagation: the row itself is tappable, so an avatar tap must not also
     fire the row's own destination. */
  const goToActor = actorRoute
    ? (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (heldRef.current) return;
        navigate(actorRoute, row.actor_kind === 'business' ? { state: { source: 'activity' } } : undefined);
      }
    : undefined;

  // ------- Left visual -------
  let leftVisual: React.ReactNode = null;
  if (spec.left === 'tile' && spec.tile) {
    leftVisual = <IconTile spec={spec.tile} />;
  } else if (spec.left === 'stacked_likers') {
    const urls = Array.isArray(row.liker_avatar_urls) ? (row.liker_avatar_urls as string[]) : [];
    leftVisual = (
      <StackedLikers
        urls={urls}
        actorUrl={row.actor_avatar_url}
        actorName={row.actor_display_name}
        actorUserId={row.actor_user_id}
        onActorPress={goToActor}
      />
    );
  } else {
    leftVisual = (
      <SquircleAvatar
        size={40}
        src={row.actor_avatar_url}
        alt={row.actor_display_name ?? ''}
        /* userId seeds the fallback colour only — see goToActor for routing. */
        userId={row.actor_user_id}
        onClick={goToActor}
        hairlineRing
      />
    );
  }


  // ------- Right element -------
  let rightEl: React.ReactNode = null;
  if (spec.right === 'thumb') {
    const src = row.target_poster_url || row.target_course_image || null;
    if (src) {
      rightEl = (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            // §4.3 The fallback shows while loading and forever on a 404, so it
            // is a dark placeholder, not a light one.
            background: `url(${src}) center/cover, ${ACT.NEUTRAL}`,
            border: `1px solid ${ACT.HAIR}`,
            flexShrink: 0,
          }}
        />
      );
    }
  } else if (spec.right === 'follow_back' && row.actor_user_id) {
    rightEl = <FollowBackPill targetUserId={row.actor_user_id} name={row.actor_display_name || 'them'} />;
  } else if (spec.right === 'resolve') {
    rightEl = <ResolvePill />;
  } else if (spec.right === 'rating' && row.target_review_rating != null) {
    rightEl = (
      <span
        style={{
          ...FIGURE,
          fontSize: 15,
          color: reviewLabelColor(row.target_review_rating, 'light'),
          fontFamily: SF_STACK,
        }}
      >
        {row.target_review_rating.toFixed(1)}
      </span>
    );
  }

  // ------- Body text rendering with bold accents -------
  const quoted = composeCommentBody(row);
  let bodyNode: React.ReactNode = quoted ?? renderBody(body, row.actor_display_name);
  if (spec.bold === 'badge_title' && data.badge_title) {
    bodyNode = (
      <>
        {bodyNode}{' '}
        <span style={{ fontWeight: 700, color: ACT.GOLD }}>{data.badge_title}</span>.
      </>
    );
  } else if (spec.bold === 'achievement_name' && data.achievement_name) {
    bodyNode = (
      <>
        {bodyNode}{' '}
        <span style={{ fontWeight: 700, color: ACT.GOLD }}>{data.achievement_name}</span>
      </>
    );
  } else if (spec.bold === 'course_name' && data.course_name && !body.includes(data.course_name)) {
    bodyNode = (
      <>
        {bodyNode} <span style={{ fontWeight: 700 }}>{data.course_name}</span>
      </>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        padding: '9px 18px',
        // §5.2 THE UNREAD STATE. A 4.5% amber wash was legible on white and is
        // nothing on #15171F, so the tint is lifted to carry the same job on
        // dark. The amber dot below is the second, redundant signal.
        background: isUnread ? 'rgba(247,147,30,0.10)' : 'transparent',
        opacity: 1,
        cursor: 'pointer',
        fontFamily: SF_STACK,
        borderBottom: `0.5px solid ${ACT.HAIR}`,
        userSelect: 'none',
      }}
    >
      {leftVisual}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            // BODY. The action sentence is prose, so it reads at the body tier (14),
            // not the READ floor (11). A floor is a minimum, never a target.
            fontSize: 14,
            fontWeight: 500,
            color: ACT.INK,
            lineHeight: 1.35,
            wordBreak: 'break-word',
          }}
        >
          {bodyNode}
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: ACT.INK_45, marginTop: 2 }}>
          {relativeTime(row.created_at)}
        </div>
        {sharePrompt && <SharePromptAction candidate={sharePrompt} />}

      </div>
      {rightEl && <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{rightEl}</div>}
      {isUnread && (
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: ACT.AMBER,
            marginTop: 8,
            flexShrink: 0,
          }}
        />
      )}
    </div>
  );
};

export default LedgerRow;
