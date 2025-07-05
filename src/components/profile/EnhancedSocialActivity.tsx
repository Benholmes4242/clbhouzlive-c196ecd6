
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useActivityPosts } from './hooks/useActivityPosts';

import { Camera, Play } from 'lucide-react';


interface EnhancedSocialActivityProps {
  userId: string;
  isOwnProfile: boolean;
  profileDisplayName?: string;
}

const EnhancedSocialActivity: React.FC<EnhancedSocialActivityProps> = ({
  userId,
  isOwnProfile,
  profileDisplayName
}) => {
  const { posts, loading, fetchUserPosts } = useActivityPosts(userId);

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Posts</h3>
            <Badge variant="secondary">{posts.length}</Badge>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No posts yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => {
              const hasMedia = post.post_media && post.post_media.length > 0;
              const firstMedia = hasMedia ? post.post_media[0] : null;

              return (
                <div key={post.id} className="aspect-square relative cursor-pointer group overflow-hidden bg-gray-100">
                  <div className="w-full h-full">
                    {hasMedia && firstMedia ? (
                      <>
        {firstMedia.media_type === 'video' ? (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Video unavailable</span>
          </div>
        ) : (
                          <img
                            src={firstMedia.media_url}
                            alt="Post"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              // Handle image load error
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const container = target.parentElement;
                              if (container) {
                                container.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-50');
                                const placeholder = document.createElement('div');
                                placeholder.className = 'flex flex-col items-center justify-center text-gray-400';
                                placeholder.innerHTML = `
                                  <svg class="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                  </svg>
                                  <span class="text-xs">Image</span>
                                `;
                                container.appendChild(placeholder);
                              }
                            }}
                          />
                        )}
                      </>
                    ) : (
                      // Fallback when no media
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-xs">No media</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
};

export default EnhancedSocialActivity;
