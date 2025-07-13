import React from 'react';
import { VideoPost, UserPostWithType } from './types';
import OptimisticPostCard from '../posts/OptimisticPostCard';

interface GridFeedContentProps {
  optimisticPosts: any[];
  sortedContent: (VideoPost | UserPostWithType)[];
  onPostUpdated: () => void;
  onPostDeleted: () => void;
}

interface MediaItem {
  type: 'video' | 'image';
  url: string;
  id: string;
}

const GridFeedContent: React.FC<GridFeedContentProps> = ({
  optimisticPosts,
  sortedContent,
  onPostUpdated,
  onPostDeleted
}) => {
  const formatPostForGrid = (item: VideoPost | UserPostWithType) => {
    if (item.type === 'user_post') {
      // User post format
      const media: MediaItem[] = item.post_media?.map(m => ({
        type: m.media_type as 'video' | 'image',
        url: m.media_url,
        id: m.id
      })) || [];

      return {
        id: item.id,
        media,
        caption: item.content,
        user: {
          username: item.user.username || item.user.display_name || 'user',
          displayName: item.user.display_name
        },
        socialContext: null
      };
    } else {
      // Video post format
      const media: MediaItem[] = [];
      
      if (item.content.videoUrl) {
        media.push({
          type: 'video',
          url: item.content.videoUrl,
          id: item.id
        });
      } else if (item.content.image) {
        media.push({
          type: 'image',
          url: item.content.image,
          id: item.id
        });
      } else if (item.content.images && item.content.images.length > 0) {
        item.content.images.forEach((imageUrl, index) => {
          media.push({
            type: 'image',
            url: imageUrl,
            id: `${item.id}-${index}`
          });
        });
      }

      return {
        id: item.id,
        media,
        caption: item.content.description,
        user: {
          username: item.user.username || item.user.name || 'user',
          displayName: item.user.name
        },
        socialContext: item.type === 'friend' ? 'Friend Activity' : null
      };
    }
  };

  const gridPosts = sortedContent.map(formatPostForGrid);

  return (
    <div>
      {/* Show optimistic posts first (in original format) */}
      {optimisticPosts.length > 0 && (
        <div className="space-y-4 mb-6">
          {optimisticPosts.map((optimisticPost) => (
            <OptimisticPostCard 
              key={optimisticPost.id} 
              post={optimisticPost}
              onRetry={() => {
                // Handle retry logic here if needed
              }}
            />
          ))}
        </div>
      )}

      {/* Grid Feed Section */}
      <section className="p-4 pb-20">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {gridPosts.map((post) => (
            <div 
              className="relative rounded-lg overflow-hidden transition-transform duration-200 hover:scale-[1.02] aspect-square group" 
              key={post.id}
            >
              {post.media.length > 1 ? (
                <div className="flex overflow-x-scroll scrollbar-hide snap-x snap-mandatory scroll-smooth h-full">
                  {post.media.map((mediaItem, index) => (
                    <div className="flex-none w-full snap-start h-full" key={mediaItem.id || index}>
                      {mediaItem.type === 'video' ? (
                        <video
                          src={mediaItem.url}
                          className="w-full h-full object-cover block aspect-square rounded-lg"
                          muted
                          autoPlay
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={mediaItem.url}
                          alt="Golf media"
                          className="w-full h-full object-cover block aspect-square rounded-lg"
                          loading="lazy"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : post.media.length === 1 ? (
                <>
                  {post.media[0].type === 'video' ? (
                    <video
                      src={post.media[0].url}
                      className="w-full h-full object-cover block aspect-square rounded-lg"
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={post.media[0].url}
                      alt={post.caption || 'Golf Moment'}
                      className="w-full h-full object-cover block aspect-square rounded-lg"
                      loading="lazy"
                    />
                  )}
                </>
              ) : null}

              <div className="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black/55 to-transparent text-white flex justify-between items-end">
                <div className="text-xs leading-relaxed flex-grow mr-2">
                  <p className="font-bold mb-0.5">@{post.user.username}</p>
                  {post.caption && <p className="mb-0.5 opacity-90">{post.caption}</p>}
                  {post.socialContext && (
                    <p className="text-[10px] opacity-80">{post.socialContext}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button className="bg-none border-none text-base cursor-pointer p-0.5 hover:scale-110 transition-transform">❤️</button>
                  <button className="bg-none border-none text-base cursor-pointer p-0.5 hover:scale-110 transition-transform">💬</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default GridFeedContent;