import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UserPlus, UserCheck, MoreHorizontal, Loader2, Settings, MapPin, Check } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFollow } from '@/hooks/useFollow';
import { useLongFormVideosQuery } from '@/hooks/useLongFormVideosQuery';
import { VideoSection } from '@/components/videos/VideoSection';
import { VideosEmptyState } from '@/components/videos/VideosEmptyState';
import { useMediaAutoplay } from '@/media';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
 * 
 * DESIGN RULE:
 * - Header layout matches ProfilePageV2 exactly
 * - Uses "Creator" pill instead of "Golfer" pill
 */

// Background color - matches profile page (slate-50)
const BG_COLOR = '#f8fafc';

type VideoSort = 'latest' | 'popular';

export const CreatorPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [sortBy, setSortBy] = useState<VideoSort>('latest');

  // Scroll restoration for navigation
  const { savePosition } = useScrollRestoration('creator-page');

  // Unified grid autoplay - same settings as VideosTab
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
    startThreshold: 0.6,
    stopThreshold: 0.4,
  });

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

  // Fetch creator's long-form videos using the query hook (same as VideosTab)
  const { videos, isLoading: videosLoading } = useLongFormVideosQuery({
    creatorUserId: userId,
    sort: sortBy,
    limit: 50,
  });

  const isFollowingCreator = isFollowing === 'following';

  const handleVideoClick = (videoId: string) => {
    savePosition();
    navigate(`/video/${videoId}`, {
      state: { fromCreatorPage: true }
    });
  };

  const handleCreatorClick = (creatorUserId: string) => {
    // Already on creator page, just scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  // Format handicap with 1 decimal place
  const formatHandicap = (hcp: number | null | undefined): string => {
    if (hcp == null) return '–';
    return hcp.toFixed(1);
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

  const displayName = profile?.display_name || profile?.username || 'Creator';
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';

  // Creator empty state for own page
  const creatorEmptyState = (
    <div className="flex flex-col items-center justify-center py-8 px-4 bg-muted/30 rounded-xl">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">No videos yet</p>
      <p className="text-sm text-muted-foreground text-center mb-4">
        {isOwnPage 
          ? "Upload long-form videos (3+ minutes) to see them here"
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
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
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
          {profile?.location && (
            <span 
              className="px-4 py-1.5 text-sm font-semibold rounded-full text-[#0F0F0F] flex items-center justify-center gap-1.5"
              style={{ 
                background: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(31, 36, 40, 0.08)'
              }}
            >
              <MapPin className="w-3.5 h-3.5" />
              {profile.location}
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
        {profile?.username && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            @{profile.username}
          </p>
        )}
        
        {/* Video count */}
        <p className="mt-1 text-sm text-muted-foreground">
          {videosLoading ? 'Loading...' : `${videos.length} video${videos.length !== 1 ? 's' : ''}`}
        </p>
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
                <DropdownMenuItem onClick={() => navigate(`/profile/${profile.username || userId}`)}>
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
              onClick={() => navigate(`/profile/${profile.username || userId}`)}
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
      {profile?.bio && (
        <div className="mt-5 px-5">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-border/40 mx-5 mt-6 mb-4" />

      {/* Sort dropdown */}
      <div className="px-5 flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-foreground">
          Videos
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

      {/* Video list - uses same VideoSection component as VideosTab with autoplay */}
      <VideoSection
        title=""
        videos={videos}
        onVideoClick={handleVideoClick}
        onCreatorClick={handleCreatorClick}
        showViewAll={false}
        emptyState={creatorEmptyState}
        className="px-0"
        registerVideo={registerMedia}
        playingIds={playingIds}
        startIndex={0}
      />
    </PageRoot>
  );
};

export default CreatorPage;
