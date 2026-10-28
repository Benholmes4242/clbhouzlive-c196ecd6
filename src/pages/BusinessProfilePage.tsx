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
import { RailChips } from '@/components/ui/RailChips';

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
import { shareBusinessProfile, withShareSource } from '@/lib/business/shareBusinessProfile';
import { ReportSheet } from '@/components/moderation/ReportSheet';
import { useBusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { useTranslation } from 'react-i18next';
import { A, Panel, LABEL, NUM } from '@/features/courses/components/holes/analytical/tokens';
import { ClubHowItPlays, type BusinessClubCourse } from '@/components/business/ClubHowItPlays';
import { ClubWhatGolfersSay } from '@/components/business/ClubWhatGolfersSay';
import { ClubVisiting } from '@/components/business/ClubVisiting';
import { ClubFromTheClub } from '@/components/business/ClubFromTheClub';
import { ClubYouCard } from '@/components/business/ClubYouCard';
import { BusinessYouCard } from '@/components/business/BusinessYouCard';
import { BusinessNearbyCourses, scrollToNearbyCard } from '@/components/business/BusinessNearbyCourses';
import { BusinessFollowersCard } from '@/components/business/BusinessFollowersCard';
import { BusinessMentionsRail } from '@/components/business/BusinessMentionsRail';
import { BusinessCoachInvite, BusinessCoachResults, coachStrip, scrollToCoachResults } from '@/features/coach/BusinessCoachCards';
import { isCoachCategory } from '@/features/coach/contracts';
import { useCoachResults } from '@/features/coach/hooks';
import { useClubRoundsTracked } from '@/hooks/useClubRoundsTracked';
import { businessCategoryWord, businessPlaceLine, businessSecondPill, businessStripKeys } from '@/lib/business/businessHero';
import { useBusinessNearbyCounts } from '@/hooks/useBusinessNearbyCounts';
import { useVerificationEvidence } from '@/components/business/verification/useVerificationEvidence';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { ClubProfileHero, clubPlace, clubPlaceLine, clubTeamGates } from '@/components/business/hero/ClubProfileHero';
import { useBusinessClubMemberCount } from '@/hooks/useBusinessClubMemberCount';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { mayHaveClubAnalytics } from '@/features/business/clubAnalytics/useClubCourseLink';

type BusinessTab = 'posts' | 'about' | 'team';


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
  const membershipQuery = useBusinessMembership(business?.id);
  const { data: membership } = membershipQuery;
  const coachResults = useCoachResults(business?.id, user?.id, isCoachCategory(business?.category) && !business?.club_id);
  const { data: postsCount = 0 } = useBusinessPostsCount(business?.id);
  const { data: followersCount = 0 } = useBusinessFollowersCount(business?.id);
  const { data: teamMembers } = useBusinessTeam(business?.id);
  const { data: reviewStats } = useBusinessReviewStats(business?.id);
  const { data: nearby } = useBusinessNearbyCounts(business?.category, business?.lat, business?.lng);
  /* PHASE 5B §2 — the evidence line, derived from the approved request. */
  const verificationEvidence = useVerificationEvidence(business?.id, business?.is_verified);

  // Club courses (club_id only): EVERY course under the business's club.
  // A 36-hole club has two and a resort may have more; returning one row
  // silently hid half of the club's golf.
  const { data: clubCourses, isPending: clubCoursesPending } = useQuery({
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
  // CB103 — members figure for the club hero (server-owned count).
  const { data: clubMemberCount } = useBusinessClubMemberCount(business?.club_id ? business.id : undefined);

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
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const tabsRef = useRef<HTMLElement>(null);

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

  // business_course_panel_shown - once per mount, when the rows resolve.
  // The same channel carries rounds_tracked so the panel aside (club total)
  // renders only once EVERY course has reported — never a partial sum.
  const panelFiguresRef = useRef<Map<string, boolean>>(new Map());
  const panelRoundsRef = useRef<Map<string, number>>(new Map());
  const panelReportedRef = useRef(false);
  const handleFiguresResolved = React.useCallback((courseId: string, hasFigures: boolean, rounds: number) => {
    panelFiguresRef.current.set(courseId, hasFigures);
    panelRoundsRef.current.set(courseId, rounds);
    if (courses.length === 0 || panelRoundsRef.current.size < courses.length) return;
    if (panelReportedRef.current || !business?.id) return;
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
  const buildShareUrl = () => withShareSource(window.location.href);
  const handleShare = () =>
    shareBusinessProfile({ businessId: business?.id, name: business?.name, url: buildShareUrl(), userId: user?.id });
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(buildShareUrl());
    toast.success('Copied to clipboard');
  };

  // ----- early returns -----
  if (authLoading || isLoading || (business?.club_id && clubCoursesPending)) {
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


  // (Contact/social icons row removed - surfaced via action rows + About tab)

  // CB103 — the existing menu, shared by both heroes; the club hero drops
  // "Share profile" because Share has its own circle beside it.
  const renderMenu = (trigger: React.ReactElement, withShare: boolean) => (
    <DropdownMenu>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isOwner ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate(`/business/${business.id}/edit`)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit business profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
{withShare && (
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share profile
                    </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy link
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    {/* CB78: editors can edit the profile too. */}
                    {membership?.role === 'editor' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate(`/business/${business.id}/edit`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit business profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
{withShare && (
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share profile
                    </DropdownMenuItem>
                    )}
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
  );

  const isClub = !!business.club_id && courses.length > 0;
  // CB103 team row — gates documented on clubTeamGates.
  const gates = clubTeamGates(membership, mayHaveClubAnalytics(business.category, business.is_verified, business.club_id));
  const clubTeam = gates ? {
    onYourCourses: gates.yourCourses ? () => navigate(`/business/${business.id}/course`) : undefined,
    onInsights: gates.insights ? () => navigate(`/business/${business.id}/insights`) : undefined,
    onPost: gates.post ? () => usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: business.id }) : undefined,
    onEdit: gates.edit ? () => navigate(`/business/${business.id}/edit`) : undefined,
  } : null;

  // CB112 — non-club team row: Insights (white), Post, Edit; no Your courses.
  const bizGates = clubTeamGates(membership, false);
  const bizTeam = bizGates ? {
    onInsights: bizGates.insights ? () => navigate(`/business/${business.id}/insights`) : undefined,
    onPost: bizGates.post ? () => usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: business.id }) : undefined,
    onEdit: bizGates.edit ? () => navigate(`/business/${business.id}/edit`) : undefined,
  } : null;

  const second = businessSecondPill(business, (k, d) => t(k, { defaultValue: d }));
  const bizSecond = second ? {
    label: second.label,
    arrow: second.arrow,
    soon: second.kind === 'soon',
    onTap: () => {
      switch (second.kind) {
        case 'soon': second.soonToast && toast(second.soonToast); return;
        case 'book': trackBusinessAction(business.id, 'website', user?.id); openExternalUrl(ensureProtocol(business.booking_url ?? '')); return;
        case 'website': trackBusinessAction(business.id, 'website', user?.id); openExternalUrl(ensureProtocol(business.website ?? '')); return;
        case 'call': trackBusinessAction(business.id, 'call', user?.id); window.location.href = `tel:${business.phone}`; return;
        case 'email': window.location.href = `mailto:${business.email}`; return;
        case 'directions': {
          trackBusinessAction(business.id, 'directions', user?.id);
          const q = business.location ? encodeURIComponent(business.location) : `${business.lat},${business.lng}`;
          openExternalUrl(`https://www.google.com/maps/search/?api=1&query=${q}`, 'external');
        }
      }
    },
  } : null;

  const stripValues = { coursesNear: nearby?.coursesNear, top100Near: nearby?.top100Near, followers: followersCount, posts: postsCount };
  const stripLabels = {
    coursesNear: t('business.hero.coursesNear', { defaultValue: 'Courses near' }),
    top100Near: t('business.hero.top100Near', { defaultValue: 'Top 100 near' }),
    followers: t('business.hero.followers', { defaultValue: 'Followers' }),
    posts: t('business.hero.posts', { defaultValue: 'Posts' }),
  };
  const standardBizStrip = businessStripKeys(business.category, stripValues).map((k) => ({
    key: k,
    value: (stripValues[k] as number).toLocaleString(),
    label: stripLabels[k],
    onTap: k === 'followers'
      ? () => navigate(`/business/${business.slug || business.id}/followers`)
      : k === 'posts'
        ? () => { setActiveTab('posts'); tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        : k === 'coursesNear' || k === 'top100Near'
          ? scrollToNearbyCard
          : undefined,
  }));
  const bizStrip = !isClub && isCoachCategory(business.category)
    ? coachStrip(coachResults.isSuccess && !coachResults.isError ? coachResults.data : null, followersCount, postsCount).map(cell => ({
      ...cell, color: cell.improved ? 'var(--coach-green)' : undefined,
      label: t(`coach.strip.${cell.key}`),
      onTap: cell.key === 'coached' || cell.key === 'avgChange' ? scrollToCoachResults
        : cell.key === 'followers' ? () => navigate(`/business/${business.slug || business.id}/followers`)
        : () => { setActiveTab('posts'); tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    })) : standardBizStrip;

  const tabs: Array<{ id: BusinessTab; label: string }> = [
    { id: 'posts', label: 'Posts' },
    ...(!isClub ? [{ id: 'about' as const, label: 'About' }] : []),
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
        return isClub ? <PostsTabContent actorType="business" actorId={business.id} isOwnProfile={isOwner || false} businessName={business.name} /> : <BusinessProfileInfo business={business} canManage={isOwner} userId={user?.id} />;
      case 'team':
        return <BusinessTeamTab businessId={business.id} />;
      default:
        return null;
    }
  };

  return (
    <PageRoot className="min-h-screen" style={{ background: 'var(--bg-page)' }} immersiveStatusBar immersive>
      {isClub ? (
        <ClubProfileHero
          name={business.name}
          logoUrl={business.logo_url}
          coverUrl={heroUrl || clubCourseImage}
          fallbackKey={avatarFallbackKey}
          verified={business.is_verified}
          evidenceLine={verificationEvidence.line}
          placeLine={clubPlaceLine(
            { city: business.city, region: business.region, country: business.country, firstCourseRegion: courses[0]?.region ?? null, courseCount: courses.length },
            {
              golfClub: t('business.clubHero.golfClub', 'Golf club'),
              courses: (n) => t('business.clubHero.courses', { count: n, defaultValue: '{{count}} courses' }),
            },
          )}
          onAvatarTap={() => setIsAvatarLightboxOpen(true)}
          onShare={handleShare}
          renderMore={(trigger) => renderMenu(trigger, false)}
          team={clubTeam}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
          onBookTeeTime={() => toast('Tee-time booking is coming soon.')}
          onMessage={() => { trackBusinessAction(business.id, 'message', user?.id); startConversation({ actorType: 'business', actorId: business.id }); }}
          messageDisabled={isStartingDM}
          avgRating={reviewStats?.avgRating ?? null}
          ratingsCount={reviewStats?.totalReviews ?? null}
          roundsTracked={clubRounds}
          membersHere={clubMemberCount ?? null}
          onRatingTap={courses.length === 1 ? () => { void analyticsEvents.track('business_hero_stat_tap', { stat: 'rated' }); navigate(`/courses/${courses[0].id}?tab=reviews`); } : undefined}
          onRoundsTap={courses.length === 1 ? () => { void analyticsEvents.track('business_hero_stat_tap', { stat: 'rounds' }); navigate(`/courses/${courses[0].id}`); } : undefined}
          about={bioText || null}
        />
      ) : (
        /* CB112 — every non-club business renders the shared hero. */
        <ClubProfileHero
          name={business.name}
          logoUrl={business.logo_url}
          coverUrl={heroUrl || clubCourseImage}
          fallbackKey={avatarFallbackKey}
          verified={business.is_verified}
          evidenceLine={verificationEvidence.line}
          placeLine={businessPlaceLine(
            businessCategoryWord(business.category, (k, d) => t(k, { defaultValue: d })),
            clubPlace({ city: business.city, region: business.region, country: business.country, firstCourseRegion: null }),
          )}
          onAvatarTap={() => setIsAvatarLightboxOpen(true)}
          onShare={handleShare}
          renderMore={(trigger) => renderMenu(trigger, false)}
          team={bizTeam}
          insightsTone="white"
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
          onBookTeeTime={() => {}}
          secondAction={bizSecond}
          onMessage={() => { trackBusinessAction(business.id, 'message', user?.id); startConversation({ actorType: 'business', actorId: business.id }); }}
          messageDisabled={isStartingDM}
          stripCells={bizStrip}
          about={bioText || null}
        />
      )}

      <ClubYouCard isClub={isClub} viewerId={user?.id} courses={courses} businessName={business.name} />
      {/* CB113 — the non-club "You and …" card in ClubYouCard's place. */}
      <BusinessYouCard isClub={isClub} viewerId={user?.id} business={business} />
      <BusinessCoachInvite business={business} viewerId={user?.id} isClub={isClub} isTeam={!!membership} membershipReady={membershipQuery.isSuccess && !membershipQuery.isError} />
      <BusinessCoachResults business={business} viewerId={user?.id} isClub={isClub} isTeam={!!membership && !membershipQuery.isError} />
      {/* CB114 — Courses nearby (non-club nearby categories), before the tabs. */}
      <BusinessNearbyCourses isClub={isClub} viewerId={user?.id} business={business} />
      {/* CB115 — Their followers (every non-club business), before the tabs. */}
      <BusinessFollowersCard isClub={isClub} businessId={business.id} viewerId={user?.id} />
      {!isClub && <BusinessMentionsRail isClub={false} businessId={business.id} viewerId={user?.id} canManage={!!membership?.canManage && !membershipQuery.isError} />}

      {!isClub && <ClubVisiting business={business} viewerId={user?.id} nonClub onBook={bizSecond?.onTap} publicTeamCount={publicTeamCount} />}

      {/* CB105 — How it plays (club-only), replaces the retired courses panel. */}
      <ClubHowItPlays isClub={isClub} courses={courses} onOpen={handleCourseOpen} onFiguresResolved={handleFiguresResolved} />

      {/* CB106 — What golfers say (club-only), directly after How it plays. */}
      <ClubWhatGolfersSay isClub={isClub} businessId={business.id} businessName={business.name} courses={courses} viewerId={user?.id} isTeamMember={!!membership} />
      {isClub && <ClubVisiting business={business} viewerId={user?.id} firstCourseRegion={courses[0]?.region} publicTeamCount={showTeamTab ? publicTeamCount : 0} />}


      <div className="h-4" />



      {/* ----- Tabs -----
          Deliberately paints NO background: the PageRoot canvas (--bg-page)
          shows through so the strip is continuous with the page. Do NOT
          reintroduce a local background — --background and --bg-page both
          resolve to the canonical Canvas (#0A0A0C). */}
      {/* CB108: clubs have no tabs; From the club is the last section. */}
      {isClub && <ClubFromTheClub businessId={business.id} businessName={business.name} postsCount={postsCount} isOwner={!!isOwner} onPost={clubTeam?.onPost} />}

      {!isClub && tabs.length > 1 && <section ref={tabsRef} data-business-tabs="" className="px-4">
        <div className="flex justify-center" style={{ padding: '10px 0' }}>
          <RailChips
            align="center-when-fit"
            options={tabs.map((tab) => ({ id: tab.id, label: tab.label }))}
            value={activeTab}
            onChange={(id) => {
              setActiveTab(id as BusinessTab);
              void analyticsEvents.track('business_tab_changed', {
                business_id: business.id,
                to: id,
              });
            }}
            ariaLabel="Business profile sections"
          />

        </div>
      </section>}

      {/* ----- Tab content ----- */}
      {!isClub && <div className={cn('min-h-[60vh]', activeTab === 'posts' ? 'pt-0 px-0' : 'pt-4 px-4')}>
        {renderTab()}
      </div>}

      {/* Bottom spacer */}
      <div style={{ height: 88 }} />

      <ScrollToTopGlass />

      {/* Avatar lightbox */}
      <AvatarLightbox
        isOpen={isAvatarLightboxOpen}
        onClose={() => setIsAvatarLightboxOpen(false)}
        imageUrl={business.logo_url || ''}
        altText={`${business.name} logo`}
        subjectId={business.id}
        subject="entity"
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
