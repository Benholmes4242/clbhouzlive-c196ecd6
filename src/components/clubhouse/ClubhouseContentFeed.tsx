
import React from 'react';
import UserPost from '@/components/posts/UserPost';
import LoadingSkeleton from '@/components/feed/LoadingSkeleton';
import { useClubhouseContent } from '@/hooks/useClubhouseContent';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClubhouseContentFeedProps {
  searchQuery?: string;
}

const ClubhouseContentFeed = ({ searchQuery = '' }: ClubhouseContentFeedProps) => {
  const { posts, loading, refetch } = useClubhouseContent();

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const content = post.content?.toLowerCase() || '';
    
    return content.includes(searchLower);
  });

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (filteredPosts.length === 0) {
    return (
      <div className="text-center py-12">
        {searchQuery ? (
          <>
            <p className="text-muted-foreground text-lg mb-4">
              No posts found for "{searchQuery}"
            </p>
            <p className="text-muted-foreground text-sm">
              Try searching for different terms like "tips", "wedge play", or "hole in one"
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-lg mb-4">No posts found in the clubhouse yet.</p>
            <p className="text-muted-foreground text-sm">
              Check back later for new content from the community!
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {searchQuery ? `Search Results (${filteredPosts.length})` : 'Community Posts'}
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <UserPost 
            key={post.id} 
            post={post} 
            onPostUpdated={refetch}
            onPostDeleted={refetch}
          />
        ))}
      </div>
    </div>
  );
};

export default ClubhouseContentFeed;
