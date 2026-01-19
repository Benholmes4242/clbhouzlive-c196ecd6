import { supabase } from '@/integrations/supabase/client';

export const removeDuplicatePosts = async (userId: string) => {
  try {
    // Get all posts by the user, ordered by creation time
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    if (!posts || posts.length === 0) return;

    // Group posts by content to find duplicates
    const postGroups = new Map<string, typeof posts>();
    
    posts.forEach(post => {
      const content = post.content || '';
      if (!postGroups.has(content)) {
        postGroups.set(content, []);
      }
      postGroups.get(content)!.push(post);
    });

    // Find posts that have duplicates and keep only the first one
    const postsToDelete: string[] = [];
    
    postGroups.forEach((duplicatePosts) => {
      if (duplicatePosts.length > 1) {
        // Keep the first post, mark the rest for deletion
        const toDelete = duplicatePosts.slice(1);
        postsToDelete.push(...toDelete.map(post => post.id));
      }
    });

    if (postsToDelete.length > 0) {
      // Delete associated media first
      await supabase
        .from('post_media')
        .delete()
        .in('post_id', postsToDelete);

      // Delete associated tags - temporarily disabled

      // Delete the duplicate posts
      await supabase
        .from('posts')
        .delete()
        .in('id', postsToDelete);
    }

  } catch (error) {
    console.error('Error removing duplicate posts:', error);
  }
};
