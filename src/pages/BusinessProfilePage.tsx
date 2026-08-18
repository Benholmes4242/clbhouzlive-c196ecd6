/**
 * BusinessProfilePage - Phase 1 rebuild
 * Immersive header (mirrors personal profile, business-appropriate),
 * 3 tabs: Posts . About . Team (Team is conditional on >=1 public member).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Phone, Globe, MoreHorizontal, Loader2,
  Share2, Link2, Flag, Pencil, MessageCircle,
  Instagram, Facebook, Youtube, Linkedin, Twitter, Music2,
  Navigation, Calendar, Mail,
} from 'lucide-react';

import { toast } from '@/lib/toast';

import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { PageRoot } from '@/components/layout/PageRoot';

import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessPostsCount } from '@/hooks/useBusinessPosts';
import { useBusinessFollowersCount } from '@/hooks/useBusinessFollow';

import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useBusinessTeam } from '@/hooks/useBusinessTeam';
import { useStartConversation } from '@/hooks/messaging/useStartConversation';

import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { FilterChips } from '@/components/ui/FilterChips';

import { AvatarLightbox } from '@/components/shared/AvatarLightbox';
import { BusinessProfileInfo } from '@/components/business/BusinessProfileInfo';
import { BusinessTeamTab } from '@/components/business/BusinessTeamTab';
import { ProfileSurfaceSkeleton } from '@/components/skeletons/ProfileSurfaceSkeleton';

import PostsTabContent from '@/components/posts-tab/PostsTabContent';
// FloatingPageHeader removed (H3) - chrome now driven by ChromeIsland registry.

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { trackBusinessProfileVisit, trackBusinessAction } from '@/lib/businessAnalyticsTracking';
import { ReportSheet } from '@/components/moderation/ReportSheet';
import { useBusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { useTranslation } from 'react-i18next';
import { A, Panel, LABEL, NUM } from '@/features/courses/components/holes/analytical/tokens';
import { BusinessCoursePanel, type BusinessClubCourse } from '@/components/business/BusinessCoursePanel';
import { useClubRoundsTracked } from '@/hooks/useClubRoundsTracked';
import { BusinessProfileHero } from '@/components/business/hero/BusinessProfileHero';
import { useVerificationEvidence } from '@/components/business/verification/useVerificationEvidence';
import { HeroPill, HeroGlassCircle } from '@/components/profile/hero/HeroShell';
import { analyticsEvents } from '@/utils/analyticsEvents';

type BusinessTab = 'posts' | 'about' | 'team';

// Country-first subtitle helper: "England, Surrey" (country, region)
function buildCategoryLocation(category: string | null, country: string | null, region: string | null, city: string | null): string | null {
  const parts: string[] = [];
  if (category) parts.push(category);
  const locBits: string[] = [];
  if (country) locBits.push(country);
  if (region) locBits.push(region);
  else if (city) locBits.push(city);
  if (locBits.length) parts.push(locBits.join(', '));
  return parts.length ? parts.join(' . ') : null;
}

// Normalize URL with protocol
function ensureProtocol(url: string): string {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

interface SocialIconConfig {
  key: string;
  Icon: React.ElementType;
  label: string;
}
const SOCIAL_CONFIG: SocialIconConfig[] = [
  { key: 'instagram', Icon: Instagram, label: 'Instagram' },
  { key: 'twitter',   Icon: Twitter,   label: 'X / Twitter' },
  { key: 'x',         Icon: Twitter,   label: 'X / Twitter' },
  { key: 'facebook',  Icon: Facebook,  label: 'Facebook' },
  { key: 'tiktok',    Icon: Music2,    label: 'TikTok' },
  { key: 'youtube',   Icon: Youtube,   label: 'YouTube' },
  { key: 'linkedin',  Icon: Linkedin,  label: 'LinkedIn' },
];

const BusinessProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { user, loading: authLoading } = useSupabaseSession();
  const { t } = useTranslation();

  useHideHeader();
  // Status bar transparency is owned by AppRoutes/applyRouteChrome (single owner).

  const { data: business, isLoading, error, refetch } = useBusinessProfile(idOrSlug);
  const { data: membership } = useBusinessMembership(business?.id);
  const { data: postsCount = 0 } = useBusinessPostsCount(business?.id);
  const { data: followersCount = 0 } = useBusinessFollowersCount(business?.id);
  const { data: teamMembers } = useBusinessTeam(business?.id);
  const { data: reviewStats } = useBusinessReviewStats(business?.id);

  // Club courses (club_id only): EVERY course under the business's club.
  // A 36-hole club has two and a resort may have more; returning one row
  // silently hid half of the club's golf.
  const { data: clubCourses } = useQuery({
    queryKey: ['business-club-courses', business?.club_id],
    enabled: !!business?.club_id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<BusinessClubCourse[]> => {
      if (!business?.club_id) return [];
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, region, country, thumbnail_image')
        .eq('club_id', business.club_id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as BusinessClubCourse[];
    },
  });
  const courses = clubCourses ?? [];

  // Hero ROUNDS figure: summed across EVERY course of the club, reusing the
  // same `course-stats-detail` cache entries the course panels populate.
  const clubRounds = useClubRoundsTracked(courses.map((c) => c.id));

  // Cover fallback for a club with no cover of its own: its course hero image.
  const clubCourseImage =
    (courses.find((c) => (c as { thumbnail_image?: string | null }).thumbnail_image) as
      | { thumbnail_image?: string | null }
      | undefined)?.thumbnail_image ?? null;


  const { activeActor } = useActiveActor();
  const viewerActorType: 'personal' | 'business' = activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? user?.id;
  const isOwnBusiness = viewerActorType === 'business' && viewerActorId === business?.id;
  const { isFollowing: cachedFollowing } = useFollowState({
    targetActorType: 'business',
    targetActorId: isOwnBusiness ? undefined : business?.id,
    viewerActorType,
    viewerActorId,
  });
  const toggleFollow = useToggleFollow();
  const { start: startConversation, isStarting: isStartingDM } = useStartConversation();


  const [activeTab, setActiveTab] = useState<BusinessTab>('posts');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isBioClamped, setIsBioClamped] = useState(false);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

  const isOwner = membership?.canManage;
  const isFollowing = cachedFollowing ?? false;

  // Conditional Team tab - only when >=1 public member exists
  const publicTeamCount = useMemo(
    () => (teamMembers ?? []).filter(m => m.is_public === true).length,
    [teamMembers]
  );
  const showTeamTab = publicTeamCount > 0;

  // If user lands on `team` but it gets hidden later, fall back to posts
  useEffect(() => {
    if (activeTab === 'team' && !showTeamTab) setActiveTab('posts');
  }, [activeTab, showTeamTab]);

  // Track profile visit - pass a real source from navigation state / query.
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const visitSource = (() => {
    const s = (location.state as { source?: string } | null)?.source
      ?? searchParams.get('src') ?? searchParams.get('source');
    const allowed = ['search', 'content', 'course_page', 'share', 'direct', 'directory', 'feed'] as const;
    return (allowed as readonly string[]).includes(s ?? '') ? (s as typeof allowed[number]) : 'direct';
  })();
  useEffect(() => {
    if (business?.id) trackBusinessProfileVisit(business.id, user?.id, visitSource);
  }, [business?.id, user?.id, visitSource]);

  // business_profile_viewed - once per mount, ref guarded.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (!business?.id || viewedRef.current) return;
    viewedRef.current = true;
    void analyticsEvents.track('business_profile_viewed', {
      business_id: business.id,
      is_club: !!business.club_id,
      is_own: !!membership?.canManage,
      courses: courses.length,
      followers: followersCount,
    });
  }, [business?.id, business?.club_id, membership?.canManage, courses.length, followersCount]);

  // business_course_panel_shown - once per mount, when the panels resolve.
  const panelFiguresRef = useRef<Map<string, boolean>>(new Map());
  const panelReportedRef = useRef(false);
  const handleFiguresResolved = React.useCallback((courseId: string, hasFigures: boolean) => {
    panelFiguresRef.current.set(courseId, hasFigures);
    if (panelReportedRef.current || !business?.id) return;
    if (panelFiguresRef.current.size < courses.length || courses.length === 0) return;
    panelReportedRef.current = true;
    const withStats = Array.from(panelFiguresRef.current.values()).filter(Boolean).length;
    void analyticsEvents.track('business_course_panel_shown', {
      business_id: business.id,
      courses: courses.length,
      with_stats: withStats,
    });
  }, [business?.id, courses.length]);

  const handleCourseOpen = React.useCallback((courseId: string, position: number) => {
    if (business?.id) {
      void analyticsEvents.track('business_course_opened', {
        business_id: business.id,
        course_id: courseId,
        position,
      });
    }
    navigate(`/courses/${courseId}`);
  }, [business?.id, navigate]);


  // Clamp detection for bio
  useEffect(() => {
    const checkClamped = () => {
      if (bioRef.current) {
        setIsBioClamped(bioRef.current.scrollHeight > bioRef.current.clientHeight);
      }
    };
    checkClamped();
    window.addEventListener('resize', checkClamped);
    return () => window.removeEventListener('resize', checkClamped);
  }, [business?.description]);

  // ----- actions -----
  const handleFollowToggle = () => {
    if (!user?.id || !business?.id || !viewerActorId || isOwnBusiness) return;
    toggleFollow.mutate({
      targetActorType: 'business',
      targetActorId: business.id,
      targetUserId: undefined,
      viewerActorType,
      viewerActorId,
      viewerUserId: user.id,
      isFollowing,
    });
  };
  const buildShareUrl = () => {
    const u = new URL(window.location.href);
    u.searchParams.set('src', 'share');
    return u.toString();
  };
  const handleShare = async () => {
    const url = buildShareUrl();
    if (business?.id) trackBusinessAction(business.id, 'share_profile', user?.id);
    if (navigator.share) {
      try { await navigator.share({ title: business?.name, url }); } catch { /* user cancelled share */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Copied to clipboard');
    }
  };
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(buildShareUrl());
    toast.success('Copied to clipboard');
  };

  // ----- early returns -----
  if (authLoading || isLoading) {
    // Same skeleton as the personal profile, configured: hero + headline
    // figure + four-cell strip, no Top 10 rail, three chip tabs.
    return <ProfileSurfaceSkeleton headline counters={4} tabs={3} />;
  }

  // Sentinel string from useBusinessProfile - keep in sync.
  const isNotFound = error instanceof Error && error.message === 'Business not found';
  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-sm w-full text-center">
          {/* Amber flag-on-green motif */}
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: 'rgba(247,147,30,0.10)' }}
          >
            <Flag className="h-9 w-9" style={{ color: '#F7931E' }} strokeWidth={2.2} />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight mb-2">
            {isNotFound
              ? "We couldn't find what you were looking for"
              : "Couldn't load this business"}
          </h1>

          <p className="text-muted-foreground text-[15px] leading-relaxed mb-6">
            {isNotFound
              ? "We couldn't find this business. It may have been removed, renamed, or the link you followed is out of date."
              : 'Check your connection and try again.'}
          </p>
          <div className="flex flex-col gap-3">
            {!isNotFound && (
              <Button onClick={() => refetch()} className="w-full h-12 text-[15px] font-semibold">
                Retry
              </Button>
            )}
            <Button
              onClick={() => navigate('/')}
              variant={isNotFound ? 'default' : 'outline'}
              className="w-full h-12 text-[15px] font-semibold"
            >
              Back to home
            </Button>
            <Button
              variant="ghost"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="w-full h-11 text-[15px] text-muted-foreground"
            >
              Go back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const heroUrl = business.cover_image_url || '';
  const bioText = business.description || '';
  const avatarInitials = getInitialsFromName(business.name) || 'B';
  const avatarFallbackKey = business.id || business.name || 'business';

  const subtitleText = buildCategoryLocation(
    business.category, business.country, business.region, business.city
  );

  // (Contact/social icons row removed - surfaced via action rows + About tab)

  const tabs: Array<{ id: BusinessTab; label: string }> = [
    { id: 'posts', label: 'Posts' },
    { id: 'about', label: 'About' },
    ...(showTeamTab ? [{ id: 'team' as const, label: 'Team' }] : []),
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <PostsTabContent
            actorType="business"
            actorId={business.id}
            isOwnProfile={isOwner || false}
            businessName={business.name}
          />
        );
      case 'about':
        return <BusinessProfileInfo business={business} canManage={isOwner} userId={user?.id} />;
      case 'team':
        return <BusinessTeamTab businessId={business.id} />;
      default:
        return null;
    }
  };

  return (
    <PageRoot className="min-h-screen" style={{ background: 'var(--bg-page)' }} immersiveStatusBar immersive>
      {/* ----- Hero (shared HeroShell, identical to the personal profile) ----- */}
      <BusinessProfileHero
        name={business.name}
        logoUrl={business.logo_url}
        coverUrl={heroUrl || clubCourseImage}
        fallbackKey={avatarFallbackKey}
        verified={business.is_verified}
        evidenceLine={verificationEvidence.line}
        category={business.category}
        city={business.city}
        region={business.region}
        country={business.country}
        isClub={!!business.club_id && courses.length > 0}
        avgRating={reviewStats?.avgRating ?? null}
        ratingsCount={reviewStats?.totalReviews ?? null}
        roundsTracked={clubRounds}
        followersCount={followersCount}
        postsCount={postsCount}
        onAvatarTap={() => setIsAvatarLightboxOpen(true)}
        courseNavEnabled={courses.length === 1}
        onStatTap={(stat) => {
          if (stat === 'followers') {
            navigate(`/business/${business.slug || business.id}/followers`);
          } else if (stat === 'posts') {
            setActiveTab('posts');
          } else if (courses.length === 1) {
            navigate(
              stat === 'rated'
                ? `/courses/${courses[0].id}?tab=reviews`
                : `/courses/${courses[0].id}`,
            );
          }
        }}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isOwner ? (
              <HeroPill label={t('business.hero.edit', 'Edit')} onClick={() => navigate(`/business/${business.id}/edit`)} />
            ) : (
              <HeroPill
                label={isFollowing ? t('business.hero.following', 'Following') : t('business.hero.follow', 'Follow')}
                onClick={handleFollowToggle}
              />
            )}
            {isOwner && (
              <HeroGlassCircle label={t('business.hero.manage', 'Manage')} onClick={() => navigate('/businesses/manage')}>
                <Pencil className="w-3.5 h-3.5 text-white" />
              </HeroGlassCircle>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More options"
                  style={{
                    width: 28, height: 28, flexShrink: 0, borderRadius: 999,
                    background: 'rgba(255,255,255,0.12)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                >
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isOwner ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate(`/business/${business.id}/edit`)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit business profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy link
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-destructive">
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* ----- Bio on canvas (no card) ----- */}
      {bioText && (
        <div className="px-4 pt-4 relative z-10 pointer-events-auto">
          <p
            ref={bioRef}
            className={cn('whitespace-pre-wrap', !bioExpanded && 'line-clamp-3')}
            style={{ fontSize: 13.5, lineHeight: 1.55, color: '#3A424C', overflowWrap: 'anywhere' }}
          >
            {bioText}
          </p>
          {(isBioClamped || bioExpanded) && (
            <button
              type="button"
              onClick={() => setBioExpanded(v => !v)}
              style={{
                marginTop: 6, background: 'transparent', border: 'none', padding: 0,
                minHeight: 36, display: 'flex', alignItems: 'center',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.13em',
                textTransform: 'uppercase', color: A.INK,
              }}
            >
              {bioExpanded
                ? t('business.hero.readLess', 'Read less')
                : t('business.hero.readMore', 'Read more')}
            </button>
          )}
        </div>
      )}

      {/* ----- Action rows ----- */}
      {(() => {
        // Secondary action defs
        type SecKey = 'website' | 'call' | 'directions' | 'email' | 'book';
        const secDefs: Record<SecKey, { label: string; icon: React.ElementType; onClick: () => void; available: boolean } > = {
          website: {
            label: 'Website', icon: Globe, available: !!business.website,
            onClick: () => {
              if (!business.website) return;
              trackBusinessAction(business.id, 'website', user?.id);
              openExternalUrl(ensureProtocol(business.website));
            },
          },
          call: {
            label: 'Call', icon: Phone, available: !!business.phone,
            onClick: () => {
              if (!business.phone) return;
              trackBusinessAction(business.id, 'call', user?.id);
              window.location.href = `tel:${business.phone}`;
            },
          },
          directions: {
            label: 'Directions', icon: Navigation, available: !!(business.location || (business.lat && business.lng)),
            onClick: () => {
              trackBusinessAction(business.id, 'directions', user?.id);
              const q = business.location
                ? encodeURIComponent(business.location)
                : `${business.lat},${business.lng}`;
              openExternalUrl(`https://www.google.com/maps/search/?api=1&query=${q}`, 'external');
            },
          },
          email: {
            label: 'Email', icon: Mail, available: !!business.email,
            onClick: () => { if (business.email) window.location.href = `mailto:${business.email}`; },
          },
          book: {
            label: 'Book', icon: Calendar, available: !!business.booking_url,
            onClick: () => {
              if (!business.booking_url) return;
              trackBusinessAction(business.id, 'website', user?.id);
              openExternalUrl(ensureProtocol(business.booking_url));
            },
          },
        };

        const pa = (business.primary_action || null) as SecKey | null;
        const promoted = pa && secDefs[pa]?.available ? pa : null;

        const secOrder: SecKey[] = ['website', 'call', 'directions'];
        const secondary = secOrder.filter(k => secDefs[k].available && k !== promoted);

        const OutlineBtn: React.FC<{ onClick: () => void; icon: React.ElementType; label: string; className?: string; disabled?: boolean; loading?: boolean }> = ({ onClick, icon: Icon, label, className, disabled, loading }) => (
          <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn('h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]', className)}
            style={{ background: 'transparent', border: `0.5px solid ${A.BORDER}`, color: A.INK, ...LABEL, fontSize: 10 }}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        );

        return (
          <>
            {/* Primary row - EDIT / FOLLOW / MANAGE / "..." now live in the
                hero, so this row carries contact actions only (visitor). */}
            {!isOwner && (
              <div className="mt-4 px-4 flex items-center gap-2 relative z-10 pointer-events-auto">
                <button
                  className="h-11 flex-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
                  style={{ background: 'transparent', border: `0.5px solid ${A.BORDER}`, color: A.INK, ...LABEL, fontSize: 10 }}
                  onClick={() => { trackBusinessAction(business.id, 'message', user?.id); startConversation({ actorType: 'business', actorId: business.id }); }}
                  disabled={isStartingDM}
                  aria-label={`Message ${business.name}`}
                >
                  {isStartingDM
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <MessageCircle className="w-3.5 h-3.5" />}
                  Message
                </button>
                {promoted && (
                  <OutlineBtn
                    onClick={secDefs[promoted].onClick}
                    icon={secDefs[promoted].icon}
                    label={secDefs[promoted].label}
                    className="flex-1"
                  />
                )}
              </div>
            )}


            {/* Secondary row (visitor only, hidden when empty) */}
            {!isOwner && secondary.length > 0 && (
              <div className="mt-2 px-4 flex items-center gap-2 relative z-10 pointer-events-auto">
                {secondary.map((k) => (
                  <OutlineBtn
                    key={k}
                    onClick={secDefs[k].onClick}
                    icon={secDefs[k].icon}
                    label={secDefs[k].label}
                    className="flex-1"
                  />
                ))}
              </div>
            )}
          </>
        );
      })()}

      {/* ----- Club courses (club-only): one panel per course ----- */}
      {business.club_id && courses.length > 0 && (
        <div className="px-4">
          {courses.map((course, i) => (
            <BusinessCoursePanel
              key={course.id}
              course={course}
              isFirst={i === 0}
              plural={courses.length > 1}
              position={i}
              onOpen={handleCourseOpen}
              onFiguresResolved={handleFiguresResolved}
            />
          ))}
        </div>
      )}


      <div className="h-4" />



      {/* ----- Tabs ----- */}
      <section className="px-4 bg-background">
        <div className="flex justify-center" style={{ padding: '10px 0' }}>
          <FilterChips
            options={tabs.map((tab) => ({ id: tab.id, label: tab.label }))}
            value={activeTab}
            onChange={(id) => {
              setActiveTab(id);
              void analyticsEvents.track('business_tab_changed', {
                business_id: business.id,
                to: id,
              });
            }}
            ariaLabel="Business profile sections"
          />

        </div>
      </section>

      {/* ----- Tab content ----- */}
      <div className={cn('min-h-[60vh]', activeTab === 'posts' ? 'pt-0 px-0' : 'pt-4 px-4')}>
        {renderTab()}
      </div>

      {/* Bottom spacer */}
      <div style={{ height: 88 }} />

      <ScrollToTopGlass />

      {/* Avatar lightbox */}
      <AvatarLightbox
        isOpen={isAvatarLightboxOpen}
        onClose={() => setIsAvatarLightboxOpen(false)}
        imageUrl={business.logo_url || ''}
        altText={`${business.name} logo`}
        shape="squircle"
        fallbackInitial={avatarInitials}
      />

      {/* Report sheet (real submission via submit_report RPC) */}
      <ReportSheet
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportType="user"
        reportedUserId={business.id}
      />


    </PageRoot>
  );
};

export default BusinessProfilePage;
