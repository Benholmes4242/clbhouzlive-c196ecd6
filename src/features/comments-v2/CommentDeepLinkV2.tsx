import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * CommentDeepLinkV2 — /post/:postId/comment/:commentId
 *
 * Thin V2 handler: redirects to /post/:postId with { openComments, initialCommentId }
 * in navigation state. PostDeepLinkPage feeds that into the fullscreen viewer,
 * which now mounts CommentsSheetV2. Comment ids were preserved during the
 * comments_v2 backfill, so OLD notification links resolve to the correct row
 * and CommentsSheetV2's initialCommentId flow scroll-and-highlights it.
 */
const CommentDeepLinkV2: React.FC = () => {
  const { postId, commentId } = useParams<{ postId: string; commentId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!postId) {
      navigate('/', { replace: true });
      return;
    }
    navigate(`/post/${postId}`, {
      replace: true,
      state: {
        openComments: true,
        initialCommentId: commentId ?? null,
      },
    });
  }, [postId, commentId, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
};

export default CommentDeepLinkV2;
