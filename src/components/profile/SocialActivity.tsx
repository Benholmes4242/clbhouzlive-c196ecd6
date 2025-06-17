
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Heart, MessageCircle, Share, Plus } from 'lucide-react';

interface ActivityPost {
  id: string;
  type: 'post' | 'share' | 'comment';
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timeAgo: string;
}

interface SocialActivityProps {
  userId?: string;
  isOwnProfile?: boolean;
  activityVisible?: boolean;
  onVisibilityToggle?: (checked: boolean) => void;
  profileDisplayName?: string;
}

const SocialActivity: React.FC<SocialActivityProps> = ({
  userId,
  isOwnProfile = false,
  activityVisible = true,
  onVisibilityToggle,
  profileDisplayName
}) => {
  // Mock data for now - in a real app this would come from the backend
  const mockPosts: ActivityPost[] = [
    {
      id: '1',
      type: 'post',
      content: 'Just had an amazing round at Augusta National! The greens were in perfect condition. What a privilege to play such an iconic course.',
      image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=200&fit=crop',
      likes: 24,
      comments: 8,
      shares: 3,
      timeAgo: '2d'
    },
    {
      id: '2',
      type: 'post', 
      content: 'Working on my short game this week. Here are 3 tips that have really helped improve my chipping around the greens...',
      likes: 15,
      comments: 12,
      shares: 7,
      timeAgo: '1w'
    }
  ];

  // If this is not the user's own profile and activity is not visible, don't render anything
  if (!isOwnProfile && !activityVisible) {
    return null;
  }

  // Get the correct attribution text
  const getPostAttribution = () => {
    if (isOwnProfile) {
      return "You posted this";
    } else {
      const firstName = profileDisplayName?.split(' ')[0] || 'User';
      return `${firstName} posted this`;
    }
  };

  return (
    <div className="mt-10 px-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Activity</h2>
          <span className="text-sm text-muted-foreground">
            {mockPosts.length} posts
          </span>
        </div>
        {isOwnProfile && (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create a post
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {mockPosts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{getPostAttribution()}</span>
                <span className="text-xs text-muted-foreground">• {post.timeAgo}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm mb-3">{post.content}</p>

            {post.image && (
              <div className="mb-3">
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-red-500">
                  <Heart className="h-4 w-4" />
                  {post.likes}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <Share className="h-4 w-4" />
                  {post.shares}
                </Button>
              </div>
            </div>
          </Card>
        ))}

        <div className="text-center">
          <Button variant="ghost" className="text-sm text-muted-foreground">
            Show all posts →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SocialActivity;
