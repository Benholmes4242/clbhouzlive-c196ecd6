import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UserPlus, MoreHorizontal, Loader2, Settings, MapPin, Check, Play, Film } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCreatorFollow } from '@/hooks/useCreatorFollow';
import { useCreatorPageBySlug } from '@/hooks/useCreatorPageBySlug';
import { useInfiniteLongFormVideos } from '@/hooks/useInfiniteLongFormVideos';
import { useInfiniteShortsVideos } from '@/hooks/useInfiniteShortsVideos';
import { useCreatorStats } from '@/hooks/useCreatorStats';
import { VideoSection } from '@/components/videos/VideoSection';
import { ActivityGridV2 } from '@/components/profile/activity/v2';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import { CreatorAboutTab } from '@/components/creator/CreatorAboutTab';
import { useMediaAutoplay } from '@/media';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * CreatorPage - YouTube-style channel page for creators
 * 
 * TABS:
 * - Videos: Long-form content (≥4 min) with infinite scroll
 * - Shorts: Short-form content (<4 min) with infinite scroll
 * - About: Full bio, stats, links
 * 
 * ROUTING:
 * - /creator/:userId - Main creator page
 * - /creator/:userId?tab=videos|shorts|about - Deep link to specific tab
 */

// Background color - matches profile page (slate-50)
const BG_COLOR = '#f8fafc';

const CREATOR_TABS = [
  { id: 'videos', label: 'Videos', icon: Film },
  { id: 'shorts', label: 'Shorts', icon: Play },
  { id: 'about', label: 'About', icon: null },
] as const;

type CreatorTab = typeof CREATOR_TABS[number]['id'];

