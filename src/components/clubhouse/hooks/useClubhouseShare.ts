import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { FeedPost } from '@/components/media-system/types/media';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * Manages share, report, and not-interested actions for the Clubhouse feed.
 */
export function useClubhouseShare(userId: string | undefined) {
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

  const handleShare = useCallback((post: FeedPost | null) => {
    if (!post) return;
    analyticsEvents.track('video_share', { post_id: post.id });
    analyticsEvents.track('post_share', { post_id: post.id });
    if (navigator.share) {
      navigator.share({
        title: post.displayName,
        text: post.caption || undefined,
        url: `${window.location.origin}/post/${post.id}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast.success('Link copied');
    }
  }, []);

  const handleReport = useCallback(async (post: FeedPost | null) => {
    if (!userId || !post) return;
    const { error } = await (supabase as any)
      .from('post_reports')
      .insert({ post_id: post.id, reporter_id: userId });
    if (!error) {
      toast.success('Report submitted');
    }
    setMoreOptionsOpen(false);
  }, [userId]);

  const handleNotInterested = useCallback(async (post: FeedPost | null) => {
    if (!userId || !post) return;
    const { error } = await (supabase as any)
      .from('post_dismissals')
      .insert({ post_id: post.id, user_id: userId });
    if (!error) {
      toast('Noted — we will show fewer like this');
    }
    setMoreOptionsOpen(false);
  }, [userId]);

  return { moreOptionsOpen, setMoreOptionsOpen, handleShare, handleReport, handleNotInterested };
}
