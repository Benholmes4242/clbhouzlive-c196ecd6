import React from 'react';
import { Heart, MessageCircle, Share2, RefreshCw } from 'lucide-react';
import { useFeedPosts } from '@/hooks/useFeedPosts';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import VideoPlayer from '@/components/feed/VideoPlayer';

const TrendingFeed = () => {
  const { user } = useSupabaseSession();
  const { posts, loading, error, refetch } = useFeedPosts();

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return `${Math.floor(diffInHours / 168)}w`;
  };

  const renderContentWithTags = (content: string) => {
    // Convert @mentions to clickable blue links
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span 
            key={index} 
            className="text-blue-500 hover:text-blue-600 cursor-pointer"
            onClick={() => console.log('Navigate to profile:', part)}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-4">🏌️‍♂️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to clbhouz!</h3>
        <p className="text-gray-600 mb-4">Sign in to see posts from golfers you follow</p>
        <button 
          onClick={() => window.location.href = '/auth'}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
            <div className="flex items-start space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded-lg mb-3"></div>
            <div className="flex space-x-6">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load feed</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={refetch}
          className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors mx-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // Empty state when user doesn't follow anyone
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your feed is empty</h3>
        <p className="text-gray-600 mb-4">
          Follow some golfers to see their posts in your feed. Try searching for users or explore the community!
        </p>
        <div className="flex space-x-3 justify-center">
          <button 
            onClick={() => window.location.href = '/explore'}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Explore
          </button>
          <button 
            onClick={() => window.location.href = '/search'}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Find Users
          </button>
        </div>
      </div>
    );
  }

  // Render actual feed posts
  return (
    <div className="space-y-4 md:space-y-5">
      {posts.map((post) => (
        <div 
          key={post.id} 
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200"
        >
          {/* Author Section */}
          <div className="flex items-start space-x-3 mb-3">
            <img
              src={post.author.profile_photo_url}
              alt={post.author.display_name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <h3 className="font-semibold text-black text-sm truncate">{post.author.display_name}</h3>
                {post.author.verified && (
                  <span className="text-blue-500 text-xs">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(post.created_at)}</p>
            </div>
          </div>

          {/* Post Content */}
          {post.content && (
            <div className="mb-3">
              <p className="text-sm text-gray-900 leading-relaxed">
                {renderContentWithTags(post.content)}
              </p>
            </div>
          )}

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="mb-3 relative">
              <div className="feed-media-container w-full aspect-[4/3] rounded-lg overflow-hidden relative">
                {post.media[0].media_type === 'video' ? (
                  <VideoPlayer
                    src={post.media[0].media_url}
                    courseName={post.golf_course?.name}
                  />
                ) : (
                  <>
                    <img
                      src={post.media[0].media_url}
                      alt="Post content"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop';
                      }}
                    />
                    {post.golf_course && (
                      <div className="course-tag absolute top-2 right-2 bg-black/50 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                        {post.golf_course.name}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Interaction Icons */}
          <div className="flex items-center space-x-6 pt-2">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
              <Heart className="h-4 w-4" />
              <span className="text-sm">{post.engagement_stats.likes}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{post.engagement_stats.comments}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
              <Share2 className="h-4 w-4" />
              <span className="text-sm">{post.engagement_stats.shares}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrendingFeed;