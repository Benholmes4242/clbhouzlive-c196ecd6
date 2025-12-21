import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, UserPlus, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFollow } from '@/hooks/useFollow';
import { useLongFormVideos } from '@/hooks/useLongFormVideos';
import { LongFormVideoTile } from '@/components/videos/LongFormVideoTile';
import { Button } from '@/components/ui/button';

/**
 * CreatorPage - YouTube-style channel page for creators
 * 
 * ROUTING RULE:
 * - Videos tab creator clicks → /creator/:userId
 * - Watch tab creator clicks → /profile/:userId (unchanged)
 * 
 * CONTENT RULE:
 * - Creator Page shows ONLY long-form videos (≥3 min)
 * - No photos, no shorts, no personal activity
 */

type CreatorTab = 'videos' | 'about';
type VideoSort = 'latest' | 'popular';

export const CreatorPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [activeTab, setActiveTab] = useState<CreatorTab>('videos');
  const [sortBy, setSortBy] = useState<VideoSort>('latest');

  // Fetch creator profile data
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);

  // Check if viewing own page
  const isOwnPage = user?.id === userId;

  // Follow state
  const { isFollowing, toggle: toggleFollow, busy: followLoading, ensureInitial } = useFollow(userId);

  // Initialize follow state
  useEffect(() => {
    if (userId) {
      ensureInitial();
    }
  }, [userId, ensureInitial]);

  // Fetch creator's long-form videos
  const { videos, isLoading: videosLoading } = useLongFormVideos({
    creatorUserId: userId,
    sort: sortBy,
    limit: 50,
  });

  const isFollowingCreator = isFollowing === 'following';

  const handleBack = () => {
    navigate(-1);
  };

  const handleVideoClick = (videoId: string) => {
    // TODO: Navigate to video player
    console.log('Open video:', videoId);
  };

  const handleCreatorClick = (creatorUserId: string) => {
    // Already on creator page, just scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="h-14 bg-muted" />
          <div className="px-5 py-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-5 bg-muted rounded w-32 mb-2" />
                <div className="h-4 bg-muted rounded w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-5">
          <p className="text-muted-foreground">Creator not found</p>
          <Button variant="outline" onClick={handleBack} className="mt-4">
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium truncate">{profile.display_name || profile.username}</span>
        </div>
      </div>

      {/* Channel header */}
      <div className="px-5 py-6">
        <div className="flex items-start gap-4">
          {/* Creator avatar */}
          <div className="shrink-0 w-20 h-20 rounded-full overflow-hidden bg-muted border border-border">
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile.display_name || profile.username || 'Creator'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-2xl font-medium text-primary">
                {(profile.display_name || profile.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Creator info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">
              {profile.display_name || profile.username || 'Creator'}
            </h1>
            {profile.username && (
              <p className="text-sm text-muted-foreground mt-0.5">
                @{profile.username}
              </p>
            )}
            {/* Video count */}
            <p className="text-sm text-muted-foreground mt-1">
              {videosLoading ? 'Loading...' : `${videos.length} video${videos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* CTA button */}
        <div className="mt-4">
          {isOwnPage ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSettingsClick}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Creator settings
            </Button>
          ) : (
            <Button
              variant={isFollowingCreator ? 'outline' : 'default'}
              size="sm"
              onClick={toggleFollow}
              disabled={followLoading}
              className="w-full"
            >
              {isFollowingCreator ? (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex px-5">
          <button
            onClick={() => setActiveTab('videos')}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === 'videos' 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Videos
            {activeTab === 'videos' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === 'about' 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            About
            {activeTab === 'about' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'videos' ? (
        <div className="px-5 pt-4">
          {/* Sort dropdown */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">
              {videos.length} video{videos.length !== 1 ? 's' : ''}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as VideoSort)}
              className="text-sm bg-transparent border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="latest">Latest</option>
              <option value="popular">Popular</option>
            </select>
          </div>

          {/* Video list */}
          {videosLoading ? (
            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted rounded-xl mb-3" />
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <p className="text-muted-foreground text-center">
                No videos yet
              </p>
              {isOwnPage && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Upload long-form videos (3+ minutes) to see them here
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {videos.map((video) => (
                <LongFormVideoTile
                  key={video.id}
                  video={video}
                  onVideoClick={handleVideoClick}
                  onCreatorClick={handleCreatorClick}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* About tab */
        <div className="px-5 pt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">About</h2>
          {profile.bio ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No bio available
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatorPage;
