import VideosGrid from '@/components/discover/VideosGrid';
import PhotosGrid from '@/components/discover/PhotosGrid';
import { useFollowingFeed } from '@/hooks/explore/useFollowingFeed';

interface FollowingFeedProps {
  onMediaClick: (item: any) => void;
}

export default function FollowingFeed({ onMediaClick }: FollowingFeedProps) {
  const {
    videos,
    photos,
    loading,
    hasMoreVideos,
    hasMorePhotos,
    loadMore,
  } = useFollowingFeed(12);

  const hasNoContent = !loading && videos.length === 0 && photos.length === 0;

  if (hasNoContent) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-xl font-semibold mb-2">No Content Yet</h3>
        <p className="text-muted-foreground">
          Follow some creators to see their latest videos and photos here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Videos section */}
      {videos.length > 0 && (
        <section>
          <h3 className="px-3 sm:px-0 text-sm font-semibold tracking-wide uppercase opacity-70 flex items-center gap-2 mb-3">
            <span>🎥 Recent Videos from People You Follow</span>
          </h3>
          <VideosGrid
            content={videos}
            onMediaClick={onMediaClick}
            isLoading={loading}
            hasMore={hasMoreVideos}
            onLoadMore={loadMore}
          />
        </section>
      )}

      {/* Photos section */}
      {photos.length > 0 && (
        <section>
          <h3 className="px-3 sm:px-0 text-sm font-semibold tracking-wide uppercase opacity-70 flex items-center gap-2 mb-3">
            <span>📸 Recent Photos from People You Follow</span>
          </h3>
          <PhotosGrid
            items={photos}
            onOpenLightbox={(item, index) => onMediaClick(item)}
            isLoading={loading}
            hasMore={hasMorePhotos}
            onLoadMore={loadMore}
          />
        </section>
      )}

      {/* Loading state for empty initial load */}
      {loading && videos.length === 0 && photos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading content...</div>
        </div>
      )}
    </div>
  );
}
