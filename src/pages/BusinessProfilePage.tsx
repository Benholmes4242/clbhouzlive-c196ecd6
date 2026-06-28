/**
 * BusinessProfilePage — Phase 1 rebuild
 * Immersive header (mirrors personal profile, business-appropriate),
 * 3 tabs: Posts · About · Team (Team is conditional on ≥1 public member).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Phone, Globe, MapPin, MoreHorizontal, Check, Loader2, ChevronLeft,
  Share2, Link2, AlertCircle, Camera, Flag, Pencil, Mail, MessageCircle,
  Instagram, Facebook, Youtube, Linkedin, Twitter, Music2,
} from 'lucide-react';
import { toast } from 'sonner';

import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { PageRoot } from '@/components/layout/PageRoot';

import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessPostsCount } from '@/hooks/useBusinessPosts';
import { useBusinessFollowersCount } from '@/hooks/useBusinessFollow';
import { useBusinessFollowingCount } from '@/hooks/useBusinessSocialLists';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useBusinessImageUpload } from '@/hooks/useBusinessImageUpload';
import { useBusinessTeam } from '@/hooks/useBusinessTeam';
import { useStartDM } from '@/hooks/useStartDM';

import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

import { AvatarLightbox } from '@/components/shared/AvatarLightbox';
import { ImageCropModal } from '@/components/business/ImageCropModal';
import { BusinessProfileInfo } from '@/components/business/BusinessProfileInfo';
import { BusinessTeamTab } from '@/components/business/BusinessTeamTab';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';

import PostsTabContent from '@/components/posts-tab/PostsTabContent';
import FloatingPageHeader from '@/components/header/FloatingPageHeader';

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { trackBusinessProfileVisit, trackBusinessAction } from '@/lib/businessAnalyticsTracking';

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
  // Status bar transparency is owned by FloatingPageHeader (single owner).

  const { data: business, isLoading, error } = useBusinessProfile(idOrSlug);
  const { data: membership } = useBusinessMembership(business?.id);
  const { data: postsCount = 0 } = useBusinessPostsCount(business?.id);
  const { data: followersCount = 0 } = useBusinessFollowersCount(business?.id);
  const { data: followingCount = 0 } = useBusinessFollowingCount(business?.id);
  const { data: teamMembers } = useBusinessTeam(business?.id);

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
  const { startDM, isStarting: isStartingDM } = useStartDM();

  const { uploadLogo, uploadCover, uploadingLogo, uploadingCover } =
    useBusinessImageUpload(business?.id);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<'logo' | 'cover' | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

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

  // Track profile visit
  useEffect(() => {
    if (business?.id) trackBusinessProfileVisit(business.id, user?.id, 'direct');
  }, [business?.id, user?.id]);

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
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
    setCropMode('logo');
    setIsCropModalOpen(true);
    if (logoFileInputRef.current) logoFileInputRef.current.value = '';
  };
  const handleCoverFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
    setCropMode('cover');
    setIsCropModalOpen(true);
    if (heroFileInputRef.current) heroFileInputRef.current.value = '';
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
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: business?.name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Copied to clipboard');
    }
  };
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Business not found</h1>
          <p className="text-muted-foreground mb-6">
            This business may have been removed or is no longer available.
          </p>
          <Button onClick={() => navigate(-1)}>Go back</Button>
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

  // Build contact/social rows (omit nulls)
  const socialLinks = (business.social_links || {}) as Record<string, string | null | undefined>;
  const socialRow = SOCIAL_CONFIG
    .filter(s => socialLinks[s.key] && socialLinks[s.key]!.trim().length > 0)
    // Dedup so `twitter` and `x` don't both render
    .filter((s, i, arr) => arr.findIndex(o => o.Icon === s.Icon) === i);

  const hasAnyContact =
    !!business.website || !!business.phone || !!business.email || socialRow.length > 0;

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
          />
        );
      case 'about':
        return <BusinessProfileInfo business={business} canManage={isOwner} />;
      case 'team':
        return <BusinessTeamTab businessId={business.id} />;
      default:
        return null;
    }
  };

  return (
    <PageRoot className="min-h-screen" style={{ background: 'var(--bg-page)' }} immersiveStatusBar immersive>
      {/* ───── Hero (full-bleed) ───── */}
      <div className="relative pointer-events-none" style={{ zIndex: 1 }}>
        <div
          className="relative w-full overflow-hidden"
          style={(() => {
            const scrim = 'linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.1) 20%, rgba(15,23,42,0) 40%, rgba(15,23,42,0.5) 100%)';
            const bg = heroUrl
              ? `${scrim}, url(${heroUrl}) center / cover no-repeat`
              : 'linear-gradient(180deg,#1E4D38,#0F172A)';
            return {
              minHeight: 'calc(var(--profile-hero-h) + env(safe-area-inset-top, 0px))',
              background: bg,
              backgroundColor: '#0F172A',
              paddingTop: 'env(safe-area-inset-top, 0px)',
            } as React.CSSProperties;
          })()}
        >
          {isOwner && (
            <button
              onClick={() => heroFileInputRef.current?.click()}
              className="absolute bottom-3 right-3 h-11 w-11 flex items-center justify-center rounded-full active:scale-[0.97] transition-transform z-10 pointer-events-auto"
              style={{
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


        {/* Floating header — canonical glass control row under the notch */}
        <FloatingPageHeader
          onBack={() => navigate('/clubhouse')}
          showHandicap={!!user}
        />

        {/* Avatar (squircle) — owner: tap to upload; visitor: tap to lightbox */}
        <div className="absolute left-5 z-20 pointer-events-auto" style={{ bottom: '-62px' }}>
          <button
            className="relative w-[124px] h-[124px] block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E] focus-visible:ring-offset-2 rounded-[34%] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => {
              if (isOwner) logoFileInputRef.current?.click();
              else if (!uploadingLogo) setIsAvatarLightboxOpen(true);
            }}
            aria-label={isOwner ? 'Change business logo' : 'View business logo'}
          >
            <div className="clbhouz-squircle absolute inset-0 bg-background" />
            <div
              className="clbhouz-squircle absolute overflow-hidden"
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
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center z-10"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '2px solid white' }}
              >
                {uploadingLogo ? (
                  <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white" />
                )}
              </div>
            )}
          </button>
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
      <div className="pt-[68px] px-5 text-left relative z-10 pointer-events-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h1 className="text-[28px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
            {business.name}
          </h1>
          {business.is_verified && <VerifiedBadge size="lg" />}
        </div>

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

        {/* Manages [course] chip */}
        {business.club_id && business.club_name && (
          <button
            type="button"
            onClick={() => navigate(`/courses/${business.club_id}`)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold active:scale-[0.97] transition-transform"
            style={{
              color: '#F7931E',
              background: 'rgba(247,147,30,0.10)',
              border: '1px solid rgba(247,147,30,0.20)',
            }}
          >
            <Flag className="w-3 h-3" />
            Manages {business.club_name}
          </button>
        )}

        {/* Contact / social row */}
        {hasAnyContact && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {business.website && (
              <a
                href={ensureProtocol(business.website)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackBusinessAction(business.id, 'website', user?.id)}
                aria-label="Website"
                className="h-10 w-10 inline-flex items-center justify-center rounded-full active:scale-[0.97] transition-transform"
                style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
              >
                <Globe className="w-4 h-4 text-foreground" />
              </a>
            )}
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                onClick={() => trackBusinessAction(business.id, 'call', user?.id)}
                aria-label="Call"
                className="h-10 w-10 inline-flex items-center justify-center rounded-full active:scale-[0.97] transition-transform"
                style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
              >
                <Phone className="w-4 h-4 text-foreground" />
              </a>
            )}
            {business.email && (
              <a
                href={`mailto:${business.email}`}
                aria-label="Email"
                className="h-10 w-10 inline-flex items-center justify-center rounded-full active:scale-[0.97] transition-transform"
                style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
              >
                <Mail className="w-4 h-4 text-foreground" />
              </a>
            )}
            {socialRow.map(({ key, Icon, label }) => (
              <a
                key={key}
                href={ensureProtocol(socialLinks[key] as string)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="h-10 w-10 inline-flex items-center justify-center rounded-full active:scale-[0.97] transition-transform"
                style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
              >
                <Icon className="w-4 h-4 text-foreground" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ───── Primary actions ───── */}
      <div className="mt-4 px-5 flex items-center gap-2 relative z-10 pointer-events-auto">
        {isOwner ? (
          <button
            className="h-11 flex-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
            style={{ background: '#0F172A', color: '#ffffff' }}
            onClick={() => navigate(`/business/${business.id}/edit`)}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit profile
          </button>
        ) : (
          <>
            <button
              className="h-11 flex-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
              style={
                isFollowing
                  ? { background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }
                  : { background: '#0F172A', color: '#ffffff' }
              }
              onClick={handleFollowToggle}
            >
              {isFollowing ? (<><Check className="w-3.5 h-3.5" />Following</>) : 'Follow'}
            </button>
            <button
              className="h-11 px-4 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
              onClick={() => startDM(business.id, 'business')}
              disabled={isStartingDM === business.id}
              aria-label={`Message ${business.name}`}
            >
              {isStartingDM === business.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <MessageCircle className="w-3.5 h-3.5" />}
              Message
            </button>
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

      {/* ───── Stats row ───── */}
      <div className="mt-6 px-5 mb-4">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className="flex items-center gap-1.5 min-h-[44px] cursor-pointer active:opacity-70 transition-opacity pr-6"
          >
            <span className="text-sm text-muted-foreground">Posts</span>
            <span className="text-base font-semibold text-foreground">{postsCount}</span>
          </button>
          <div className="w-px h-6 self-center" style={{ background: 'rgba(15,23,42,0.08)' }} />
          <button
            type="button"
            onClick={() => navigate(`/business/${business.slug || business.id}/followers`)}
            className="flex items-center gap-1.5 min-h-[44px] cursor-pointer active:opacity-70 transition-opacity px-6"
          >
            <span className="text-sm text-muted-foreground">Followers</span>
            <span className="text-base font-semibold text-foreground">{followersCount}</span>
          </button>
          <div className="w-px h-6 self-center" style={{ background: 'rgba(15,23,42,0.08)' }} />
          <button
            type="button"
            onClick={() => navigate(`/business/${business.slug || business.id}/followers?tab=following`)}
            className="flex items-center gap-1.5 min-h-[44px] cursor-pointer active:opacity-70 transition-opacity pl-6"
          >
            <span className="text-sm text-muted-foreground">Following</span>
            <span className="text-base font-semibold text-foreground">{followingCount}</span>
          </button>
        </div>
      </div>

      {/* ───── Tabs ───── */}
      <section className="px-4 bg-background" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
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
                  padding: '11px 2px 9px',
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
                {isActive && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5,
                    borderRadius: 2, background: 'linear-gradient(90deg, #F59E0B, #F7931E)',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ───── Tab content ───── */}
      <div className="pt-3 px-5 min-h-[60vh]">
        {renderTab()}
      </div>

      {/* Bottom spacer */}
      <div style={{ height: 'max(env(safe-area-inset-bottom, 0px), 20px)', paddingBottom: 80 }} />

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

      {/* Report dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report {business.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              We'll review this profile and take action if it violates our Community Guidelines.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              toast.success('Report submitted. Thank you.');
              setShowReportDialog(false);
            }}>
              Submit Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden file inputs */}
      <input ref={logoFileInputRef} type="file" accept="image/*" onChange={handleLogoFileSelected} className="hidden" />
      <input ref={heroFileInputRef} type="file" accept="image/*" onChange={handleCoverFileSelected} className="hidden" />

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
