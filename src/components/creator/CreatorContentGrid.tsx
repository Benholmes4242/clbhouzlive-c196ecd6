import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

interface PostMedia {
  id?: string;
  media_url: string;
  poster_url?: string | null;
  duration_seconds?: number | null;
  media_type: string;
  width?: number | null;
  height?: number | null;
}

interface Post {
  id: string;
  content?: string | null;
  post_media?: PostMedia[];
}

interface CreatorContentGridProps {
  posts: Post[];
  filter: 'all' | 'longform' | 'shorts' | 'images';
  onPostTap: (post: Post) => void;
}

// Helper to format duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CreatorContentGrid({ posts, filter, onPostTap }: CreatorContentGridProps) {
  if (filter === 'all') {
    return <AllContentGrid posts={posts} onPostTap={onPostTap} />;
  }
  
  if (filter === 'longform') {
    return <LongFormGrid posts={posts} onPostTap={onPostTap} />;
  }
  
  if (filter === 'shorts') {
    return <ShortsGrid posts={posts} onPostTap={onPostTap} />;
  }
  
  if (filter === 'images') {
    return <ImagesGrid posts={posts} onPostTap={onPostTap} />;
  }
  
  return null;
}

// All content - mixed layout with cards
function AllContentGrid({ posts, onPostTap }: { posts: Post[]; onPostTap: (post: Post) => void }) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onTap={() => onPostTap(post)} />
      ))}
    </div>
  );
}

// Long-form videos - 16:9 aspect ratio cards
function LongFormGrid({ posts, onPostTap }: { posts: Post[]; onPostTap: (post: Post) => void }) {
  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const video = post.post_media?.find(m => m.media_type === 'video');
        if (!video) return null;
        
        return (
          <button
            key={post.id}
            onClick={() => onPostTap(post)}
            className="w-full text-left group"
          >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100">
              <img
                src={video.poster_url || video.media_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80 transition-colors">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>
              {/* Duration badge */}
              {video.duration_seconds && (
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium">
                  {formatDuration(video.duration_seconds)}
                </div>
              )}
            </div>
            {post.content && (
              <p className="mt-2 text-sm text-[#1e293b] line-clamp-2">{post.content}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Shorts - 9:16 portrait grid (3 columns)
function ShortsGrid({ posts, onPostTap }: { posts: Post[]; onPostTap: (post: Post) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => {
        const video = post.post_media?.find(m => m.media_type === 'video');
        if (!video) return null;
        
        return (
          <button
            key={post.id}
            onClick={() => onPostTap(post)}
            className="relative aspect-[9/16] rounded-lg overflow-hidden bg-slate-100 group"
          >
            <img
              src={video.poster_url || video.media_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Play icon on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
            </div>
            {/* Duration badge */}
            {video.duration_seconds && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium">
                {formatDuration(video.duration_seconds)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Images - Square grid (3 columns)
function ImagesGrid({ posts, onPostTap }: { posts: Post[]; onPostTap: (post: Post) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => {
        const image = post.post_media?.find(m => m.media_type === 'image');
        if (!image) return null;
        
        return (
          <button
            key={post.id}
            onClick={() => onPostTap(post)}
            className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group"
          >
            <img
              src={image.media_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        );
      })}
    </div>
  );
}

// Post card for "All" view
function PostCard({ post, onTap }: { post: Post; onTap: () => void }) {
  const media = post.post_media?.[0];
  const isVideo = media?.media_type === 'video';
  
  return (
    <button
      onClick={onTap}
      className="w-full text-left bg-white rounded-xl border border-[#e2e8f0] overflow-hidden hover:shadow-md transition-shadow"
    >
      {media && (
        <div className={cn(
          "relative w-full bg-slate-100",
          isVideo ? "aspect-video" : "aspect-square"
        )}>
          <img
            src={isVideo ? (media.poster_url || media.media_url) : media.media_url}
            alt=""
            className="w-full h-full object-cover"
          />
          {isVideo && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
              {media.duration_seconds && (
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium">
                  {formatDuration(media.duration_seconds)}
                </div>
              )}
            </>
          )}
        </div>
      )}
      {post.content && (
        <div className="p-3">
          <p className="text-sm text-[#1e293b] line-clamp-3">{post.content}</p>
        </div>
      )}
    </button>
  );
}
