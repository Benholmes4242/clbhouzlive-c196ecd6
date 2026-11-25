import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedCard } from '@/components/feed/FeedCard';
import type { FeedPost } from '@/components/media-system/types/media';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { useTenPostBlocks } from './useTenBlocks';
import { NAV_CLEARANCE } from '@/lib/navClearance';

/** A permalink is the same inline post, not a fullscreen media exception. */
export function TenPostPermalink({ post, openComments = false, initialCommentId }: { post: FeedPost; openComments?: boolean; initialCommentId?: string }) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const blocks = useTenPostBlocks([post.id]);
  const likes = useClubhouseLikes({ userId: user?.id, activeActor });
  const { handleShare } = useClubhouseShare(user?.id);
  const [commentsOpen, setCommentsOpen] = useState(openComments);
  const state = likes.getActiveLikeState(post);
  if (blocks.settled && !blocks.map.has(post.id)) return null;
  return <main className="ten-permalink" style={{ paddingBottom: NAV_CLEARANCE }}>
    <Button variant="ghost" size="icon" className="ten-back" aria-label="Back" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/clubhouse')}><ArrowLeft /></Button>
    <FeedCard post={post} tenPostBlock={blocks.map.get(post.id)} tenPostPending={!blocks.settled} liked={state.isLiked} likeCount={state.count} commentCount={post.commentCount} onLike={() => likes.handleLike(post)} onComment={() => setCommentsOpen(true)} onShare={handleShare} onProfile={() => navigate(`/profile/${post.userId}`)} onOpenMedia={() => {}} currentUserId={user?.id} layout="mediaFirst" />
    <CommentsSheetV2 isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} targetType="post" targetId={post.id} initialCommentId={initialCommentId} />
  </main>;
}