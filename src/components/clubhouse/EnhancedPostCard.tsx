
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share, Camera, Video, Grid3X3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import VideoPreview from '@/components/posts/VideoPreview';

interface ClubhousePost {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    user_type: 'individual' | 'club' | 'pro_shop' | 'academy' | 'tour_event' | 'other' | null;
    business_name: string | null;
    eg_handicap_index?: number | null;
  };
  post_media: {
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
  }[];
  post_tags: {
    id: string;
    entity_type: 'user' | 'golf_club' | 'business';
    entity_id: string;
    name: string;
    username: string | null;
  }[];
  stats?: {
    likes: number;
    comments: number;
    views: number;
  };
}

interface EnhancedPostCardProps {
  post: ClubhousePost;
}

const EnhancedPostCard: React.FC<EnhancedPostCardProps> = ({ post }) => {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [reactions, setReactions] = useState({
    heart: post.stats?.likes || 0,
    golf: Math.floor(Math.random() * 5),
    fire: Math.floor(Math.random() * 3),
    laugh: Math.floor(Math.random() * 2),
    thumbs: Math.floor(Math.random() * 8)
  });

  const displayName = post.user.display_name || post.user.username || 'Golf Enthusiast';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  
  // Find golf club tags
  const golfClubTags = post.post_tags.filter(tag => tag.entity_type === 'golf_club');
  const userTags = post.post_tags.filter(tag => tag.entity_type === 'user');

  // Truncate caption logic
  const captionLines = post.content?.split('\n') || [];
  const shouldTruncate = captionLines.length > 3 || (post.content?.length || 0) > 150;
  const truncatedContent = shouldTruncate && !showFullCaption 
    ? post.content?.substring(0, 150) + '...' 
    : post.content;

  // Generate media type indicator
  const getMediaTypeIcon = () => {
    if (post.post_media.length === 0) return null;
    if (post.post_media.length > 1) return <Grid3X3 className="h-4 w-4" />;
    if (post.post_media[0].media_type === 'video') return <Video className="h-4 w-4" />;
    return <Camera className="h-4 w-4" />;
  };

  // Mock comments for inline preview
  const mockComments = [
    { user: 'golfer_pro', text: 'Amazing shot! What club did you use?' },
    { user: 'links_lover', text: 'This course looks incredible 🔥' }
  ];

  const handleReaction = (type: keyof typeof reactions) => {
    setReactions(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 mb-6">
      <div className="p-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img
              src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#b66b41]/20"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-base">{displayName}</span>
                {post.user.eg_handicap_index && (
                  <span className="text-xs bg-[#b66b41]/10 text-[#b66b41] px-2 py-1 rounded-full">
                    {post.user.eg_handicap_index.toFixed(1)} HCP
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Course and Tagged Friends */}
        {(golfClubTags.length > 0 || userTags.length > 0) && (
          <div className="mb-4 space-y-2">
            {golfClubTags.map((tag) => (
              <div key={tag.id} className="flex items-center text-sm text-[#b66b41]">
                <span className="mr-2">🏌️</span>
                <span className="font-medium">Played at: </span>
                <button className="hover:underline ml-1">{tag.name}</button>
              </div>
            ))}
            {userTags.length > 0 && (
              <div className="flex items-center text-sm text-blue-600">
                <span className="mr-2">👥</span>
                <span className="font-medium">With: </span>
                {userTags.map((tag, index) => (
                  <button key={tag.id} className="hover:underline ml-1">
                    @{tag.username || tag.name}{index < userTags.length - 1 ? ', ' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post Caption with Read More */}
        {post.content && (
          <div className="mb-4">
            <p className="text-sm leading-relaxed">{truncatedContent}</p>
            {shouldTruncate && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-[#b66b41] text-sm font-medium hover:underline mt-1"
              >
                {showFullCaption ? 'Show less' : 'Read more...'}
              </button>
            )}
          </div>
        )}

        {/* Post Media with Type Indicator */}
        {post.post_media.length > 0 && (
          <div className="relative mb-4">
            {/* Media Type Indicator */}
            <div className="absolute top-3 left-3 z-10 bg-black/70 text-white rounded-full p-2">
              {getMediaTypeIcon()}
            </div>
            
            <div className="rounded-xl overflow-hidden group">
              {post.post_media.length === 1 ? (
                post.post_media[0].media_type === 'image' ? (
                  <img
                    src={post.post_media[0].media_url}
                    alt="Post content"
                    className="w-full h-80 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <VideoPreview
                    src={post.post_media[0].media_url}
                    className="w-full h-80"
                    videoId={`clubhouse-${post.id}`}
                  />
                )
              ) : (
                <SwipeCarousel
                  items={post.post_media.map((media, index) => (
                    media.media_type === 'image' ? (
                      <img
                        key={media.id}
                        src={media.media_url}
                        alt={`Post content ${index + 1}`}
                        className="w-full h-80 object-cover object-center"
                        loading="lazy"
                      />
                    ) : (
                      <VideoPreview
                        key={media.id}
                        src={media.media_url}
                        className="w-full h-80"
                        videoId={`clubhouse-${post.id}-${index}`}
                      />
                    )
                  ))}
                  showDots={true}
                  showArrows={false}
                />
              )}
            </div>
          </div>
        )}

        {/* Emoji Reactions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleReaction('heart')}
              className="flex items-center space-x-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-full transition-colors"
            >
              <Heart className="h-5 w-5 fill-current" />
              <span className="text-sm font-medium">{reactions.heart}</span>
            </button>
            <button
              onClick={() => handleReaction('golf')}
              className="flex items-center space-x-1 text-[#b66b41] hover:bg-[#b66b41]/10 px-3 py-2 rounded-full transition-colors"
            >
              <span className="text-lg">⛳</span>
              <span className="text-sm font-medium">{reactions.golf}</span>
            </button>
            <button
              onClick={() => handleReaction('fire')}
              className="flex items-center space-x-1 text-orange-500 hover:bg-orange-50 px-3 py-2 rounded-full transition-colors"
            >
              <span className="text-lg">🔥</span>
              <span className="text-sm font-medium">{reactions.fire}</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.stats?.comments || 0}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Inline Comment Preview */}
        <div className="border-t pt-4">
          <div className="space-y-2">
            {mockComments.slice(0, 2).map((comment, index) => (
              <div key={index} className="flex items-start space-x-2">
                <img
                  src={`https://images.unsplash.com/photo-${1500000000000 + index}?w=32&h=32&fit=crop&crop=face`}
                  alt={comment.user}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <div className="flex-1">
                  <span className="font-medium text-sm mr-2">{comment.user}</span>
                  <span className="text-sm text-muted-foreground">{comment.text}</span>
                </div>
              </div>
            ))}
          </div>
          
          {post.stats?.comments && post.stats.comments > 2 && (
            <button className="text-[#b66b41] text-sm font-medium hover:underline mt-2">
              View all {post.stats.comments} comments
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default EnhancedPostCard;
