import React, { useState, useMemo, lazy, Suspense } from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { FadeInContent } from '@/components/ui/FadeInContent';

import SegmentedControl from '@/components/discover/SegmentedControl';
import ExploreFilters from '@/components/explore/ExploreFilters';
import DiscoverVideosHeader from '@/components/discover/DiscoverVideosHeader';
import VideoSearchOverlay from '@/components/videos/VideoSearchOverlay';
import SlidingPanels from '@/components/ui/SlidingPanels';
import { useVideoLengthFilter } from '@/hooks/useVideoLengthFilter';
import { DURATION_FILTERS } from '@/constants/videoFilters';

// import SuggestedUsersRedesigned from '@/components/discover/SuggestedUsersRedesigned'; // Stored for future use
import DiscoverContent from '@/components/discover/DiscoverContent';
import { ChannelsFeed } from '@/components/channels/ChannelsFeed';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem } from '@/types/media';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { useInfiniteExploreContent } from '@/hooks/useInfiniteExploreContent';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';
import { useUserTop100Intent } from '@/hooks/useUserTop100Intent';
import { useTop100DiscoverRecommendations } from '@/hooks/useTop100DiscoverRecommendations';
import { useTrendingTop100Moments } from '@/hooks/useTrendingTop100Moments';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import Top100Pills from '@/components/courses/Top100Pills';

// Lazy load heavy/inactive components for better initial bundle size
const FollowingFeed = lazy(() => import('@/components/discover/FollowingFeed'));
const VideosPage = lazy(() => import('@/features/videos2/pages/VideosPage'));

type MainKey = 'shorts' | 'videos' | 'channels' | 'following';

const Discover = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { main, sub } = useDiscoverQuery();
  const [durationFilter, setDurationFilter] = useVideoLengthFilter();

  // Top 100 integration hooks
  const {
    data: intent,
    isLoading: intentLoading,
  } = useUserTop100Intent();

  const {
    data: personalRecs = [],
    isLoading: personalLoading,
  } = useTop100DiscoverRecommendations(12);

  const {
    data: trendingTop100 = [],
    isLoading: trendingLoading,
  } = useTrendingTop100Moments(12, 7);

  const hasTop100Journey =
    (intent?.total_top100_played ?? 0) > 0 ||
    (intent?.wishlist_list_slugs?.length ?? 0) > 0;
  
  // Convert durationFilter key to range for API
  const durationRange = React.useMemo(() => {
    const filter = DURATION_FILTERS.find(f => f.key === durationFilter);
    if (!filter || filter.key === 'all') return undefined;
    return { from: filter.from, to: filter.to };
  }, [durationFilter]);

  // Detect Shorts mode for compact view
  const isShorts = main === 'shorts' || durationFilter === 'shorts';

  // Derive activeFilter from URL main param (single source of truth)
  const activeFilter = React.useMemo(() => {
    const mainToFilter: Record<string, string> = {
      'shorts': FILTER_TYPES.VIDEOS,
      'videos': FILTER_TYPES.VIDEOS,
      'channels': FILTER_TYPES.CHANNELS,
      'following': FILTER_TYPES.FOLLOWING,
      'friends': FILTER_TYPES.FOLLOWING, // Back-compat
      'verified-pros': FILTER_TYPES.VERIFIED_PROS,
      'hack-shack': FILTER_TYPES.HACK_SHACK,
    };
    return mainToFilter[main] || FILTER_TYPES.VIDEOS;
  }, [main]);

  // Reset tags when switching main pill
  React.useEffect(() => {
    setSelectedTags([]);
  }, [main]);
  
  // Get content for the vertical feed (we'll use the new DiscoverContent component for the grid)
  const { 
    content, 
    loading, 
    hasMore, 
    loadMore 
  } = useInfiniteExploreContent(activeFilter, sub, durationRange);

  const { optimisticPosts } = useOptimisticPostInsertion();

  // Combine optimistic posts with regular content
  const allContent = React.useMemo(() => {
    return [...optimisticPosts, ...(content || [])];
  }, [optimisticPosts, content]);

  // Transform content to MediaItem[] for FullscreenMediaModal - use allContent
  const mediaItems: MediaItem[] = useMemo(() => {
    const currentContent = allContent || [];
    return currentContent.flatMap((post, postIndex) => {
      // Handle posts with media array vs single media
      const mediaArray = post.media && post.media.length > 0 ? post.media : [{ 
        id: `${post.id}-single`, 
        media_type: post.type, 
        media_url: post.src 
      }];
      
      return mediaArray.map((media, mediaIndex) => {
        if (media.media_type === 'video') {
          const streamId = getStreamIdFromUrl(media.media_url);
          return {
            id: `${post.id}-${mediaIndex}`,
            type: 'video' as const,
            url: media.media_url,
            streamId,
            posterUrl: getStreamPoster(media.media_url, '1s') ?? undefined,
            alt: post.title || 'Video'
          };
        }
        return {
          id: `${post.id}-${mediaIndex}`,
          type: 'image' as const,
          url: media.media_url,
          alt: post.title || 'Photo'
        };
      });
    });
  }, [allContent]);

  // No loading state needed - Suspense at route level handles it with GenericPageSkeleton
  // if (loading && allContent.length === 0) return null;

  const handleLike = (contentId: string) => {
    // Update likes optimistically - could be enhanced with actual API call
    // For now, this is just visual feedback
  };

  const handleFollow = (contentId: string) => {
    // Update follow status optimistically - could be enhanced with actual API call
    // For now, this is just visual feedback
  };

  const handleMediaClick = (item: any) => {
    // Find the index of the clicked item in our flattened media array
    const clickedIndex = mediaItems.findIndex(mediaItem => 
      mediaItem.url === item.src || mediaItem.id === item.id
    );
    if (clickedIndex !== -1) {
      setModalStartIndex(clickedIndex);
      setModalOpen(true);
    }
  };

  const handleUserFollow = (userId: string) => {
    console.log('User followed:', userId);
    // In real app: API call to follow user
  };

  return (
    <div className="min-h-screen bg-background text-foreground page-with-header">
      <ClubhouseHeaderNew />
      <FadeInContent>
        <main className="pb-20">
            {/* Static Tabs */}
            <div className="relative z-30">
              {/* Segmented Control Tabs */}
              <SegmentedControl 
                activeTab={activeFilter}
                onTabChange={() => {}} // No-op: tabs control via URL now
              />
              
              {/* Videos Header - only show for shorts tab */}
              {main === 'shorts' && (
                <DiscoverVideosHeader
                  activeDuration={durationFilter}
                  onChangeDuration={setDurationFilter}
                  onOpenShorts={() => setDurationFilter('shorts')}
                  onSearchSubmit={(query) => setSearchQuery(query)}
                  initialQuery={searchQuery}
                />
              )}
              
              {/* Filter Pills Row - show for non-videos/shorts tabs */}
              {main !== 'videos' && main !== 'shorts' && (
                <div className="pt-1 pb-3 border-b border-gray-50 pl-1.5">
                  <ExploreFilters 
                    activeFilter={activeFilter}
                    onFilterChange={() => {}} // No-op: pills will be subfilters
                    main={main}
                    sub={sub}
                  />
                </div>
              )}
            </div>

            {/* Suggested Users - Below Tabs/Search */}
            {/* <div className="pt-1">
              <SuggestedUsersRedesigned onUserFollow={handleUserFollow} />
            </div> */}
            {/* Commented out for future use - SuggestedUsersRedesigned component is stored in /components/discover/ */}

            {/* Top 100 Journey Rails - only show on shorts/videos tabs */}
            {(main === 'shorts' || main === 'videos') && (
              <div className="md:container md:mx-auto md:px-4 space-y-6 mt-6">
                {/* Personalised Top 100 Journey rail */}
                {hasTop100Journey && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold">
                          Your Top 100 Journey – Next Stops
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Moments from Top 100 courses you haven't ticked off yet.
                        </p>
                      </div>
                      {intent?.wishlist_list_slugs?.[0] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/top100/${intent.wishlist_list_slugs[0]}`)
                          }
                        >
                          View list
                        </Button>
                      )}
                    </div>

                    {personalLoading ? (
                      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="h-40 w-32 rounded-xl bg-card/60 border border-border/60 flex-shrink-0 animate-pulse"
                          />
                        ))}
                      </div>
                    ) : personalRecs.length === 0 ? null : (
                      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        {personalRecs.map((moment) => (
                          <button
                            key={moment.post_id}
                            onClick={() => navigate(`/clubhouse/post/${moment.post_id}`)}
                            className="relative flex-shrink-0 w-32 rounded-xl overflow-hidden bg-card border border-border/60 hover:border-primary-accent/50 hover:shadow-md transition-all text-left"
                          >
                            {/* Thumbnail */}
                            {moment.thumbnail_url ? (
                              <img
                                src={moment.thumbnail_url}
                                alt={moment.course_name}
                                className="h-32 w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-32 w-full bg-slate-100 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">No image</span>
                              </div>
                            )}

                            {/* Top 100 pill overlay */}
                            {moment.list_slug && (
                              <div className="absolute left-1.5 bottom-9">
                                <Top100Pills
                                  memberships={[
                                    {
                                      list_slug: moment.list_slug,
                                      rank: moment.list_rank ?? undefined,
                                      short_label: moment.list_short_label ?? 'TOP 100',
                                    },
                                  ]}
                                  size="sm"
                                  variant="overlay"
                                  courseId={moment.course_id}
                                />
                              </div>
                            )}

                            {/* Text content */}
                            <div className="p-2">
                              <p className="line-clamp-2 text-xs text-foreground">
                                {moment.caption || moment.course_name}
                              </p>
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {moment.course_name}
                                {moment.list_rank && (
                                  <> · #{moment.list_rank}</>
                                )}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Global Trending Top 100 rail */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold">
                        Trending from the World's Top 100
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Hype from the most iconic courses on Clbhouz this week.
                      </p>
                    </div>
                  </div>

                  {trendingLoading ? (
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-40 w-32 rounded-xl bg-card/60 border border-border/60 flex-shrink-0 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : trendingTop100.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No Top 100 activity yet – check back soon.
                    </p>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                      {trendingTop100.map((moment) => (
                        <button
                          key={moment.post_id}
                          onClick={() => navigate(`/clubhouse/post/${moment.post_id}`)}
                          className="relative flex-shrink-0 w-32 rounded-xl overflow-hidden bg-card border border-border/60 hover:border-primary-accent/50 hover:shadow-md transition-all text-left"
                        >
                          {/* Thumbnail */}
                          {moment.thumbnail_url ? (
                            <img
                              src={moment.thumbnail_url}
                              alt={moment.course_name}
                              className="h-32 w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-32 w-full bg-slate-100 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No image</span>
                            </div>
                          )}

                          {/* Top 100 pill overlay */}
                          {moment.list_slug && (
                            <div className="absolute left-1.5 bottom-9">
                              <Top100Pills
                                memberships={[
                                  {
                                    list_slug: moment.list_slug,
                                    rank: moment.list_rank ?? undefined,
                                    short_label: moment.list_short_label ?? 'TOP 100',
                                  },
                                ]}
                                size="sm"
                                variant="overlay"
                                courseId={moment.course_id}
                              />
                            </div>
                          )}

                          {/* Text content */}
                          <div className="p-2">
                            <p className="line-clamp-2 text-xs text-foreground">
                              {moment.caption || moment.course_name}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {moment.course_name}
                              {moment.list_rank && (
                                <> · #{moment.list_rank}</>
                              )}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Main Content - Conditional based on active tab with slide animation */}
            <SlidingPanels
              activeKey={main as MainKey}
              order={['shorts', 'videos', 'channels', 'following'] as const}
            >
              {(key: MainKey) => {
                if (key === 'channels') {
                  return <ChannelsFeed />;
                }
                if (key === 'following') {
                  return (
                    <div className="md:container md:mx-auto md:px-0 mt-4">
                      <Suspense fallback={null}>
                        <FollowingFeed onMediaClick={handleMediaClick} />
                      </Suspense>
                    </div>
                  );
                }
                if (key === 'videos') {
                  return (
                    <Suspense fallback={null}>
                      <VideosPage />
                    </Suspense>
                  );
                }
                // 'shorts' uses DiscoverContent
                return (
                  <div className="md:container md:mx-auto md:px-0">
                    <DiscoverContent
                      onLike={handleLike}
                      onFollow={handleFollow}
                      onMediaClick={handleMediaClick}
                      searchQuery={searchQuery}
                      selectedTags={selectedTags}
                    />
                  </div>
                );
              }}
            </SlidingPanels>
        </main>
      </FadeInContent>


        {/* Fullscreen Media Modal */}
        <FullscreenMediaModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          mediaUrl={mediaItems.map(item => item.url)}
          mediaType={mediaItems.map(item => item.type)}
          initialIndex={modalStartIndex}
        />

        <style>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  };

export default Discover;