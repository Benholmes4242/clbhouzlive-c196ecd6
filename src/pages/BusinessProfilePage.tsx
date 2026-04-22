/**
 * BusinessProfilePage - Mirrors PersonalProfile layout exactly
 * Only content substitutions, not layout changes
 */

import React, { useState, useEffect, useRef } from 'react';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { cn } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessPostsCount } from '@/hooks/useBusinessPosts';
import { useBusinessFollowersCount, useIsFollowingBusiness, useBusinessFollowMutation } from '@/hooks/useBusinessFollow';
import { useBusinessImageUpload } from '@/hooks/useBusinessImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { 
  Phone, Globe, MapPin, MoreHorizontal, Check, ExternalLink, Loader2, 
  ChevronRight, ChevronLeft, Share2, Link2, AlertCircle, ArrowLeft, Camera, Flag, Pencil
} from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BusinessLocationCard } from '@/components/business/BusinessLocationCard';
import { ImageCropModal } from '@/components/business/ImageCropModal';
import { trackBusinessProfileVisit, trackBusinessAction } from '@/lib/businessAnalyticsTracking';
import { getCityOnly, getCityCountry } from '@/lib/locationDisplay';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Tab content components
import PostsTabContent from '@/components/posts-tab/PostsTabContent';
import { BusinessProfileInfo } from '@/components/business/BusinessProfileInfo';
import { PeopleTab } from '@/components/business/PeopleTab';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { AvatarLightbox } from '@/components/shared/AvatarLightbox';
import { CreatorSection } from '@/components/creator-mode/CreatorSection';

type BusinessTab = 'content' | 'golfers' | 'info';

const BusinessProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { user, loading: authLoading } = useSupabaseSession();

  // Hide global header for full-bleed immersive profile
  useHideHeader();
  // Safe area bleed: transparent status bar with white icons for hero image
  useMedianStatusBar("dark", "transparent", true, false);

  const { data: business, isLoading, error } = useBusinessProfile(idOrSlug);
  const { data: membership } = useBusinessMembership(business?.id);
  const { data: postsCount = 0 } = useBusinessPostsCount(business?.id);
  const { data: followersCount = 0 } = useBusinessFollowersCount(business?.id);
  const { data: isFollowingStatus, isLoading: statusLoading } = useIsFollowingBusiness(business?.id, user?.id);
  const { follow, unfollow, isFollowing: followPending, isUnfollowing: unfollowPending } = useBusinessFollowMutation(business?.id || '', user?.id);

  // Image upload hooks (P7: owner affordances)
  const { uploadLogo, removeLogo, uploadCover, removeCover, uploadingLogo, uploadingCover } = useBusinessImageUpload(business?.id);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<'logo' | 'cover' | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<BusinessTab>('content');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isBioClamped, setIsBioClamped] = useState(false);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

  // File selected handlers — open crop modal
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
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
    if (cropMode === 'logo') uploadLogo(croppedFile);
    if (cropMode === 'cover') uploadCover(croppedFile);
    setCropMode(null);
  };

  const handleCropCancel = (open: boolean) => {
    if (!open) {
      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc(null);
      }
      setIsCropModalOpen(false);
      setCropMode(null);
    }
  };

  // Check ownership
  const isOwner = membership?.canManage;

  // Compute follow state
  const isFollowing = isFollowingStatus === true;
  const followBusy = statusLoading; // optimistic — no spinner during mutations
  
  const handleFollowToggle = () => {
    if (!user) return;
    if (isFollowing) {
      unfollow();
    } else {
      follow();
    }
  };

  // Track profile visit
  useEffect(() => {
    if (business?.id) {
      trackBusinessProfileVisit(business.id, user?.id, 'direct');
    }
  }, [business?.id, user?.id]);

  // Check if bio text is clamped (overflows 4 lines)
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

  const handleCall = () => {
    if (business?.phone) {
      trackBusinessAction(business.id, 'call', user?.id);
      window.location.href = `tel:${business.phone}`;
    }
  };

  const handleWebsite = () => {
    if (business?.website) {
      trackBusinessAction(business.id, 'website', user?.id);
      const url = business.website.startsWith('http') 
        ? business.website 
        : `https://${business.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: business?.name, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Copied to clipboard');
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Copied to clipboard');
  };

  // Format URL for display
  const formatUrlForDisplay = (url: string): string => {
    if (!url) return '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    }
  };

  const ensureProtocol = (url: string): string => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  // Bio text
  const bioText = business?.description || '';

  // Generate initials
  const initials = business?.name
    ?.split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase() || 'B';

  const isGolfClub = business?.category === 'Golf Club';
  
  const tabs = [
    { id: 'content', label: 'Posts' },
    { id: 'golfers', label: 'People' },
    { id: 'info', label: 'About' },
  ];

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'content':
        return (
          <PostsTabContent
            actorType="business"
            actorId={business?.id || ''}
            actorName={business?.name || ''}
            isOwnProfile={isOwner || false}
            hideReviewsCount
          />
        );
      case 'golfers':
        return (
          <PeopleTab 
            businessId={business?.id || ''}
            businessName={business?.name || ''}
            category={business?.category}
            canManage={membership?.canManage}
            isOwner={membership?.role === 'owner'}
          />
        );
      case 'info':
        return (
          <BusinessProfileInfo business={business!} canManage={membership?.canManage} />
        );
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return <GenericPageSkeleton />;
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

  return (
    <PageRoot className="min-h-screen" style={{ background: 'var(--bg-page)' }} immersiveStatusBar immersive>
      {/* Hero Section - full-bleed immersive, extends behind notch */}
      <div className="relative pointer-events-none" style={{ zIndex: 1 }}>
        {/* Hero Image Container - full-bleed behind notch */}
        <div className="relative w-full overflow-hidden" style={{ height: '35dvh' }}>
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Business cover" 
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full" style={{ background: '#1a2040' }} />
          )}

          {/* P7: Cover photo edit button for owners */}
          {isOwner && (
            <button
              onClick={() => heroFileInputRef.current?.click()}
              className="absolute bottom-3 right-3 h-11 w-11 flex items-center justify-center rounded-full active:scale-[0.97] transition-transform z-10 pointer-events-auto"
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
              }}
            >
              {uploadingCover ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Back button — matches course detail hero style */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-4 flex h-[34px] w-[34px] items-center justify-center active:scale-95 transition-all z-10 pointer-events-auto"
          style={{
            top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 47px) + 12px)',
            borderRadius: '12px',
            background: 'rgba(0, 0, 0, 0.28)',
            backdropFilter: 'blur(22px) saturate(180%)',
            WebkitBackdropFilter: 'blur(22px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          }}
          aria-label="Back"
        >
          <ChevronLeft className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
        </button>

        {/* Avatar - unified button, left-aligned */}
        <div className="absolute left-5 z-20 pointer-events-auto" style={{ bottom: '-62px' }}>
          <button
            className="relative w-[124px] h-[124px] block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E] focus-visible:ring-offset-2 rounded-[34%] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => {
              if (isOwner) {
                logoFileInputRef.current?.click();
              } else {
                if (uploadingLogo) return;
                setIsAvatarLightboxOpen(true);
              }
            }}
            aria-label={isOwner ? "Change business logo" : "View business logo"}
          >
            {/* 2px background ring */}
            <div className="clbhouz-squircle absolute inset-0 bg-background" />

            {/* Logo image */}
            <div
              className="clbhouz-squircle absolute overflow-hidden"
              style={{
                inset: '2px',
                boxShadow: '0 12px 30px rgba(15,15,15,0.22)',
              }}
            >
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground" style={{ background: 'rgba(15,23,42,0.06)' }}>
                  {initials}
                </div>
              )}
            </div>

            {/* Camera badge — owner only, visual hint */}
            {isOwner && !uploadingLogo && (
              <div
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center z-10"
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '2px solid white',
                }}
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            {/* Spinner — during upload */}
            {isOwner && uploadingLogo && (
              <div
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center z-10"
                style={{ background: 'rgba(0,0,0,0.55)', border: '2px solid white' }}
              >
                <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </button>
        </div>

        {/* Pills row - right side, just below header photo */}
        <div className="absolute right-5 z-20 flex items-center gap-2 pointer-events-auto" style={{ top: 'calc(35dvh + 12px)' }}>
          {/* Location pill - city only */}
          {(() => {
            const cityDisplay = getCityOnly({ city: business.city, region: business.region, country: business.country, location: business.location });
            return cityDisplay ? (
              <span 
                className="px-4 py-1.5 text-sm font-semibold rounded-full text-foreground flex items-center gap-1.5"
                style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {cityDisplay}
              </span>
            ) : null;
          })()}
          
          {/* Verified pill - only shows if verified */}
          {business.is_verified && (
            <span 
              className="px-4 py-1.5 text-sm font-semibold rounded-full flex items-center gap-1.5"
              style={{ 
                color: '#F7931E',
                background: 'rgba(247, 147, 30, 0.12)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(247, 147, 30, 0.30)'
              }}
            >
              <VerifiedBadge size="sm" />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Identity Stack */}
      <div className="pt-[68px] px-5 text-left relative z-10 pointer-events-auto">
        {/* Name + Verified */}
        <div className="flex items-center gap-1.5">
          <h1 className="text-[28px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
            {business.name}
          </h1>
          {business.is_verified && <VerifiedBadge size="lg" />}
        </div>
        
        {/* P6: Location below name REMOVED — kept in pill and map only */}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 px-5 flex items-center gap-2 relative z-10 pointer-events-auto">
        {/* P1+P3: Follow button — h-11, matching personal profile gradient variant */}
        <button 
          className="h-11 flex-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
          onClick={handleFollowToggle}
          disabled={followBusy}
        >
          {isFollowing ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Following
            </>
          ) : (
            'Follow'
          )}
        </button>
        
        {/* P0: Three-dot menu — renders for ALL users with role-based menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="min-h-[44px] min-w-[44px] flex-shrink-0 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
              style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
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
                <DropdownMenuItem 
                  onClick={() => setShowReportDialog(true)}
                  className="text-destructive"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats row — tappable */}
      <div className="mt-6 px-5 mb-6">
        <div className="flex items-center">
          {/* Posts — taps scroll to Activity tab */}
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className="flex items-center gap-1.5 min-h-[44px] cursor-pointer active:opacity-70 transition-opacity pr-6"
          >
            <span className="text-sm text-muted-foreground">Posts</span>
            <span className="text-base font-semibold text-foreground">{postsCount}</span>
          </button>

          <div className="w-px h-6 self-center" style={{ background: 'rgba(15,23,42,0.08)' }} />
          
          {/* Followers — taps navigate to business followers list */}
          <button
            type="button"
            onClick={() => navigate(`/business/${business.slug || business.id}/followers`)}
            className="flex items-center gap-1.5 min-h-[44px] cursor-pointer active:opacity-70 transition-opacity px-6"
          >
            <span className="text-sm text-muted-foreground">Followers</span>
            <span className="text-base font-semibold text-foreground">{followersCount}</span>
          </button>

          <div className="w-px h-6 self-center" style={{ background: 'rgba(15,23,42,0.08)' }} />

          {/* Following — TODO: wire up business following count */}
          <div
            className="flex items-center gap-1.5 min-h-[44px] pl-6 cursor-default"
          >
            <span className="text-sm text-muted-foreground">Following</span>
            <span className="text-base font-semibold text-foreground">0</span>
          </div>
        </div>
      </div>

      {/* White content sheet */}
      <div className="pb-2 min-h-[60vh]">
        {/* About section */}
        <section className="px-5 mb-6">
          <div className="mb-2">
            <h3 className="text-[17px] text-foreground" style={{ fontWeight: 900 }}>About</h3>
          </div>
          {bioText ? (
            <div>
              <p 
                ref={bioRef}
                className={cn(
                  "text-base text-foreground leading-relaxed whitespace-pre-wrap",
                  !bioExpanded && "line-clamp-4"
                )}
                style={{ overflowWrap: 'anywhere' }}
              >
                {bioText}
              </p>
              {(isBioClamped || bioExpanded) && (
                 <button
                   onClick={() => setBioExpanded(!bioExpanded)}
                   className="text-[0.8125rem] font-semibold mt-1 min-h-[44px] flex items-center gap-0.5 active:scale-[0.97] transition-transform"
                   style={{ color: '#F7931E' }}
                 >
                  {bioExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          ) : (
            <p className="text-base text-muted-foreground italic">No description provided</p>
          )}
        </section>

        {/* Business-specific section: Website, Call, Location */}
        <section className="px-5 mb-6">
          {/* Website pill */}
          {business.website && (
            <a
              href={ensureProtocol(business.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-3 min-h-[44px] text-sm font-semibold text-foreground active:scale-[0.98] transition-transform mr-2 mb-2"
              style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
              onClick={() => trackBusinessAction(business.id, 'website', user?.id)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {formatUrlForDisplay(business.website)}
            </a>
          )}
          
          {/* Call pill */}
          {business.phone && (
            <button
              onClick={handleCall}
              className="inline-flex items-center gap-1.5 rounded-full px-3 min-h-[44px] text-sm font-semibold text-foreground active:scale-[0.98] transition-transform mr-2 mb-2"
              style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </button>
          )}
          
          {/* Location Card - shows when location exists OR for linked golf clubs */}
          {(business.location || business.club_id) && (
            <BusinessLocationCard
              location={business.location || ''}
              lat={business.lat}
              lng={business.lng}
              businessName={business.name}
              city={business.city}
              country={business.country}
              region={business.region}
              isOwner={isOwner}
              isLinkedClub={!!business.club_id}
            />
          )}
        </section>

        {/* Creator Section - renders only if business owner has creator mode */}
        {user?.id && (
          <CreatorSection userId={user.id} isOwnProfile={isOwner || false} />
        )}

        {/* Segmented control tabs */}
        <section className="px-4 py-2 pointer-events-auto">
          <div className="flex items-center justify-center gap-1 w-full">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as BusinessTab)}
                  className={cn(
                    "relative flex-1 min-h-[44px] transition-all duration-200 whitespace-nowrap active:scale-[0.98] rounded-lg px-4 py-1.5 text-sm",
                    isActive
                      ? "font-semibold"
                      : "font-medium text-[#64748B] hover:text-foreground"
                  )}
                  style={{
                    background: isActive ? '#0F172A' : 'transparent',
                    color: isActive ? '#ffffff' : undefined,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tab Content */}
        <div className="pt-4 px-5">
          {getCurrentContent()}
        </div>
      </div>

      {/* Bottom Navigation Spacer */}
      <div style={{ height: 'max(env(safe-area-inset-bottom, 0px), 20px)', paddingBottom: '80px' }} />

      {/* Scroll to top FAB */}
      <ScrollToTopGlass />

      {/* Avatar Lightbox */}
      <AvatarLightbox
        isOpen={isAvatarLightboxOpen}
        onClose={() => setIsAvatarLightboxOpen(false)}
        imageUrl={business?.logo_url || ''}
        altText={`${business?.name} logo`}
        shape="squircle"
        fallbackInitial={initials}
      />

      {/* Report Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report {business?.name}?</AlertDialogTitle>
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

      {/* Crop Modal */}
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
      <ScrollToTopGlass />
    </PageRoot>
  );
};

export default BusinessProfilePage;
