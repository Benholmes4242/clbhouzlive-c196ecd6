/**
 * CommentPreview — Shows top 1-2 real comments below a post,
 * with a "View all X comments" tap target that opens CommentsSheet.
 * Replaces the legacy PostComments.tsx which used mock data.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CommentsPage } from '@/components/clubhouse/cinematic/CommentsPage';
import { MentionText } from '@/components/comments/MentionText';
import { formatDistanceToNow } from 'date-fns';

interface CommentPreviewProps {
  postId: string;
  totalComments: number;
  theme?: 'dark' | 'light' | 'grey';
}

const CommentPreview: React.FC<CommentPreviewProps> = ({ postId, totalComments, theme = 'dark' }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: previewComments = [] } = useQuery({
    queryKey: ['comment-preview', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          user_profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) throw error;
      return (data || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        username: c.user_profiles?.username || c.user_profiles?.display_name || 'Golfer',
        avatar_url: c.user_profiles?.avatar_url || '',
      }));
    },
    enabled: totalComments > 0,
    staleTime: 30_000,
  });

  if (totalComments === 0 && previewComments.length === 0) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <>
      <div className="mt-3 space-y-2">
        {previewComments.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-3">
            <img
              src={comment.avatar_url || '/placeholder.svg'}
              alt={comment.username}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <span className={`font-semibold mr-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
                  {comment.username}
                </span>
                <MentionText
                  text={comment.content}
                  className={`inline ${isDark ? 'text-white/90' : 'text-foreground/85'}`}
                />
              </div>
              <span className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-muted-foreground'}`}>
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}

        {totalComments > previewComments.length && (
          <button
            onClick={() => setIsSheetOpen(true)}
            className={`text-sm transition-colors ${isDark ? 'text-white/70 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
          >
            View all {totalComments} comments
          </button>
        )}
      </div>

      <CommentsPage
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        postId={postId}
        theme={theme}
      />
    </>
  );
};

export default CommentPreview;
