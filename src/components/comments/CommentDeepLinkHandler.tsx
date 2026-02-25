import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const CommentDeepLinkHandler = React.lazy(() =>
  Promise.resolve({
    default: () => {
      const { postId, commentId } = useParams<{ postId: string; commentId: string }>();
      const navigate = useNavigate();
      const [parentCommentId, setParentCommentId] = useState<string | undefined>();
      const [isLoading, setIsLoading] = useState(true);
      const [postExists, setPostExists] = useState(false);

      useEffect(() => {
        if (!postId) { navigate('/', { replace: true }); return; }

        const init = async () => {
          // Verify post exists
          const { data: post } = await supabase
            .from('posts')
            .select('id')
            .eq('id', postId)
            .maybeSingle();

          if (!post) { navigate('/', { replace: true }); return; }
          setPostExists(true);

          // Check if comment is a reply
          if (commentId) {
            const { data: comment } = await supabase
              .from('post_comments')
              .select('parent_id')
              .eq('id', commentId)
              .maybeSingle();
            if (comment?.parent_id) setParentCommentId(comment.parent_id);
          }

          setIsLoading(false);
        };

        init();
      }, [postId, commentId, navigate]);

      useEffect(() => {
        if (!isLoading && postExists) {
          // Navigate to the post deep link page with comment state
          navigate(`/post/${postId}`, {
            replace: true,
            state: {
              openComments: true,
              initialCommentId: commentId,
              initialParentCommentId: parentCommentId,
            },
          });
        }
      }, [isLoading, postExists, postId, commentId, parentCommentId, navigate]);

      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    },
  })
);

export default CommentDeepLinkHandler;
