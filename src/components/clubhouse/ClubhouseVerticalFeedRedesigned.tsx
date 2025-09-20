import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MapPin } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ExpandableText from './ExpandableText';
import AudioTicker from './AudioTicker';
import EngageButton from './EngageButton';

interface Post {
  id: string;
  title?: string;
  description?: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    homeClub?: string;
    handicap?: number;
  };
  clubName?: string;
  track?: string;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  videoUrl?: string;
}

interface ClubhouseVerticalFeedProps {
  posts: any[];
  onLike: (postId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onCurrentPostChange: (index: number) => void;
}

const ClubhouseVerticalFeedRedesigned = ({ 
  posts, 
  onLike, 
  onLoadMore, 
  hasMore, 
  isLoadingMore,
  onCurrentPostChange 
}: ClubhouseVerticalFeedProps) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Post['user'] | null>(null);
  const [paused, setPaused] = useState(false);

  const handleLike = (postId: string) => {
    onLike(postId);
  };

  const handleShare = () => {
    // Share functionality
  };

  const handleComments = () => {
    // Comments functionality
  };

  const handleSave = () => {
    // Save functionality
  };

  const openProfile = (user: Post['user']) => {
    setSelectedUser(user);
    setProfileOpen(true);
  };

  // Mock data for demonstration
  const mockPosts = posts.length > 0 ? posts : [
    {
      id: '1',
      title: 'Classic Golf',
      description: 'Better than most! Tiger Woods iconic putt. TPC Sawgrass — 2001.',
      user: {
        id: '1',
        name: 'Tiger Woods',
        avatar: '/placeholder.svg',
        homeClub: 'Augusta National',
        handicap: 0
      },
      clubName: 'TPC Sawgrass',
      track: 'Thunderstruck • AC/DC',
      likeCount: 1247,
      commentCount: 89,
      isLiked: false,
      isSaved: false,
      videoUrl: '/placeholder.mp4'
    }
  ];

  return (
    <div className="relative h-full">
      {mockPosts.map((post, index) => (
        <figure key={post.id} className="video-wrap">
          {/* Video Background */}
          <video 
            className="video-el" 
            src={post.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            onPause={() => setPaused(true)}
            onPlay={() => setPaused(false)}
          />
          
          {/* Paused state dynamic blur */}
          {paused && (
            <div className="absolute inset-0 -z-10">
              <video 
                className="w-full h-full object-cover blur-2xl scale-110 opacity-60" 
                muted 
                src={post.videoUrl} 
                autoPlay 
                loop 
              />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="overlay-gradient" />

          {/* Club tag pill - always below header */}
          {post.clubName && (
            <div className="absolute right-3 md:right-6 tag-below-header z-50">
              <div className="inline-flex items-center gap-2 px-3 h-9 md:h-10 rounded-full bg-[hsl(var(--hud-bg))] border border-[hsl(var(--hud-border))] backdrop-blur-md shadow-[var(--hud-shadow)] text-white/95">
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-[15px] font-medium truncate max-w-[52vw] md:max-w-[28vw]">
                  {post.clubName}
                </span>
              </div>
            </div>
          )}

          {/* Metadata section */}
          <div className="absolute bottom-20 left-4 right-24 md:left-8 md:right-28 text-white">
            {/* User info */}
            <button 
              onClick={() => openProfile(post.user)} 
              className="inline-flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="size-6">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback>{post.user.name[0]}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{post.user.name}</span>
            </button>

            {/* Title */}
            {post.title && (
              <h2 className="text-lg md:text-xl font-semibold drop-shadow mb-1">
                {post.title}
              </h2>
            )}

            {/* Description */}
            {post.description && (
              <ExpandableText 
                className="text-sm/5 md:text-base/6 text-white/90 mb-2" 
                maxLines={2} 
                moreLabel="… more"
              >
                {post.description}
              </ExpandableText>
            )}

            {/* Audio ticker */}
            {post.track && (
              <AudioTicker track={post.track} />
            )}
          </div>

          {/* Engagement column */}
          <aside className="absolute right-3 md:right-6 bottom-24 flex flex-col items-center gap-4">
            <EngageButton 
              icon={Heart} 
              count={post.likeCount} 
              active={post.isLiked}
              onClick={() => handleLike(post.id)} 
            />
            <EngageButton 
              icon={MessageCircle} 
              count={post.commentCount} 
              onClick={handleComments} 
            />
            <EngageButton 
              icon={Share2} 
              onClick={handleShare} 
            />
            <EngageButton 
              icon={Bookmark} 
              active={post.isSaved}
              onClick={handleSave} 
            />
          </aside>
        </figure>
      ))}

      {/* Mini-profile slide-up */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent 
          side="bottom" 
          className="max-h-[70vh] rounded-t-2xl bg-neutral-900/95 backdrop-blur-xl border-t border-white/10"
        >
          {selectedUser && (
            <>
              <div className="flex items-center gap-3 p-4">
                <Avatar className="size-12">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-white">{selectedUser.name}</div>
                  <div className="text-white/70 text-sm">
                    {selectedUser.homeClub} • Hcp {selectedUser.handicap}
                  </div>
                </div>
                <button className="rounded-full px-4 py-2 bg-[hsl(var(--accent))] text-black font-semibold">
                  Follow
                </button>
              </div>
              <div className="p-4 pt-0">
                <div className="grid grid-cols-3 gap-2">
                  {/* Mock latest posts thumbnails */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square bg-white/10 rounded-lg" />
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClubhouseVerticalFeedRedesigned;