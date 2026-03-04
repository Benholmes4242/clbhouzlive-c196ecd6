/**
 * PostDeepLinkPage - Handles /post/:postId deep links
 * TODO: Wire to new media player after integration brief
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const PostDeepLinkPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handleClose = () => {
    navigate('/clubhouse');
  };

  useEffect(() => {
    async function loadPost() {
      if (!postId) {
        setError('No post ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Verify post exists
        const { data, error: fetchError } = await supabase
          .from('posts')
          .select('id')
          .eq('id', postId)
          .maybeSingle();

        if (fetchError || !data) {
          setError('Post not found');
          setIsLoading(false);
          return;
        }

        // TODO: Wire to new media player
        console.log('[PostDeepLinkPage] TODO: Wire to new media player, postId:', postId);
        setIsLoading(false);
      } catch (err) {
        console.error('[PostDeepLinkPage] Error loading post:', err);
        setError('Failed to load post');
        setIsLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 text-white">
        <p className="text-lg mb-4">{error}</p>
        <button 
          onClick={() => navigate('/clubhouse')}
          className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
        >
          Go to Clubhouse
        </button>
      </div>
    );
  }

  // TODO: Render new media player here
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 text-white">
      <p className="text-lg mb-4">Post viewer coming soon</p>
      <p className="text-sm text-white/50 mb-4">Post ID: {postId}</p>
      <button 
        onClick={handleClose}
        className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
      >
        Go to Clubhouse
      </button>
    </div>
  );
};

export default PostDeepLinkPage;