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
  ChevronRight, Share2, Link2, AlertCircle, ArrowLeft, Camera, Flag
} from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BusinessLocationCard } from '@/components/business/BusinessLocationCard';
import { BusinessImageActionSheet } from '@/components/business/BusinessImageActionSheet';
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

// Tab content components
import { BusinessActivityFeed } from '@/components/business/posts/BusinessActivityFeed';
import { BusinessProfileInfo } from '@/components/business/BusinessProfileInfo';
import { PeopleTab } from '@/components/business/PeopleTab';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { AvatarLightbox } from '@/components/shared/AvatarLightbox';

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
  const [logoSheetOpen, setLogoSheetOpen] = useState(false);
  const [coverSheetOpen, setCoverSheetOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<BusinessTab>('content');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isBioClamped, setIsBioClamped] = useState(false);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

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
      toast.success('Link copied to clipboard');
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied');
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
    { id: 'content', label: 'Activity' },
    { id: 'golfers', label: 'People' },
    { id: 'info', label: 'About' },
  ];

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'content':
        return (
          <BusinessActivityFeed 
            businessId={business?.id || ''}
            businessName={business?.name || ''}
            businessLogo={business?.logo_url}
            followerCount={followersCount}
            membership={membership ?? null} 
          />
        );
      case 'golfers':
        return (
          <PeopleTab 
            businessId={business?.id || ''}
            businessName={business?.name || ''}
            businessLocation={business?.location || undefined}
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
    <PageRoot className="min-h-screen bg-background" immersiveStatusBar immersive>
      {/* Hero Section - full-bleed immersive, extends behind notch */}
      <div className="relative pointer-events-none" style={{ zIndex: 1 }}>
        {/* Hero Image Container - full-bleed behind notch */}
        <div className="relative w-full overflow-hidden" style={{ height: 'calc(200px + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}>
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Business cover" 
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/30" />
          )}

          {/* P7: Cover photo edit button for owners */}
          {isOwner && (
            <button
              onClick={() => setCoverSheetOpen(true)}
              className="absolute bottom-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm active:scale-[0.95] transition-transform z-10 pointer-events-auto"
            >
              {uploadingCover ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
          )}
        </div>

        {/* P1: Back button — h-11 w-11, rounded-full, active:scale */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 active:scale-95 transition-all z-10 pointer-events-auto"
          style={{ top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        {/* Avatar - squircle, left-aligned, positioned OUTSIDE the overflow-hidden container */}
        <div className="absolute left-5 z-20 pointer-events-auto" style={{ bottom: '-62px' }}>
          <button
            className="relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-[34%] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => setIsAvatarLightboxOpen(true)}
            aria-label="View business logo"
          >
            <div className="relative w-[124px] h-[124px]">
              {/* 2px background ring */}
              <div className="clbhouz-squircle absolute inset-0 bg-background" />

              {/* Avatar */}
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
                  <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* P7: Avatar camera badge for owners */}
          {isOwner && (
            <button
              onClick={(e) => { e.stopPropagation(); setLogoSheetOpen(true); }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-sm active:scale-[0.95] transition-transform z-30"
              aria-label="Change logo"
            >
              {uploadingLogo ? (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Pills row - right side, just below header photo */}
        <div className="absolute right-5 z-20 flex items-center gap-2 pointer-events-auto" style={{ top: 'calc(200px + max(env(safe-area-inset-top, 0px), 47px) + 8px)' }}>
          {/* Location pill - city only */}
          {(() => {
            const cityDisplay = getCityOnly({ city: business.city, region: business.region, country: business.country, location: business.location });
            return cityDisplay ? (
              <span 
                className="px-4 py-1.5 text-sm font-semibold rounded-full bg-card text-foreground flex items-center gap-1.5 shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5" />
                {cityDisplay}
              </span>
            ) : null;
          })()}
          
          {/* Verified pill - only shows if verified */}
          {business.is_verified && (
            <span 
              className="px-4 py-1.5 text-sm font-semibold rounded-full text-emerald-700 flex items-center gap-1.5"
              style={{ 
                background: 'rgba(52, 199, 89, 0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(52, 199, 89, 0.3)'
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
          <h1 className="text-[28px] font-semibold text-foreground">
            {business.name}
          </h1>
          {business.is_verified && <VerifiedBadge size="lg" />}
        </div>
        
        {/* P6: Location below name REMOVED — kept in pill and map only */}
      </div>

      {/* Action Buttons */}
      <div className="mt-3 px-5 flex items-center gap-2 relative z-10 pointer-events-auto">
        {/* P1+P3: Follow button — h-11, matching personal profile gradient variant */}
        <button 
          className={cn(
            "h-11 flex-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] disabled:opacity-60",
            isFollowing
              ? "bg-muted text-foreground border border-border"
              : "bg-card border border-foreground text-foreground"
          )}
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
              className="min-h-[44px] min-w-[44px] flex-shrink-0 rounded-full flex items-center justify-center bg-card border border-border active:scale-[0.95] transition-transform"
            >
              <MoreHorizontal className="w-5 h-5 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isOwner ? (
              <>
                <DropdownMenuItem onClick={() => navigate(`/business/${business.id}/edit`)}>
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
                  onClick={() => toast.info('Report submitted. Thank you.')}
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
      <div className="mt-6 px-5">
        <div className="flex items-center gap-6">
          {/* Posts — taps scroll to Activity tab */}
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className="flex items-center gap-1.5 min-h-[44px] cursor-pointer active:opacity-70 transition-opacity"
          >
            <span className="text-sm text-muted-foreground">Posts</span>
            <span className="text-base font-semibold text-foreground">{postsCount}</span>
          </button>
          
          {/* Followers — taps navigate to business followers list */}
          <button
            type="button"
            onClick={() => navigate(`/business/${business.slug || business.id}/followers`)}
            className="flex items-center gap-1.5 min-h-[44px] cursor-pointer active:opacity-70 transition-opacity"
          >
            <span className="text-sm text-muted-foreground">Followers</span>
            <span className="text-base font-semibold text-foreground">{followersCount}</span>
          </button>
        </div>
      </div>

      {/* White content sheet */}
      <div className="bg-card pt-5 pb-32 min-h-[60vh]">
        {/* About section */}
        <section className="px-5 mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-2">About</h3>
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
                  className="text-sm font-medium mt-1 hover:underline text-muted-foreground min-h-[44px] flex items-center active:scale-[0.98] transition-transform"
                >
                  {bioExpanded ? 'Show less' : 'More'}
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
              className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 min-h-[44px] text-sm font-medium text-foreground active:scale-[0.98] transition-transform mr-2 mb-2"
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
              className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 min-h-[44px] text-sm font-medium text-foreground active:scale-[0.98] transition-transform mr-2 mb-2"
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

        {/* Segmented control tabs */}
        <section className="px-4 py-2 pointer-events-auto">
          <div 
            className="flex items-stretch rounded-xl overflow-hidden bg-muted"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as BusinessTab)}
                  className={cn(
                    "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px] active:scale-[0.98]",
                    isActive 
                      ? "bg-card text-foreground shadow-sm m-1 rounded-lg border border-border" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
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
      <div className="h-20" />

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

      {/* P7: Image Action Sheets for owner editing */}
      <BusinessImageActionSheet
        open={logoSheetOpen}
        onOpenChange={setLogoSheetOpen}
        type="logo"
        hasImage={!!business.logo_url}
        uploading={uploadingLogo}
        onUpload={async (file) => { await uploadLogo(file); }}
        onRemove={async () => { await removeLogo(); }}
      />
      <BusinessImageActionSheet
        open={coverSheetOpen}
        onOpenChange={setCoverSheetOpen}
        type="cover"
        hasImage={!!business.cover_image_url}
        uploading={uploadingCover}
        onUpload={async (file) => { await uploadCover(file); }}
        onRemove={async () => { await removeCover(); }}
      />
    </PageRoot>
  );
};

export default BusinessProfilePage;
