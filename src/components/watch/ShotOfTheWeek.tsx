import React from 'react';
import { Play, Heart } from 'lucide-react';
import { useWatchFeed } from '@/components/watch/hooks/useWatchFeed';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

interface ShotOfTheWeekProps {
  userId: string | undefined;
}

const ShotOfTheWeek: React.FC<ShotOfTheWeekProps> = ({ userId }) => {
  const { posts, isLoading } = useWatchFeed({
    userId,
    filter: 'top',
    enabled: true,
  });

  const hero = posts[0] ?? null;
  const { open } = useFullscreenFeedStore();

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className="bg-muted animate-pulse"
        style={{
          margin: '0 12px 10px',
          borderRadius: 14,
          height: 175,
        }}
      />
    );
  }

  // No hero — render nothing
  if (!hero) return null;

  const thumbnail = hero.mediaItems[0]?.thumbnailUrl;

  return (
    <div
      className="relative overflow-hidden cursor-pointer active:scale-[0.97] h-[155px] sm:h-[175px] md:h-[195px]"
      style={{
        margin: '0 12px 10px',
        borderRadius: 14,
        transition: 'transform 100ms ease',
      }}
      onClick={() => open([hero], 0)}
    >
      {/* Thumbnail */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4a2e] to-[#0a2015] flex items-center justify-center">
          <Play className="w-10 h-10 text-white opacity-50" />
        </div>
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)',
        }}
      />

      {/* Amber badge */}
      <span
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: '#F7931E',
          color: 'white',
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 6,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        Shot of the week
      </span>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p
          className="line-clamp-2"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'white',
            marginBottom: 3,
          }}
        >
          {hero.caption || 'Untitled'}
        </p>
        <div
          className="flex items-center gap-1.5"
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          <span>{hero.displayName}</span>
          {hero.courseName && (
            <>
              <span>·</span>
              <span>{hero.courseName}</span>
            </>
          )}
          <span>·</span>
          <Heart
            className="w-3 h-3"
            style={{ color: '#F7931E', fill: '#F7931E' }}
          />
          <span>{hero.likeCount}</span>
        </div>
      </div>
    </div>
  );
};

export default ShotOfTheWeek;
