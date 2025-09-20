import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import ExpandableText from './ExpandableText';
import AudioTicker from './AudioTicker';
import EngageButton from './EngageButton';

interface ClubhousePost {
  id: string;
  videoUrl: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    homeClub?: string;
    handicap?: number;
  };
  title: string;
  description: string;
  clubName?: string;
  audioTrack?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
}

interface ClubhouseVerticalFeedRedesignedProps {
  posts: ClubhousePost[];
  onLike: (postId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onCurrentPostChange?: (index: number) => void;
}

const ClubhouseVerticalFeedRedesigned: React.FC<ClubhouseVerticalFeedRedesignedProps> = ({
  posts,
  onLike,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onCurrentPostChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClubhousePost['user'] | null>(null);
  const [pausedVideos, setPausedVideos] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPost = posts[currentIndex];

  const openProfile = (user: ClubhousePost['user']) => {
    setSelectedUser(user);
    setProfileOpen(true);
  };

  const handleVideoPlay = (postId: string) => {
    setPausedVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });
  };

  const handleVideoPause = (postId: string) => {
    setPausedVideos(prev => new Set(prev).add(postId));
  };

  const share = () => {
    // Share functionality
    console.log('Share post:', currentPost?.id);
  };

  if (!currentPost) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        <p>No posts available</p>
      </div>
    );
  }

  const isPaused = pausedVideos.has(currentPost.id);

  return (
    <div ref={containerRef} className="h-screen relative">
      {/* Video Container */}
      <figure className="video-wrap">
        {/* Main Video */}
        <video
          className="video-el"
          src={currentPost.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          onPlay={() => handleVideoPlay(currentPost.id)}
          onPause={() => handleVideoPause(currentPost.id)}
        />

        {/* Paused State Blur Background */}
        {isPaused && (
          <div className="absolute inset-0 -z-10">
            <video
              className="w-full h-full object-cover blur-2xl scale-110 opacity-60"
              src={currentPost.videoUrl}
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="overlay-gradient" />

        {/* Club Tag Pill - Always below header */}
        {currentPost.clubName && (
          <div className="absolute right-3 md:right-6 tag-below-header z-50">
            <div className="inline-flex items-center gap-2 px-3 h-9 md:h-10 rounded-full
                            bg-[hsl(var(--hud-bg))] border border-[hsl(var(--hud-border))]
                            backdrop-blur-md shadow-[var(--hud-shadow)] text-white/95">
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-[15px] font-medium truncate max-w-[52vw] md:max-w-[28vw]">
                {currentPost.clubName}
              </span>
            </div>
          </div>
        )}

        {/* Metadata Section */}
        <div className="absolute bottom-20 left-4 right-24 md:left-8 md:right-28 text-white z-40">
          {/* User Info */}
          <button 
            onClick={() => openProfile(currentPost.user)}
            className="inline-flex items-center gap-2 mb-2"
          >
            <Avatar className="size-6">
              <AvatarImage src={currentPost.user.avatar} />
              <AvatarFallback>{currentPost.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-white">{currentPost.user.name}</span>
          </button>

          {/* Title */}
          <h2 className="text-lg md:text-xl font-semibold drop-shadow-lg">
            {currentPost.title}
          </h2>

          {/* Expandable Description */}
          <ExpandableText 
            className="mt-1 text-sm leading-5 md:text-base md:leading-6 text-white/90 drop-shadow" 
            maxLines={2} 
            moreLabel="… more"
          >
            {currentPost.description}
          </ExpandableText>

          {/* Audio Ticker */}
          {currentPost.audioTrack && (
            <AudioTicker track={currentPost.audioTrack} className="mt-2" />
          )}
        </div>

        {/* Engagement Controls */}
        <aside className="absolute right-3 md:right-6 bottom-24 flex flex-col items-center gap-4 z-40">
          <EngageButton
            icon={Heart}
            count={currentPost.likes}
            active={currentPost.isLiked}
            onClick={() => onLike(currentPost.id)}
          />
          <EngageButton
            icon={MessageCircle}
            count={currentPost.comments}
            onClick={() => console.log('Open comments')}
          />
          <EngageButton
            icon={Share2}
            onClick={share}
          />
          <EngageButton
            icon={Bookmark}
            active={currentPost.isSaved}
            onClick={() => console.log('Toggle save')}
          />
        </aside>
      </figure>

      {/* Mini-Profile Sheet */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent 
          side="bottom" 
          className="max-h-[70vh] rounded-t-2xl bg-neutral-900/95 backdrop-blur-xl border-t border-white/10"
        >
          {selectedUser && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="size-12">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-white">{selectedUser.name}</div>
                  {selectedUser.homeClub && (
                    <div className="text-white/70 text-sm">
                      {selectedUser.homeClub}
                      {selectedUser.handicap && ` • Hcp ${selectedUser.handicap}`}
                    </div>
                  )}
                </div>
                <button className="ml-auto rounded-full px-4 py-2 bg-[hsl(var(--accent))] text-black font-semibold">
                  Follow
                </button>
              </div>
              
              {/* Latest posts thumbnails placeholder */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="aspect-square bg-neutral-800 rounded-lg" />
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClubhouseVerticalFeedRedesigned;