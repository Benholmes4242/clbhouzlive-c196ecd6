/**
 * ExploreRegionPage - Premium golf travel guide for each region
 * 
 * Wiring: DB-driven data from explore_regions + explore_region_members,
 * back button, pull-to-refresh, error/empty states, Top Courses section.
 * 
 * Visual: Cinematic 16:10 hero, horizontal Top Courses scroll,
 * clean section headers, #F8FAFC background, scroll-to-top FAB.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronUp, Compass, MapPin, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { RegionKey, useExploreRegionStats } from '@/hooks/useExploreMoments';
import { useExploreRegionDetail } from '@/hooks/useExploreData';
import { DiscoverGrid } from '@/components/explore-tab/DiscoverGrid';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';

// Map URL slug → region_key for DiscoverGrid filtering
const SLUG_TO_REGION: Record<string, RegionKey> = {
  'gbi': 'GBI',
  'eu': 'EU',
  'usa': 'USA',
  'row': 'ROW',
  'uk-ireland': 'GBI',
  'continental-europe': 'EU',
  'rest-of-world': 'ROW',
};

// Map URL slug → DB slug for explore_regions table
const SLUG_TO_DB_SLUG: Record<string, string> = {
  'gbi': 'uk-ireland',
  'eu': 'continental-europe',
  'usa': 'usa',
  'row': 'rest-of-world',
};

// Hardcoded fallback config (flags + descriptions when DB is empty)
interface RegionFallback {
  title: string;
  subtitle: string;
  emoji: string;
  secondaryEmoji?: string;
  heroImage?: string;
}

const FALLBACK_CONFIG: Record<RegionKey, RegionFallback> = {
  GBI: {
    title: 'Great Britain & Ireland',
    subtitle: 'From the windswept links of Scotland to the emerald fairways of Ireland — where golf began.',
    emoji: '🇬🇧',
    secondaryEmoji: '🇮🇪',
  },
  EU: {
    title: 'Continental Europe',
    subtitle: 'Sun-drenched Spanish resorts, majestic French châteaux, and hidden Alpine gems.',
    emoji: '🇪🇺',
  },
  USA: {
    title: 'United States',
    subtitle: "From Pebble Beach's ocean cliffs to Augusta's azaleas — America's golfing treasures.",
    emoji: '🇺🇸',
  },
  ROW: {
    title: 'Rest of World',
    subtitle: 'Hidden gems and bucket-list courses from every corner of the globe.',
    emoji: '🌍',
    heroImage: 'https://media.clbhouz.co.uk/e44b8cbe-1d40-48d3-978f-1fa5e250ddde/clbhouz-course-images/1764363996472-9h1ryjq2sre.jpeg',
  },
};

const FLAG_MAP: Record<string, string> = {
  GBI: '🇬🇧',
  EU: '🇪🇺',
  USA: '🇺🇸',
  ROW: '🌍',
};

const SECONDARY_FLAG: Record<string, string> = {
  GBI: '🇮🇪',
};

const ExploreRegionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const regionKey = slug ? SLUG_TO_REGION[slug.toLowerCase()] : undefined;
  const dbSlug = slug ? (SLUG_TO_DB_SLUG[slug.toLowerCase()] || slug.toLowerCase()) : '';
  const fallback = regionKey ? FALLBACK_CONFIG[regionKey] : undefined;

  // DB-driven region data (Fix 1)
  const {
    data: regionDetail,
    isLoading: detailLoading,
    error: detailError,
    refetch: refetchDetail,
  } = useExploreRegionDetail(dbSlug);

  // Region stats for moment count
  const { data: regionStats, refetch: refetchStats } = useExploreRegionStats();
  const stats = regionStats?.find(s => s.region_key === regionKey);
  const momentCount = stats?.moments_last_30_days || 0;

  // Derive display data: DB first, fallback second
  const region = regionDetail?.region;
  const title = region?.title || fallback?.title || 'Region';
  const subtitle = region?.subtitle || fallback?.subtitle || '';
  const heroImageUrl = region?.hero_image_url || fallback?.heroImage || null;
  const topCourses = regionDetail?.courses?.slice(0, 6) || [];

  // Hero image: DB hero_image_url → top course thumbnail → gradient fallback
  const heroSrc = heroImageUrl || (topCourses[0] as any)?.thumbnail_image || null;
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Scroll-to-top FAB
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pull-to-refresh (Fix 3)
  const handlePullToRefresh = useCallback(async () => {
    await Promise.all([
      refetchDetail(),
      refetchStats(),
      queryClient.invalidateQueries({ queryKey: ['explore-moments', regionKey] }),
    ]);
  }, [refetchDetail, refetchStats, queryClient, regionKey]);

  // Invalid slug (Fix 5)
  if (!regionKey || !fallback) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-30 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ top: 'max(env(safe-area-inset-top, 0px), 12px)' }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Compass className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Region not found</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          This region doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/discover?main=explore')}
          className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-full active:scale-95 transition-transform"
        >
          Go to Explore
        </button>
      </div>
    );
  }

  // Error state (Fix 4)
  if (detailError && !detailLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-30 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ top: 'max(env(safe-area-inset-top, 0px), 12px)' }}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Something went wrong</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          We couldn't load this region. Please try again.
        </p>
        <button
          onClick={() => refetchDetail()}
          className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-full active:scale-95 transition-transform"
        >
          Try Again
        </button>
      </div>
    );
  }

  const flags = FLAG_MAP[regionKey] || '🌍';
  const secondaryFlag = SECONDARY_FLAG[regionKey];

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
      <div className="min-h-screen pb-24" style={{ background: '#F8FAFC' }}>
        {/* ====== Hero Section (Polish 1) - Bleeds into safe area ====== */}
        {detailLoading ? (
          <div 
            className="relative overflow-hidden"
            style={{ 
              aspectRatio: '16/10',
              marginTop: 'calc(-1 * max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
              paddingTop: 'max(var(--sat, env(safe-area-inset-top, 0px)), 47px)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-emerald-950 animate-pulse" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="w-48 h-7 rounded bg-white/20 mb-2" />
              <div className="w-full h-4 rounded bg-white/15 mb-1" />
              <div className="w-2/3 h-4 rounded bg-white/15 mb-3" />
              <div className="w-36 h-7 rounded-full bg-white/10" />
            </div>
          </div>
        ) : (
          <div 
            className="relative overflow-hidden"
            style={{ 
              aspectRatio: '16/10',
              marginTop: 'calc(-1 * max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
              paddingTop: 'max(var(--sat, env(safe-area-inset-top, 0px)), 47px)',
            }}
          >
            {/* Background image or gradient */}
            {heroSrc && !heroImgFailed ? (
              <img
                src={heroSrc}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onError={() => setHeroImgFailed(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-emerald-950" />
            )}

            {/* Full gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

            {/* Back button (Fix 2) */}
            <button
              onClick={() => navigate(-1)}
              className="absolute left-4 z-30 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ top: 'max(env(safe-area-inset-top, 0px), 12px)' }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
              {/* Flags + Title */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{flags}</span>
                {secondaryFlag && <span className="text-2xl">{secondaryFlag}</span>}
                <h1 className="text-2xl font-bold text-white">{title}</h1>
              </div>

              {/* Description */}
              {subtitle && (
                <p className="text-sm text-white/75 leading-relaxed line-clamp-2 mb-3 max-w-[340px]">
                  {subtitle}
                </p>
              )}

              {/* Stats badge */}
              {momentCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full">
                  <Calendar className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-medium text-white">
                    {momentCount} moment{momentCount === 1 ? '' : 's'} this month
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== Top Courses Section (Fix 6 + Polish 2) ====== */}
        {topCourses.length > 0 && (
          <div className="mt-6 mb-3">
            {/* Section header */}
            <div className="flex items-center justify-between px-4 mb-3">
              <span className="text-base font-semibold text-gray-700">Top Courses</span>
              <button
                onClick={() => navigate(`/discover?main=explore&sub=courses&region=${regionKey}`)}
                className="text-sm font-medium text-emerald-600 active:opacity-70"
              >
                See All
              </button>
            </div>

            {/* Horizontal scroll */}
            <div
              className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
            >
              {topCourses.map((course: any) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="flex-shrink-0 w-[200px] rounded-2xl overflow-hidden bg-white border border-gray-50 shadow-sm active:scale-[0.98] transition-transform"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="relative" style={{ aspectRatio: '4/3' }}>
                    {course.thumbnail_image ? (
                      <img
                        src={course.thumbnail_image}
                        alt={course.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200" />
                    )}
                    {/* Bottom gradient for text */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Top 100 badge */}
                    {course.global_rank && course.global_rank <= 100 && (
                      <div className="absolute top-2.5 left-2.5 bg-black/40 backdrop-blur-md rounded-lg px-2 py-1">
                        <span className="text-xs font-bold text-white">#{course.global_rank}</span>
                      </div>
                    )}

                    {/* Course name + country */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                      <p className="text-sm font-semibold text-white truncate">{course.name}</p>
                      <p className="text-xs text-white/70 truncate">{course.sub_country || course.country}</p>
                    </div>
                  </div>
                </button>
              ))}
              {/* Spacer for bleed effect */}
              <div className="flex-shrink-0 w-1" />
            </div>
          </div>
        )}

        {/* ====== Latest Moments Header (Polish 3) ====== */}
        <div className="px-4 mt-6 mb-3">
          <span className="text-base font-semibold text-gray-700">Latest Moments</span>
        </div>

        {/* ====== Moments Grid (Polish 4) ====== */}
        <DiscoverGrid
          regionKey={regionKey}
          className=""
        />

        {/* ====== Scroll-to-Top FAB (Polish 5) ====== */}
        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-4 z-40 w-10 h-10 bg-white shadow-lg border border-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-all animate-in fade-in zoom-in-90 duration-200"
          >
            <ChevronUp className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
    </PullToRefreshContainer>
  );
};

export default ExploreRegionPage;
