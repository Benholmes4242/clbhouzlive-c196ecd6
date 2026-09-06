/**
 * StoryEngagementBlock (BRIEF_STORY_ENGAGEMENT §S3).
 *
 * The engagement row and comment section at the foot of a story, on BOTH beats:
 * the heart with its count, the comment glyph with its count, a hairline, then
 * the comment section. Rendered below the article and above MORE FROM THE WIRE /
 * MORE AMATEUR NEWS.
 *
 * NOTHING HERE IS NEW MACHINERY. Likes are public.content_reactions through
 * useContentReactions + ReactionAction; comments are public.comments_v2 through
 * CommentsSheetV2, which already takes `targetType` as a prop. The only new
 * thing in the stack is two target-type values.
 *
 * THE SECTION IS ALWAYS PRESENT FOR A MEMBER, INCLUDING AT ZERO — deliberately
 * overriding the app's usual hide-at-zero rule, because a member must be able to
 * see that a story is open for discussion before anyone has discussed it. It
 * never renders "0 comments".
 *
 * A GUEST sees the article and the like count, and no comments at all: reading
 * comments is members-only. The heart is not tappable and no comment count is
 * shown, because the count would describe something they cannot see.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { Button } from '@/components/ui/button';
import { ReactionAction } from '@/components/explore-tab-new/courseled/ReactionAction';
import { CommentAction } from '@/components/explore-tab-new/courseled/CommentAction';
import useContentReactions from '@/components/explore-tab-new/courseled/hooks/useContentReactions';
import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
} from '@/features/tourhub/_shared/tokens';

import { useStoryEngagement, type StoryTargetType } from './useStoryEngagement';

/** The route the download gate's join prompt already uses. */
const JOIN_ROUTE = '/join';

interface Props {
  targetType: StoryTargetType;
  storyId: string;
}

export function StoryEngagementBlock({ targetType, storyId }: Props) {
  const { t } = useTranslation('common');
  const { user } = useSupabaseSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  const targets = useMemo(
    () => [{ type: targetType, id: storyId }] as const,
    [targetType, storyId],
  );
  // content_reactions is canonical for the like, and this hook already carries
  // the optimistic patch and the cross-window reconcile.
  const { stateFor, toggle, unavailable, viewerId } = useContentReactions(targets);
  const like = stateFor(targetType, storyId);

  // The comment count is READ LIVE — stories carry no counter column.
  const { engagementFor } = useStoryEngagement(targetType, [storyId]);
  const commentCount = engagementFor(storyId).commentCount;

  const signedIn = !!viewerId;

  return (
    <div style={{ marginTop: 26, fontFamily: FONT }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '18px 14px',
        }}
      >
        <ReactionAction
          count={like.count}
          reacted={like.mine}
          onToggle={() => toggle(targetType, storyId)}
          label={
            like.mine
              ? t('story.unlikeAria', 'Unlike this story')
              : t('story.likeAria', 'Like this story')
          }
          // A guest sees the honest count with no tappable glyph.
          readOnly={!signedIn}
          hidden={unavailable}
          size={18}
          figureSize={12.5}
        />
        {signedIn && (
          <CommentAction
            count={commentCount}
            onOpen={() => setSheetOpen(true)}
            label={t('story.commentsAria', 'Comments')}
            size={18}
            figureSize={12.5}
          />
        )}
      </div>

      <div style={{ borderTop: `1px solid ${HAIRLINE_INK_10}` }} />

      {signedIn ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSheetOpen(true)}
          className="active:opacity-80"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            width: '100%',
            height: 'auto',
            textAlign: 'left',
            background: 'none',
            border: 'none', borderRadius: 0,
            padding: '14px',
            cursor: 'pointer',
            fontFamily: FONT,
            fontSize: 13,
            lineHeight: 1.45,
            color: commentCount > 0 ? INK : INK_MUTE,
          }}
        >
          <span>{commentCount === 0
            ? t('story.commentsEmpty', 'Be the first to comment')
            : commentCount === 1
              ? t('story.viewComment', 'View 1 comment')
              : t('story.viewComments', 'View all {{count}} comments', { count: commentCount })}</span>
          <ChevronRight size={16} color={INK_MUTE} strokeWidth={2.2} aria-hidden />
        </Button>
      ) : (
        <Link to={JOIN_ROUTE} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px', fontSize: 13, lineHeight: 1.45, color: INK, textDecoration: 'none' }}>
          <span>
            {t('story.guestPrompt', 'Join clbhouz to see the discussion')}
          </span>
          <ChevronRight size={16} color={INK_MUTE} strokeWidth={2.2} aria-hidden />
        </Link>
      )}

      {signedIn && (
        <CommentsSheetV2
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          targetType={targetType}
          targetId={storyId}
        />
      )}
    </div>
  );
}

export default StoryEngagementBlock;
