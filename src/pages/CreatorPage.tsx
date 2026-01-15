import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UserPlus, MoreHorizontal, Loader2, Settings, MapPin, Check } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCreatorFollow } from '@/hooks/useCreatorFollow';
import { useCreatorPageBySlug } from '@/hooks/useCreatorPageBySlug';
import { useCreatorStats } from '@/hooks/useCreatorStats';
import { useCreatorActivityPosts, useCreatorTaggedPosts } from '@/hooks/useCreatorActivityPosts';
import { CreatorAboutTab } from '@/components/creator/CreatorAboutTab';
import { CreatorEmptyState } from '@/components/creator/CreatorEmptyState';
import { CreatorContentSkeleton } from '@/components/creator/CreatorContentSkeleton';
import { CreatorContentGrid } from '@/components/creator/CreatorContentGrid';
import { useInView } from 'react-intersection-observer';
import { useSnapModal } from '@/hooks/useSnapModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * CreatorPage - Hub-style creator page matching Business Profile pattern
 * 
 * MAIN TABS: Activity | About
 * SUB-TABS: Activity | Tagged (within Activity tab)
 * FILTER CHIPS: All | Long-form | Shorts | Images
 */

const BG_COLOR = '#f8fafc';

type MainTab = 'activity' | 'about';
type FeedTab = 'activity' | 'tagged';
type ContentFilter = 'all' | 'longform' | 'shorts' | 'images';

