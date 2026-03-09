import { createPortal } from 'react-dom';
import { useFullscreenFeed } from './hooks/useFullscreenFeed';
import { FullscreenFeedContent } from './FullscreenFeedContent';

export function FullscreenFeedOverlay() {
  const isOpen = useFullscreenFeed((s) => s.isOpen);
  const posts = useFullscreenFeed((s) => s.posts);
  const startIndex = useFullscreenFeed((s) => s.startIndex);
  const fetchNextPage = useFullscreenFeed((s) => s.fetchNextPage);
  const hasNextPage = useFullscreenFeed((s) => s.hasNextPage);
  const isFetchingNextPage = useFullscreenFeed((s) => s.isFetchingNextPage);

  if (!isOpen || posts.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black"
      style={{ isolation: 'isolate' }}
    >
      <FullscreenFeedContent
        posts={posts}
        startIndex={startIndex}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>,
    document.body
  );
}