export const CreatorPage: React.FC = () => {
  // Route param is now slug (or userId for legacy compatibility)
  const { userId: slugOrUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSupabaseSession();

  // Read tab from URL, default to 'videos'
  const urlTab = searchParams.get('tab') as CreatorTab | null;
  const [activeTab, setActiveTab] = useState<CreatorTab>(
    urlTab && CREATOR_TABS.some(t => t.id === urlTab) ? urlTab : 'videos'
  );

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: string) => {
    const newTab = tab as CreatorTab;
    setActiveTab(newTab);
    if (newTab === 'videos') {
      // Remove tab param for default
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', newTab);
    }
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Scroll restoration for navigation
  const { savePosition } = useScrollRestoration('creator-page');

  // Unified grid autoplay
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
  });

  // Fetch creator page by slug (entity-based)
  const { data: creatorPage, isLoading: creatorPageLoading } = useCreatorPageBySlug(slugOrUserId);
  
  // Fallback: Fetch user profile for backward compatibility
  const { data: profile, isLoading: profileLoading } = useUserProfile(creatorPage?.owner_user_id || slugOrUserId);

  // Fetch creator stats - use owner_user_id if we have a creator page
  const { data: stats, isLoading: statsLoading } = useCreatorStats(creatorPage?.owner_user_id || slugOrUserId);

  // Check if viewing own page
  const isOwnPage = user?.id === (creatorPage?.owner_user_id || slugOrUserId);

  // Follow state - use creator page ID for entity-based following
  const { isFollowing, toggle: toggleFollow, busy: followLoading, ensureInitial } = useCreatorFollow(creatorPage?.id);

  // Initialize follow state
  useEffect(() => {
    if (creatorPage?.id) {
      ensureInitial();
    }
  }, [creatorPage?.id, ensureInitial]);

  // Fetch long-form videos (≥4 min) with infinite scroll
  const {
    items: longFormVideos,
    isLoading: videosLoading,
    hasMore: hasMoreVideos,
    fetchNextPage: fetchMoreVideos,
    isFetchingNextPage: isFetchingMoreVideos,
  } = useInfiniteLongFormVideos({
    section: 'recommended',
    creatorUserId: creatorPage?.owner_user_id || slugOrUserId,
    minDuration: 240,
  });

  // Fetch shorts (<4 min) with infinite scroll
  const {
    items: shortsRaw,
    isLoading: shortsLoading,
    hasMore: hasMoreShorts,
    fetchNextPage: fetchMoreShorts,
    isFetchingNextPage: isFetchingMoreShorts,
  } = useInfiniteShortsVideos({
    creatorUserId: creatorPage?.owner_user_id || slugOrUserId,
    maxDuration: 240,
  });

  // Transform shorts to UnifiedMediaItem format for ActivityGridV2
  const shorts: UnifiedMediaItem[] = useMemo(() => 
    shortsRaw.map((short, index) => ({
      id: short.id,
      postId: short.id,
      type: 'video' as const,
      url: short.mediaUrl || '',
      thumbnailUrl: short.thumbnailUrl,
      playbackUrl: short.mediaUrl,
      durationSeconds: short.durationSeconds,
      likes: short.likes,
      creator: {
        id: short.creatorUserId,
        name: short.creatorName,
        avatar: short.creatorAvatarUrl,
      },
      isAutoplayCandidate: index === 0 || index % 3 === 0,
      sortIndex: index,
    })), [shortsRaw]);

  // Infinite scroll observers
  const videosObserverRef = useRef<HTMLDivElement>(null);
  const shortsObserverRef = useRef<HTMLDivElement>(null);

  // Videos tab infinite scroll
  useEffect(() => {
    if (activeTab !== 'videos' || !hasMoreVideos || videosLoading || isFetchingMoreVideos) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('[CreatorPage] 📜 Loading more videos...');
          fetchMoreVideos();
        }
      },
      { rootMargin: '400px' }
    );

    if (videosObserverRef.current) {
      observer.observe(videosObserverRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab, hasMoreVideos, videosLoading, isFetchingMoreVideos, fetchMoreVideos]);

  // Shorts tab infinite scroll
  useEffect(() => {
    if (activeTab !== 'shorts' || !hasMoreShorts || shortsLoading || isFetchingMoreShorts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('[CreatorPage] 📜 Loading more shorts...');
          fetchMoreShorts();
        }
      },
      { rootMargin: '400px' }
    );

    if (shortsObserverRef.current) {
      observer.observe(shortsObserverRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab, hasMoreShorts, shortsLoading, isFetchingMoreShorts, fetchMoreShorts]);

  const hasPreloadedFirst = useRef(false);

  // Eager preload first video's HLS manifest on mount
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current || !longFormVideos?.length) return;
    
    const firstVideo = longFormVideos[0];
    if (firstVideo?.mediaUrl) {
      const uid = uidFromNode({ media_url: firstVideo.mediaUrl });
      if (uid) {
        preloadHlsManifest(generateStreamHlsUrl(uid));
        hasPreloadedFirst.current = true;
      }
    }
  }, [longFormVideos]);

  const isFollowingCreator = isFollowing === 'following';

  const handleVideoClick = (videoId: string) => {
    savePosition();
    navigate(`/video/${videoId}`, {
      state: { fromCreatorPage: true }
    });
  };

  const handleShortClick = (shortId: string) => {
    savePosition();
    navigate(`/watch?v=${shortId}`, {
      state: { fromCreatorPage: true }
    });
  };

  const handleCreatorClick = () => {
    // Already on creator page, just scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG_COLOR }}>
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG_COLOR }}>
        <div className="text-center px-5">
          <p className="text-muted-foreground">Creator not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Use creator page data first, fall back to personal profile
  const displayName = creatorPage?.display_name || profile?.display_name || profile?.username || 'Creator';
  const heroUrl = creatorPage?.cover_url || profile?.header_photo_url || '';
  const avatarUrl = creatorPage?.avatar_url || profile?.profile_photo_url || '';
  const creatorBio = creatorPage?.bio || profile?.bio || '';
  const creatorLocation = creatorPage?.location_city 
    ? `${creatorPage.location_city}${creatorPage.location_country ? `, ${creatorPage.location_country}` : ''}`
    : profile?.location || '';
  const creatorUsername = creatorPage?.slug || profile?.username || '';

  // Format counts for display
  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Creator empty state for own page
  const videosEmptyState = (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/30 rounded-xl">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Film className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">No videos yet</p>
      <p className="text-sm text-muted-foreground text-center mb-4">
        {isOwnPage 
          ? "Upload long-form videos (4+ minutes) to see them here"
          : "This creator hasn't uploaded any long-form videos yet"
        }
      </p>
      {isOwnPage && (
        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Upload video
        </button>
      )}
    </div>
  );

  const shortsEmptyState = (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/30 rounded-xl">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Play className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">No shorts yet</p>
      <p className="text-sm text-muted-foreground text-center mb-4">
        {isOwnPage 
          ? "Upload short videos (under 4 minutes) to see them here"
          : "This creator hasn't uploaded any shorts yet"
        }
      </p>
      {isOwnPage && (
        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Upload short
        </button>
      )}
    </div>
  );

  return (
    <PageRoot className="min-h-screen pb-20" style={{ background: BG_COLOR }}>
      {/* Hero Section - matches ProfilePageV2 exactly */}
      <div className="relative">
        {/* Hero Image */}
        <div className="relative h-[250px] w-full overflow-hidden">
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Creator cover" 
              className="w-full h-full object-cover object-bottom"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
          )}
        </div>

        {/* Avatar - squircle, left-aligned with About title (px-5), 50% over hero / 50% below */}
        <div className="absolute left-5 -bottom-[62px] z-20">
          <div className="relative w-[124px] h-[124px]">
            {/* 2px bluey-grey ring (matches background) */}
            <div
              className="clbhouz-squircle absolute inset-0"
              style={{ background: BG_COLOR }}
            />

            {/* Avatar */}
            <div
              className="clbhouz-squircle absolute overflow-hidden"
              style={{
                inset: '2px',
                boxShadow: '0 12px 30px rgba(15,15,15,0.22)',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-600">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location + Creator pills - right side, just below header photo */}
        <div className="absolute right-5 top-full mt-3 z-20 flex items-center gap-2">
          {/* Location pill - if available */}
          {creatorLocation && (
            <span 
              className="px-4 py-1.5 text-sm font-semibold rounded-full text-[#0F0F0F] flex items-center justify-center gap-1.5"
              style={{ 
                background: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(31, 36, 40, 0.08)'
              }}
            >
              <MapPin className="w-3.5 h-3.5" />
              {creatorLocation}
            </span>
          )}
          
          {/* Creator pill - grey glass style (different from Golfer's green) */}
          <span 
            className="px-4 py-1.5 text-sm font-semibold rounded-full text-slate-600 flex items-center justify-center"
            style={{ 
              background: 'rgba(100, 116, 139, 0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(100, 116, 139, 0.3)'
            }}
          >
            Creator
          </span>
        </div>
      </div>

      {/* Identity Stack - adjusted for left-aligned avatar */}
      <div className="pt-[70px] px-5 text-left">
        {/* Name - smaller, more bold */}
        <h1 className="text-[28px] font-semibold text-[#0F0F0F]">
          {displayName}
        </h1>
        
        {/* Username */}
        {creatorUsername && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            @{creatorUsername}
          </p>
        )}
        
        {/* Stats row */}
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          {stats && (
            <>
              <span>{formatCount(stats.followerCount)} subscribers</span>
              <span className="text-border">•</span>
              <span>{stats.videoCount} video{stats.videoCount !== 1 ? 's' : ''}</span>
              {stats.shortCount > 0 && (
                <>
                  <span className="text-border">•</span>
                  <span>{stats.shortCount} short{stats.shortCount !== 1 ? 's' : ''}</span>
                </>
              )}
            </>
          )}
          {!stats && !statsLoading && (
            <span>{longFormVideos.length + shorts.length} video{(longFormVideos.length + shorts.length) !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Action Buttons - different for self vs other */}
      <div className="mt-5 px-5 flex items-center gap-2">
        {isOwnPage ? (
          <>
            {/* Self: Disabled Follow button */}
            <button 
              className="h-9 flex-1 rounded-full text-sm font-semibold text-white/60 flex items-center justify-center cursor-not-allowed"
              style={{ background: '#94a3b8' }}
              disabled
            >
              Follow
            </button>
            
            {/* Self: Creator Settings */}
            <button 
              className="h-9 flex-1 rounded-full text-sm font-semibold text-slate-600 flex items-center justify-center gap-1.5"
              style={{
                background: '#f1f5f9',
                border: '1px solid #E0E0E0'
              }}
              onClick={handleSettingsClick}
            >
              <Settings className="w-3.5 h-3.5" />
              Creator settings
            </button>
            
            {/* Self: Three dots menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center"
                  style={{
                    background: '#fff',
                    border: '1px solid #E0E0E0'
                  }}
                >
                  <MoreHorizontal className="w-4 h-4 text-[#0F0F0F]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/edit-profile')}>
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/profile/${profile?.username || creatorPage?.owner_user_id || slugOrUserId}`)}>
                  View personal profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            {/* Other: Active Follow button */}
            <button 
              className="h-9 flex-1 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ background: isFollowingCreator ? '#334155' : '#64748b' }}
              onClick={toggleFollow}
              disabled={followLoading || isFollowing === 'unknown'}
            >
              {followLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isFollowingCreator ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Follow
                </>
              )}
            </button>
            
            {/* Other: View personal profile */}
            <button 
              className="h-9 flex-1 rounded-full text-sm font-semibold text-slate-600 flex items-center justify-center gap-1.5"
              style={{
                background: '#f1f5f9',
                border: '1px solid #E0E0E0'
              }}
              onClick={() => navigate(`/profile/${profile?.username || creatorPage?.owner_user_id || slugOrUserId}`)}
            >
              View profile
            </button>
            
            {/* Other: Three dots menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center"
                  style={{
                    background: '#fff',
                    border: '1px solid #E0E0E0'
                  }}
                >
                  <MoreHorizontal className="w-4 h-4 text-[#0F0F0F]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => {}}>
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Bio section */}
      {creatorBio && (
        <div className="mt-5 px-5">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">
            {creatorBio}
          </p>
        </div>
      )}

      {/* YouTube-style Tab Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 px-5">
          {CREATOR_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "relative px-4 py-3 text-sm font-medium rounded-none border-b-2 border-transparent",
                "data-[state=active]:border-primary data-[state=active]:text-foreground",
                "data-[state=inactive]:text-muted-foreground hover:text-foreground",
                "bg-transparent shadow-none transition-colors"
              )}
            >
              <span className="flex items-center gap-2">
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <div className="pt-4">
            {videosLoading && longFormVideos.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : longFormVideos.length === 0 ? (
              <div className="px-5">
                {videosEmptyState}
              </div>
            ) : (
              <>
                <VideoSection
                  title=""
                  videos={longFormVideos}
                  onVideoClick={handleVideoClick}
                  onCreatorClick={handleCreatorClick}
                  showViewAll={false}
                  className="px-0"
                  registerVideo={registerMedia}
                  playingIds={playingIds}
                  startIndex={0}
                />
                
                {/* Infinite scroll trigger */}
                {hasMoreVideos && (
                  <div ref={videosObserverRef} className="flex justify-center py-8">
                    {isFetchingMoreVideos && (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
                
                {/* End state */}
                {!hasMoreVideos && longFormVideos.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    You've seen all videos
                  </p>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Shorts Tab */}
        <TabsContent value="shorts" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <div className="pt-4 px-5">
            {shortsLoading && shorts.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : shorts.length === 0 ? (
              shortsEmptyState
            ) : (
              <>
                <ActivityGridV2
                  items={shorts}
                  isLoading={shortsLoading}
                  isFetchingNextPage={isFetchingMoreShorts}
                  hasMore={hasMoreShorts}
                  onLoadMore={fetchMoreShorts}
                  onItemClick={(item) => handleShortClick(item.postId)}
                  config={{
                    autoplayEnabled: true,
                    playThreshold: 0.6,
                    pauseThreshold: 0.2,
                    showLikes: false,
                    showCreator: true,
                  }}
                />
                
                {/* Infinite scroll trigger */}
                {hasMoreShorts && (
                  <div ref={shortsObserverRef} className="flex justify-center py-8">
                    {isFetchingMoreShorts && (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
                
                {/* End state */}
                {!hasMoreShorts && shorts.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    You've seen all shorts
                  </p>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <div className="pt-4 px-5">
            <CreatorAboutTab 
              profile={profile} 
              stats={stats}
              isOwnProfile={isOwnPage}
            />
          </div>
        </TabsContent>
      </Tabs>
    </PageRoot>
  );
};

export default CreatorPage;
