import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VideoCardMenu } from '@/components/videos-tab/VideoCardMenu';
import { Pin } from '../proshop/Pin';
import { ExpandableCaption } from '@/components/posts/ExpandableCaption';

function formatHMS(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export interface VideoFeedCardProps {
  post: FeedPost;
  index: number;
  allPosts: FeedPost[];
  userId?: string;
}

function VideoFeedCardInner({ post, index, allPosts, userId }: VideoFeedCardProps) {
  const navigate = useNavigate();

  const firstVideo = post.mediaItems.find((m) => m.type === 'video');
  const thumbnail = firstVideo?.thumbnailUrl || firstVideo?.imageUrl || '';
  const duration = firstVideo?.duration ?? 0;
  const courseName = (post as any).courseName ?? null;

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  const handleTap = () => {
    useFullscreenFeedStore.getState().open(allPosts, index);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/video/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.caption || 'Check out this video', url: shareUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied');
      } catch {
        /* clipboard unavailable */
      }
    }
  };

  return (
    <article style={{ padding: '0 0 18px' }}>
      <button
        type="button"
        onClick={handleTap}
        className="block w-full text-left active:scale-[0.99] transition-transform"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 0,
          overflow: 'hidden',
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
        aria-label={`Play video by ${post.displayName}`}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}

        {courseName ? (
          <div style={{ position: 'absolute', top: 8, left: 8, maxWidth: 'calc(100% - 80px)' }}>
            <Pin variant="dark" icon={<span style={{ fontSize: 9 }}>📍</span>}>
              {courseName}
            </Pin>
          </div>
        ) : null}

        {duration > 0 ? (
          <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
            <Pin variant="dark">{formatHMS(duration)}</Pin>
          </div>
        ) : null}

      </button>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'flex-start', padding: '0 16px' }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.userId}`); }}
          style={{ background: 'none', border: 'none', padding: 0, flexShrink: 0 }}
          aria-label={`View ${post.displayName}'s profile`}
        >
          <SquircleAvatar
            src={post.avatarUrl}
            alt={post.displayName}
            userId={post.userId}
            size="sm"
            hideRing
          />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <ExpandableCaption
            lines={2}
            style={{
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.3,
              color: '#0F172A',
              letterSpacing: '-0.01em',
            }}
          >
            {post.caption || `${post.displayName} on Clbhouz`}
          </ExpandableCaption>

          <div
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: 'rgba(15,23,42,0.55)',
              marginTop: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {post.displayName || post.username || 'Clbhouz'}
            {timeAgo ? <> · {timeAgo}</> : null}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 6,
              color: 'rgba(15,23,42,0.40)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Heart size={13} />
              <span style={{ fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {formatCompact(post.likeCount)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MessageCircle size={13} />
              <span style={{ fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {formatCompact(post.commentCount)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, marginRight: -8 }}>
          <VideoCardMenu postId={post.id} userId={userId} onShare={handleShare} />
        </div>
      </div>
    </article>
  );
}

const VideoFeedCard = memo(VideoFeedCardInner);
export default VideoFeedCard;
