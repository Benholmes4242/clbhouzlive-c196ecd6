/**
 * BusinessProfilePage — Phase 1 rebuild
 * Immersive header (mirrors personal profile, business-appropriate),
 * 3 tabs: Posts · About · Team (Team is conditional on ≥1 public member).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Phone, Globe, MapPin, MoreHorizontal, Check, Loader2, ChevronLeft,
  Share2, Link2, AlertCircle, Camera, Flag, Pencil, Mail, MessageCircle,
  Instagram, Facebook, Youtube, Linkedin, Twitter, Music2,
  Star, ChevronRight, Navigation, Calendar,
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
import { useBusinessImageUpload } from '@/hooks/useBusinessImageUpload';
import { useBusinessTeam } from '@/hooks/useBusinessTeam';
import { useStartConversation } from '@/hooks/messaging/useStartConversation';

import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

import { AvatarLightbox } from '@/components/shared/AvatarLightbox';
import { ImageCropModal } from '@/components/business/ImageCropModal';
import { BusinessProfileInfo } from '@/components/business/BusinessProfileInfo';
import { BusinessTeamTab } from '@/components/business/BusinessTeamTab';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';

import PostsTabContent from '@/components/posts-tab/PostsTabContent';
// FloatingPageHeader removed (H3) — chrome now driven by ChromeIsland registry.

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
import { PhotoActionSheet } from '@/components/profile/edit-v2/PhotoActionSheet';
import { useBusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { openExternalUrl } from '@/utils/median/openExternalUrl';


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
  return parts.length ? parts.join(' · ') : null;
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

  useHideHeader();
  // Status bar transparency is owned by AppRoutes/applyRouteChrome (single owner).

  const { data: business, isLoading, error } = useBusinessProfile(idOrSlug);
  const { data: membership } = useBusinessMembership(business?.id);
  const { data: postsCount = 0 } = useBusinessPostsCount(business?.id);
  const { data: followersCount = 0 } = useBusinessFollowersCount(business?.id);
  const { data: teamMembers } = useBusinessTeam(business?.id);
  const { data: reviewStats } = useBusinessReviewStats(business?.id);

  // Home course (club_id only): first course under the business's club
  const { data: homeCourse } = useQuery({
    queryKey: ['business-home-course', business?.club_id],
    enabled: !!business?.club_id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!business?.club_id) return null;
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, region, country')
        .eq('club_id', business.club_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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

  const { uploadLogo, removeLogo, uploadCover, removeCover, uploadingLogo, uploadingCover } =
    useBusinessImageUpload(business?.id);
  const logoChooseInputRef = useRef<HTMLInputElement>(null);
  const logoTakeInputRef = useRef<HTMLInputElement>(null);
  const heroChooseInputRef = useRef<HTMLInputElement>(null);
  const heroTakeInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<'logo' | 'cover' | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [photoSheet, setPhotoSheet] = useState<'cover' | 'logo' | null>(null);

  const [activeTab, setActiveTab] = useState<BusinessTab>('posts');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isBioClamped, setIsBioClamped] = useState(false);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

  const isOwner = membership?.canManage;
  const isFollowing = cachedFollowing ?? false;

  // Conditional Team tab — only when ≥1 public member exists
  const publicTeamCount = useMemo(
    () => (teamMembers ?? []).filter(m => m.is_public === true).length,
    [teamMembers]
  );
  const showTeamTab = publicTeamCount > 0;

  // If user lands on `team` but it gets hidden later, fall back to posts
  useEffect(() => {
    if (activeTab === 'team' && !showTeamTab) setActiveTab('posts');
  }, [activeTab, showTeamTab]);

  // Track profile visit — pass a real source from navigation state / query.
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

  // ───── image upload ─────
  const handleLogoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
    setCropMode('logo');
    setIsCropModalOpen(true);
  };
  const handleCoverFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
    setCropMode('cover');
    setIsCropModalOpen(true);
  };
  const handleCropComplete = (croppedFile: File) => {
    setIsCropModalOpen(false);
    if (cropImageSrc) { URL.revokeObjectURL(cropImageSrc); setCropImageSrc(null); }
    if (cropMode === 'logo') uploadLogo(croppedFile);
    if (cropMode === 'cover') uploadCover(croppedFile);
    setCropMode(null);
  };
  const handleCropCancel = (open: boolean) => {
    if (!open) {
      if (cropImageSrc) { URL.revokeObjectURL(cropImageSrc); setCropImageSrc(null); }
      setIsCropModalOpen(false);
      setCropMode(null);
    }
  };

  // ───── actions ─────
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
      try { await navigator.share({ title: business?.name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Copied to clipboard');
    }
  };
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(buildShareUrl());
    toast.success('Copied to clipboard');
  };

  // ───── early returns ─────
  if (authLoading || isLoading) {
    return (
      <div className="relative min-h-screen">
        {/* Dark bleed behind the notch so the transparent safe-area shield
            doesn't flash light grey before the cinematic cover loads. */}
        <div
          aria-hidden
          className="fixed top-0 left-0 right-0 pointer-events-none z-50"
          style={{
            height: 'calc(env(safe-area-inset-top, 0px) + 80px)',
            background:
              'linear-gradient(180deg, #1E4D38 0%, #163A2B 65%, rgba(15,23,42,0) 100%)',
          }}
        />
        <GenericPageSkeleton />
      </div>
    );
  }

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
            We couldn&apos;t find what you were looking for
          </h1>

          <p className="text-muted-foreground text-[15px] leading-relaxed mb-6">
            We couldn&apos;t find this business. It may have been removed, renamed, or the link
            you followed is out of date.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/')} className="w-full h-12 text-[15px] font-semibold">
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
  const initials = business.name
    ?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'B';

  const subtitleText = buildCategoryLocation(
    business.category, business.country, business.region, business.city
  );

  // (Contact/social icons row removed — surfaced via action rows + About tab)

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
      {/* ───── Hero (full-bleed) ───── */}
      <div className="relative pointer-events-none" style={{ zIndex: 11 }}>
        <div
          className="relative w-full overflow-hidden"
          style={{
            minHeight: 'calc(var(--profile-hero-h) + env(safe-area-inset-top, 0px))',
            backgroundColor: '#0F172A',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          {/* Cover image layer — locked to 3:2 of full width so what the user
              framed in the editor is exactly what shows. Content below may
              extend past the image height over the dark background. */}
          {heroUrl ? (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                aspectRatio: '3 / 2',
                backgroundImage: `url(${heroUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0,
              }}
            />
          ) : (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                aspectRatio: '3 / 2',
                background: 'linear-gradient(180deg,#1E4D38,#0F172A)',
                zIndex: 0,
              }}
            />
          )}
          {/* Scrim over the cover image only */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              aspectRatio: '3 / 2',
              background:
                'linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.1) 20%, rgba(15,23,42,0) 40%, rgba(15,23,42,0.5) 100%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
          {/* Whole-cover tap target — owner only */}
          {isOwner && (
            <button
              type="button"
              onClick={() => setPhotoSheet('cover')}
              className="absolute inset-0 pointer-events-auto cursor-pointer"
              style={{ zIndex: 5, background: 'transparent', border: 'none' }}
              aria-label="Change cover photo"
            />
          )}
          {isOwner && (
            <button
              onClick={() => setPhotoSheet('cover')}
              className="absolute bottom-3 right-3 h-11 w-11 flex items-center justify-center rounded-full active:scale-[0.97] transition-transform pointer-events-auto"
              style={{
                zIndex: 10,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              }}
              aria-label="Change cover photo"
            >
              {uploadingCover ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
            </button>
          )}
        </div>



        {/* H3: header rendered globally by ChromeIsland (business 3-seg → back '/clubhouse'). */}

        {/* Avatar (squircle) — owner: tap to upload; visitor: tap to lightbox */}
        {/* Canon exception: 2px bg-background die-cut ring over the cover photo — */}
        {/* matches the personal profile hero avatar-on-cover rule; no hairline. */}
        <div className="absolute left-5 z-20 pointer-events-auto" style={{ bottom: '-62px' }}>
          <div
            className="relative w-[124px] h-[124px] block rounded-[34%]"
          >
            <div className="clbhouz-squircle absolute inset-0 bg-background pointer-events-none" />
            <div
              className="clbhouz-squircle absolute overflow-hidden pointer-events-none"
              style={{ inset: 2, boxShadow: '0 12px 30px rgba(15,15,15,0.22)' }}
            >
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground"
                  style={{ background: 'rgba(15,23,42,0.06)' }}
                >
                  {initials}
                </div>
              )}
            </div>
            {isOwner && (
              <div
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center z-10 pointer-events-none"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '2px solid white' }}
              >
                {uploadingLogo ? (
                  <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white" />
                )}
              </div>
            )}

            {/* Full-rect transparent tap target — matches cover-photo pattern. */}
            {isOwner && !uploadingLogo && (
              <button
                type="button"
                onClick={() => setPhotoSheet('logo')}
                className="absolute z-20 pointer-events-auto cursor-pointer rounded-[34%]"
                style={{ inset: '-14px', background: 'transparent', border: 'none' }}
                aria-label="Change logo"
              />
            )}
            {!isOwner && (
              <button
                type="button"
                onClick={() => setIsAvatarLightboxOpen(true)}
                className="absolute z-20 pointer-events-auto cursor-pointer rounded-[34%]"
                style={{ inset: '-14px', background: 'transparent', border: 'none' }}
                aria-label="View business logo"
              />
            )}
          </div>
        </div>

        {/* City pill (right of hero) */}
        {business.city && (
          <div className="absolute right-5 z-20 pointer-events-auto" style={{ top: 'calc(var(--profile-hero-h) + env(safe-area-inset-top, 0px) + 12px)' }}>
            <span
              className="px-4 py-1.5 text-sm font-semibold rounded-full text-foreground flex items-center gap-1.5"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
            >
              <MapPin className="w-3.5 h-3.5" />
              {business.city}
            </span>
          </div>
        )}
      </div>

      {/* ───── Identity ───── */}
      <div className="pt-[68px] px-4 text-left relative z-10 pointer-events-auto">
        <h1 className="text-[28px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
          {business.name}
          {business.is_verified && (
            <span className="inline-flex align-middle ml-1.5">
              <VerifiedBadge size="lg" />
            </span>
          )}
        </h1>


        {subtitleText && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitleText}</p>
        )}

        {/* Bio (expandable) */}
        {bioText && (
          <div className="mt-3">
            <p
              ref={bioRef}
              className={cn(
                'text-[15px] text-foreground leading-relaxed whitespace-pre-wrap',
                !bioExpanded && 'line-clamp-3'
              )}
              style={{ overflowWrap: 'anywhere' }}
            >
              {bioText}
            </p>
            {(isBioClamped || bioExpanded) && (
              <button
                onClick={() => setBioExpanded(v => !v)}
                className="text-[0.8125rem] font-semibold mt-1 min-h-[36px] flex items-center gap-0.5 active:scale-[0.97] transition-transform"
                style={{ color: '#F7931E' }}
              >
                {bioExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Proof line: rating chip (club-only) + followers + posts */}
        <div className="mt-3 flex items-center gap-3 flex-wrap text-[13px]">
          {business.club_id && reviewStats && reviewStats.totalReviews > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold"
              style={{ background: 'rgba(247,147,30,0.10)', color: '#F7931E', border: '1px solid rgba(247,147,30,0.20)' }}
            >
              <Star className="w-3 h-3" fill="#F7931E" strokeWidth={0} />
              {reviewStats.avgRating.toFixed(1)}
              <span style={{ color: '#F7931E', opacity: 0.8, fontWeight: 500 }}>({reviewStats.totalReviews})</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate(`/business/${business.slug || business.id}/followers`)}
            className="inline-flex items-center gap-1 active:opacity-70 transition-opacity"
          >
            <span className="font-semibold text-foreground tabular-nums">{followersCount}</span>
            <span className="text-muted-foreground">followers</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className="inline-flex items-center gap-1 active:opacity-70 transition-opacity"
          >
            <span className="font-semibold text-foreground tabular-nums">{postsCount}</span>
            <span className="text-muted-foreground">posts</span>
          </button>
        </div>
      </div>

      {/* ───── Action rows ───── */}
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
              openExternalUrl(`https://www.google.com/maps/search/?api=1&query=${q}`);
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
            style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        );

        return (
          <>
            {/* Primary row */}
            <div className="mt-4 px-4 flex items-center gap-2 relative z-10 pointer-events-auto">
              {isOwner ? (
                <>
                  <button
                    className="h-11 flex-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
                    style={{ background: '#0F172A', color: '#ffffff' }}
                    onClick={() => navigate(`/business/${business.id}/edit`)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit profile
                  </button>
                  <button
                    className="h-11 px-4 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
                    style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
                    onClick={() => navigate(`/business/${business.id}/manage`)}
                  >
                    Manage
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
                    style={{
                      flex: 1.6,
                      ...(isFollowing
                        ? { background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }
                        : { background: '#0F172A', color: '#ffffff' }),
                    }}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? (<><Check className="w-3.5 h-3.5" />Following</>) : 'Follow'}
                  </button>
                  <button
                    className="h-11 flex-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
                    style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
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
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="min-h-[44px] min-w-[44px] flex-shrink-0 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
                    style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
                    aria-label="More options"
                  >
                    <MoreHorizontal className="w-5 h-5 text-foreground" />
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

      {/* ───── Home course card (club-only) ───── */}
      {business.club_id && homeCourse && (
        <button
          type="button"
          onClick={() => navigate(`/courses/${homeCourse.id}`)}
          className="mt-4 mx-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.99] transition-transform"
          style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold tracking-[0.08em] uppercase" style={{ color: '#F7931E' }}>
              Home course
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground truncate">
              {homeCourse.name}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-[12.5px] text-muted-foreground">
              {reviewStats && reviewStats.totalReviews > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-foreground tabular-nums">
                  <Star className="w-3 h-3" fill="#F7931E" strokeWidth={0} />
                  {reviewStats.avgRating.toFixed(1)}
                  <span className="text-muted-foreground font-normal">({reviewStats.totalReviews})</span>
                </span>
              )}
              {(homeCourse.region || homeCourse.country) && (
                <span className="truncate">
                  {[homeCourse.region, homeCourse.country].filter(Boolean).join(', ')}
                </span>
              )}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </button>
      )}

      <div className="h-4" />



      {/* ───── Tabs ───── */}
      <section className="px-4 bg-background">
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px 2px 8px',
                  fontSize: 16,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  letterSpacing: isActive ? '-0.025em' : '0',
                  position: 'relative',
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.18s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ───── Tab content ───── */}
      <div className="pt-4 px-4 min-h-[60vh]">
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
        fallbackInitial={initials}
      />

      {/* Report sheet (real submission via submit_report RPC) */}
      <ReportSheet
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportType="user"
        reportedUserId={business.id}
      />


      {/* Hidden file inputs (choose + take, for both logo and cover) */}
      <input ref={logoChooseInputRef} type="file" accept="image/*" onChange={handleLogoFileSelected} className="hidden" />
      <input ref={logoTakeInputRef} type="file" accept="image/*" capture="environment" onChange={handleLogoFileSelected} className="hidden" />
      <input ref={heroChooseInputRef} type="file" accept="image/*" onChange={handleCoverFileSelected} className="hidden" />
      <input ref={heroTakeInputRef} type="file" accept="image/*" capture="environment" onChange={handleCoverFileSelected} className="hidden" />

      {/* Unified photo action sheet */}
      {isOwner && (
        <PhotoActionSheet
          open={photoSheet !== null}
          onClose={() => setPhotoSheet(null)}
          title={photoSheet === 'cover' ? 'Cover photo' : 'Business logo'}
          hasPhoto={photoSheet === 'cover' ? !!business.cover_image_url : !!business.logo_url}
          removeLabel={photoSheet === 'cover' ? 'Remove cover photo' : 'Remove logo'}
          onChoose={() => (photoSheet === 'cover' ? heroChooseInputRef : logoChooseInputRef).current?.click()}
          onTake={() => (photoSheet === 'cover' ? heroTakeInputRef : logoTakeInputRef).current?.click()}
          onRemove={() => (photoSheet === 'cover' ? removeCover() : removeLogo())}
        />
      )}

      {/* Crop modal */}
      {isCropModalOpen && cropImageSrc && (
        <ImageCropModal
          open={isCropModalOpen}
          onOpenChange={handleCropCancel}
          imageSrc={cropImageSrc}
          aspectRatio={cropMode === 'cover' ? window.innerWidth / (window.innerHeight * 0.35) : 1 / 1.05}
          onCropComplete={handleCropComplete}
          title={cropMode === 'cover' ? 'Crop Cover Photo' : 'Crop Logo'}
        />
      )}
    </PageRoot>
  );
};

export default BusinessProfilePage;