export const CreatorPage: React.FC = () => {
  const { userId: slugOrUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSupabaseSession();
  const { openComposerWithFiles } = useSnapModal();

  // Tab state
  const urlTab = searchParams.get('tab') as MainTab | null;
  const [activeTab, setActiveTab] = useState<MainTab>(urlTab === 'about' ? 'about' : 'activity');
  const [feedTab, setFeedTab] = useState<FeedTab>('activity');
  const [activeFilter, setActiveFilter] = useState<ContentFilter>('all');

  // Handler to open composer modal
  const handleCreatePost = useCallback(() => {
    openComposerWithFiles([]);
  }, [openComposerWithFiles]);

  // Update URL when main tab changes
  const handleMainTabChange = useCallback((tab: string) => {
    const newTab = tab as MainTab;
    setActiveTab(newTab);
    if (newTab === 'activity') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', newTab);
    }
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Fetch creator page by slug
  const { data: creatorPage, isLoading: isLoadingCreator } = useCreatorPageBySlug(slugOrUserId);
  
  const ownerUserId = creatorPage?.owner_user_id;
  const creatorPageId = creatorPage?.id;
  
  // Fetch user profile for fallback data
  const { data: profile } = useUserProfile(ownerUserId);

  // Fetch creator stats
  const { data: stats } = useCreatorStats(creatorPageId);

  const isOwnPage = user?.id === ownerUserId;

  // Follow state
  const { isFollowing, toggle: toggleFollow, busy: followLoading, ensureInitial } = useCreatorFollow(creatorPageId);

  useEffect(() => {
    if (creatorPageId) {
      ensureInitial();
    }
  }, [creatorPageId, ensureInitial]);

  // Fetch creator posts (Activity tab) 
  const { 
    data: activityPosts, 
    isLoading: isLoadingActivity,
    fetchNextPage: fetchNextActivity,
    hasNextPage: hasMoreActivity,
    isFetchingNextPage: isFetchingMoreActivity,
  } = useCreatorActivityPosts({ creatorPageId, enabled: !!creatorPageId });

  // Fetch tagged posts (Tagged tab)
  const { 
    data: taggedPosts, 
    isLoading: isLoadingTagged,
    fetchNextPage: fetchNextTagged,
    hasNextPage: hasMoreTagged,
    isFetchingNextPage: isFetchingMoreTagged,
  } = useCreatorTaggedPosts({ creatorPageId, enabled: !!creatorPageId });

  // Infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });

  // Trigger load more when sentinel comes into view
  useEffect(() => {
    if (!inView) return;
    
    if (feedTab === 'activity' && hasMoreActivity && !isFetchingMoreActivity) {
      fetchNextActivity();
    } else if (feedTab === 'tagged' && hasMoreTagged && !isFetchingMoreTagged) {
      fetchNextTagged();
    }
  }, [inView, feedTab, hasMoreActivity, hasMoreTagged, isFetchingMoreActivity, isFetchingMoreTagged, fetchNextActivity, fetchNextTagged]);

  // Flatten paginated data
  const activityPostsFlat = useMemo(() => activityPosts?.pages?.flat() || [], [activityPosts]);
  const taggedPostsFlat = useMemo(() => taggedPosts?.pages?.flat() || [], [taggedPosts]);

  // Filter posts based on active filter
  const filteredPosts = useMemo(() => {
    const posts = feedTab === 'activity' ? activityPostsFlat : taggedPostsFlat;
    
    switch (activeFilter) {
      case 'longform':
        return posts.filter(post => 
          post.post_media?.some((m: any) => m.media_type === 'video' && (m.duration_seconds || 0) >= 240)
        );
      case 'shorts':
        return posts.filter(post => 
          post.post_media?.some((m: any) => m.media_type === 'video' && (m.duration_seconds || 0) < 240 && (m.duration_seconds || 0) > 0)
        );
      case 'images':
        return posts.filter(post => 
          post.post_media?.some((m: any) => m.media_type === 'image')
        );
      default:
        return posts;
    }
  }, [activityPostsFlat, taggedPostsFlat, feedTab, activeFilter]);

  const isLoadingPosts = feedTab === 'activity' ? isLoadingActivity : isLoadingTagged;

  const isFollowingCreator = isFollowing === 'following';

  const handlePostTap = (post: any) => {
    navigate(`/watch?v=${post.id}`, { state: { fromCreatorPage: true } });
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  // Loading state
  if (isLoadingCreator) {
    return (
      <PageRoot className="min-h-screen" style={{ background: BG_COLOR }}>
        <div className="w-full h-[250px] bg-slate-200 animate-pulse" />
        <div className="px-5 -mt-[62px]">
          <div className="w-[124px] h-[124px] rounded-[28px] bg-slate-300 animate-pulse border-2 border-[#f8fafc]" />
          <div className="pt-3 space-y-2">
            <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </PageRoot>
    );
  }

  // 404
  if (!creatorPage && !isLoadingCreator) {
    return (
      <PageRoot className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: BG_COLOR }}>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Creator not found</h1>
          <p className="text-muted-foreground mb-4">This creator page doesn't exist.</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
            Go back
          </button>
        </div>
      </PageRoot>
    );
  }

  // Creator page data - no fallback to personal profile for visuals
  const displayName = creatorPage?.display_name || 'Creator';
  const heroUrl = creatorPage?.cover_url || null;
  const avatarUrl = creatorPage?.avatar_url || null;
  const creatorBio = creatorPage?.bio || '';
  const creatorLocation = creatorPage?.location_city 
    ? `${creatorPage.location_city}${creatorPage.location_country ? `, ${creatorPage.location_country}` : ''}`
    : '';
  const creatorUsername = creatorPage?.slug || '';

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <PageRoot className="min-h-screen pb-20" style={{ background: BG_COLOR }}>
      {/* Hero Section */}
      <div className="relative">
        <div className="relative h-[250px] w-full overflow-hidden">
          {heroUrl ? (
            <img src={heroUrl} alt="Creator cover" className="w-full h-full object-cover object-bottom" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
          )}
        </div>

        {/* Avatar */}
        <div className="absolute left-5 -bottom-[62px] z-20">
          <div className="relative w-[124px] h-[124px]">
            <div className="clbhouz-squircle absolute inset-0" style={{ background: BG_COLOR }} />
            <div className="clbhouz-squircle absolute overflow-hidden" style={{ inset: '2px', boxShadow: '0 12px 30px rgba(15,15,15,0.22)' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-600">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pills */}
        <div className="absolute right-5 top-full mt-3 z-20 flex items-center gap-2">
          {creatorLocation && (
            <span className="px-4 py-1.5 text-sm font-semibold rounded-full text-[#0F0F0F] flex items-center gap-1.5" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(31, 36, 40, 0.08)' }}>
              <MapPin className="w-3.5 h-3.5" />
              {creatorLocation}
            </span>
          )}
          <span className="px-4 py-1.5 text-sm font-semibold rounded-full text-slate-600" style={{ background: 'rgba(100, 116, 139, 0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(100, 116, 139, 0.3)' }}>
            Creator
          </span>
        </div>
      </div>

      {/* Identity */}
      <div className="pt-[70px] px-5 text-left">
        <h1 className="text-[28px] font-semibold text-[#0F0F0F]">{displayName}</h1>
        {creatorUsername && <p className="mt-0.5 text-sm text-muted-foreground">@{creatorUsername}</p>}
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
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 px-5 flex items-center gap-2">
        {isOwnPage ? (
          <>
            <button className="h-9 flex-1 rounded-full text-sm font-semibold text-white/60 flex items-center justify-center cursor-not-allowed" style={{ background: '#94a3b8' }} disabled>
              Follow
            </button>
            <button className="h-9 flex-1 rounded-full text-sm font-semibold text-slate-600 flex items-center justify-center gap-1.5" style={{ background: '#f1f5f9', border: '1px solid #E0E0E0' }} onClick={handleSettingsClick}>
              <Settings className="w-3.5 h-3.5" />
              Creator settings
            </button>
          </>
        ) : (
          <>
            <button 
              className="h-9 flex-1 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ background: isFollowingCreator ? '#334155' : '#64748b' }}
              onClick={toggleFollow}
              disabled={followLoading || isFollowing === 'unknown'}
            >
              {followLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isFollowingCreator ? <><Check className="w-3.5 h-3.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
            </button>
            <button className="h-9 flex-1 rounded-full text-sm font-semibold text-slate-600 flex items-center justify-center" style={{ background: '#f1f5f9', border: '1px solid #E0E0E0' }} onClick={() => navigate(`/profile/${profile?.username || ownerUserId}`)}>
              View profile
            </button>
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center" style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
              <MoreHorizontal className="w-4 h-4 text-[#0F0F0F]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem>Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bio */}
      {creatorBio && (
        <div className="mt-5 px-5">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">{creatorBio}</p>
        </div>
      )}

      {/* Segmented control tabs - matches business profile exactly */}
      <section className="px-4 py-2 mt-6">
        <div 
          className="flex items-stretch rounded-xl overflow-hidden"
          style={{ background: '#e2e8f0' }}
        >
          {[
            { id: 'activity', label: 'Activity' },
            { id: 'about', label: 'About' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleMainTabChange(tab.id)}
                className={cn(
                  "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px]",
                  isActive 
                    ? "bg-white text-slate-800 shadow-sm m-1 rounded-lg" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab Content */}
      {activeTab === 'activity' && (
        <div className="pt-4">
          {/* Sub-tabs: Activity / Tagged - matches business profile exactly */}
          <div className="flex justify-center border-b border-border/50">
            <button
              onClick={() => setFeedTab('activity')}
              className={cn(
                'px-6 py-3 text-sm font-medium transition-colors relative',
                feedTab === 'activity'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Activity
              {feedTab === 'activity' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
            <button
              onClick={() => setFeedTab('tagged')}
              className={cn(
                'px-6 py-3 text-sm font-medium transition-colors relative',
                feedTab === 'tagged'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Tagged
              {feedTab === 'tagged' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          </div>

          {/* Controls container - matches business profile exactly */}
          <div className="flex flex-col items-center gap-[10px] py-3">
            {/* Filter pills - no icons, matches business profile */}
            <div className="w-full max-w-[520px] mx-auto flex justify-center gap-2 px-4">
              {([
                { key: 'all', label: 'All' },
                { key: 'longform', label: 'Long-form' },
                { key: 'shorts', label: 'Shorts' },
                { key: 'images', label: 'Images' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={cn(
                    'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                    activeFilter === key
                      ? 'bg-[#e2e8f0] text-slate-800'
                      : 'bg-white text-foreground border border-border hover:bg-muted/50'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Create post CTA - only on Activity tab for owner */}
            {feedTab === 'activity' && isOwnPage && (
              <div className="w-full max-w-[520px] mx-auto px-4">
                <button
                  onClick={handleCreatePost}
                  className={cn(
                    'w-full flex items-center justify-center gap-2',
                    'min-h-[46px] rounded-sq-md',
                    'bg-white border border-border/60',
                    'text-foreground text-sm font-medium',
                    'shadow-sm hover:shadow-md',
                    'transition-all duration-150',
                    'active:scale-[0.98] active:shadow-sm'
                  )}
                >
                  <span className="text-lg leading-none">+</span>
                  Create post
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-4">
            {isLoadingPosts ? (
              <CreatorContentSkeleton filter={activeFilter} />
            ) : filteredPosts.length === 0 ? (
              <CreatorEmptyState
                filter={activeFilter}
                isTaggedTab={feedTab === 'tagged'}
                creatorName={displayName}
                canCreate={isOwnPage && feedTab === 'activity'}
                onCreatePost={handleCreatePost}
              />
            ) : (
              <>
                <CreatorContentGrid
                  posts={filteredPosts}
                  filter={activeFilter}
                  onPostTap={handlePostTap}
                />
                
                {/* Infinite scroll sentinel */}
                <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-4">
                  {(isFetchingMoreActivity || isFetchingMoreTagged) && (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="pt-4 px-4">
          <CreatorAboutTab 
            creatorPage={creatorPage} 
            stats={stats}
            isOwnProfile={isOwnPage}
          />
        </div>
      )}
    </PageRoot>
  );
};

export default CreatorPage;
