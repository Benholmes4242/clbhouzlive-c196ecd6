import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UserPlus, MoreHorizontal, Loader2, Settings, MapPin, Check, Film, Video, ImageIcon, Grid3X3 } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useInView } from 'react-intersection-observer';
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

  // Tab state
  const urlTab = searchParams.get('tab') as MainTab | null;
  const [activeTab, setActiveTab] = useState<MainTab>(urlTab === 'about' ? 'about' : 'activity');
  const [feedTab, setFeedTab] = useState<FeedTab>('activity');
  const [activeFilter, setActiveFilter] = useState<ContentFilter>('all');

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

      {/* Hub-style Tabs - Activity | About */}
      <Tabs value={activeTab} onValueChange={handleMainTabChange} className="mt-6">
        <div className="px-4 mb-4">
          <TabsList className="w-full grid grid-cols-2 rounded-full p-1 h-auto" style={{ background: '#F0F0F0', border: '1px solid #E0E0E0' }}>
            <TabsTrigger value="activity" className="rounded-full py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm" style={{ color: '#0F0F0F' }}>
              Activity
            </TabsTrigger>
            <TabsTrigger value="about" className="rounded-full py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm" style={{ color: '#0F0F0F' }}>
              About
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-0">
          {/* Sub-tabs: Activity | Tagged */}
          <div className="flex gap-6 px-4 border-b border-[#e2e8f0]">
            <button onClick={() => setFeedTab('activity')} className={cn("pb-3 text-sm font-medium transition-colors relative", feedTab === 'activity' ? "text-[#1e293b]" : "text-[#64748b] hover:text-[#1e293b]")}>
              Activity
              {feedTab === 'activity' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e293b] rounded-full" />}
            </button>
            <button onClick={() => setFeedTab('tagged')} className={cn("pb-3 text-sm font-medium transition-colors relative", feedTab === 'tagged' ? "text-[#1e293b]" : "text-[#64748b] hover:text-[#1e293b]")}>
              Tagged
              {feedTab === 'tagged' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e293b] rounded-full" />}
            </button>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {([
              { key: 'all', label: 'All', icon: Grid3X3 },
              { key: 'longform', label: 'Long-form', icon: Film },
              { key: 'shorts', label: 'Shorts', icon: Video },
              { key: 'images', label: 'Images', icon: ImageIcon },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  activeFilter === key
                    ? "bg-[#1e293b] text-white"
                    : "bg-white text-[#1e293b] border border-[#e2e8f0] hover:bg-[#f8fafc]"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Create Post Button (Owner Only) */}
          {isOwnPage && feedTab === 'activity' && (
            <div className="px-4 mb-4">
              <button
                onClick={() => navigate('/create')}
                className="w-full h-12 rounded-xl bg-white border border-[#e2e8f0] shadow-sm flex items-center justify-center gap-2 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
              >
                <span className="text-lg leading-none">+</span>
                Create post
              </button>
            </div>
          )}

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
                onCreatePost={() => navigate('/create')}
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
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-0 px-4">
          <CreatorAboutTab 
            profile={profile} 
            stats={stats}
            isOwnProfile={isOwnPage}
          />
        </TabsContent>
      </Tabs>
    </PageRoot>
  );
};

export default CreatorPage;
