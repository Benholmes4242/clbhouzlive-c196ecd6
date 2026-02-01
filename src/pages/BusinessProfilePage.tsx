/**
 * BusinessProfilePage - Mirrors PersonalProfile layout exactly
 * Only content substitutions, not layout changes
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessPostsCount } from '@/hooks/useBusinessPosts';
import { useBusinessFollowersCount, useIsFollowingBusiness, useBusinessFollowMutation } from '@/hooks/useBusinessFollow';
import { supabase } from '@/integrations/supabase/client';
import { 
  Phone, Globe, MapPin, MoreHorizontal, Check, ExternalLink, Loader2, 
  ChevronRight, Share2, Link2, AlertCircle
} from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';

import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BusinessLocationCard } from '@/components/business/BusinessLocationCard';
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

// Background color - matches personal profile page (slate-50)
const BG_COLOR = '#f8fafc';

type BusinessTab = 'content' | 'golfers' | 'info';

const BusinessProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { user, loading: authLoading } = useSupabaseSession();

  // Safe area bleed: transparent status bar with white icons for hero image
  useMedianStatusBar("dark", "transparent", true, false);

  const { data: business, isLoading, error } = useBusinessProfile(idOrSlug);
  const { data: membership } = useBusinessMembership(business?.id);
  const { data: postsCount = 0 } = useBusinessPostsCount(business?.id);
  const { data: followersCount = 0 } = useBusinessFollowersCount(business?.id);
  const { data: isFollowingStatus, isLoading: statusLoading } = useIsFollowingBusiness(business?.id, user?.id);
  const { follow, unfollow, isFollowing: followPending, isUnfollowing: unfollowPending } = useBusinessFollowMutation(business?.id || '', user?.id);

  const [activeTab, setActiveTab] = useState<BusinessTab>('content');
  const [activeMiniNav, setActiveMiniNav] = useState('posts');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isBioClamped, setIsBioClamped] = useState(false);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

  // Check ownership
  const isOwner = membership?.canManage;

  // Compute follow state
  const isFollowing = isFollowingStatus === true;
  const followBusy = followPending || unfollowPending || statusLoading;
  
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


  // Check if bio text is clamped (overflows 5 lines)
  useEffect(() => {
    const checkClamped = () => {
      if (bioRef.current) {
        setIsBioClamped(bioRef.current.scrollHeight > bioRef.current.clientHeight);
      }
    };
    checkClamped();
    // Re-check on window resize
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

  const handleDirections = () => {
    if (business?.location && business?.lat && business?.lng) {
      trackBusinessAction(business.id, 'directions', user?.id);
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`,
        '_blank'
      );
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
    { id: 'info', label: 'Info' },
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
          <BusinessProfileInfo business={business!} />
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BG_COLOR }}>
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
    <PageRoot className="min-h-screen" style={{ background: BG_COLOR }}>
      {/* Hero Section - bleeds into safe area */}
      {/* z-index: 1 ensures hero doesn't create tap-blocking layers above interactive elements */}
      <div 
        className="relative overflow-hidden pointer-events-none" 
        style={{ 
          marginTop: 'calc(-55px - env(safe-area-inset-top, 0px))', 
          zIndex: 1 
        }}
      >
        {/* Hero Image - extends into safe area */}
        <div 
          className="relative w-full overflow-hidden pointer-events-auto"
          style={{
            paddingTop: 'calc(31.25% + env(safe-area-inset-top, 0px))', // aspect-[3.2/1] = 31.25%
          }}
        >
          {heroUrl ? (
            <img 
              src={heroUrl} 
              alt="Business cover" 
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
          )}
          
        </div>

        {/* Avatar - squircle, left-aligned matching personal profile */}
        <button
          className="absolute left-5 -bottom-[62px] z-20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-[34%] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => setIsAvatarLightboxOpen(true)}
          aria-label="View business logo"
        >
          <div className="relative w-[124px] h-[124px]">
            {/* 2px background ring */}
            <div
              className="clbhouz-squircle absolute inset-0"
              style={{ background: BG_COLOR }}
            />

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
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-600">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Pills row - right side, just below header (matching personal profile position) */}
        <div className="absolute right-5 top-full mt-3 z-20 flex items-center gap-2">
          {/* Location pill - city only (white) */}
          {(() => {
            const cityDisplay = getCityOnly({ city: business.city, region: business.region, country: business.country, location: business.location });
            return cityDisplay ? (
              <span 
                className="px-4 py-1.5 text-sm font-semibold rounded-full text-[#0F0F0F] flex items-center gap-1.5"
                style={{ 
                  background: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(31, 36, 40, 0.08)'
                }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {cityDisplay}
              </span>
            ) : null;
          })()}
          
          {/* Verified pill - only shows if verified (replaces category) */}
          {business.is_verified && (
            <span 
              className="px-4 py-1.5 text-sm font-semibold rounded-full text-emerald-700 flex items-center gap-1.5"
              style={{ 
                background: 'rgba(52, 199, 89, 0.15)',
                boxShadow: '0 2px 8px rgba(31, 36, 40, 0.08)'
              }}
            >
              <VerifiedBadge size="sm" />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Identity Stack - matching personal profile */}
      <div className="pt-[70px] px-5 text-left">
        {/* Name + Verified */}
        <div className="flex items-center gap-1.5">
          <h1 className="text-[28px] font-semibold text-[#0F0F0F]">
            {business.name}
          </h1>
          {business.is_verified && <VerifiedBadge size="lg" />}
        </div>
        
        {/* Location - City + Country only (no mini map squircle) */}
        {(() => {
          const locationDisplay = getCityCountry({ city: business.city, region: business.region, country: business.country, location: business.location });
          return locationDisplay ? (
            <p className="mt-2 text-base font-medium text-slate-600">
              {locationDisplay}
            </p>
          ) : null;
        })()}
      </div>

      {/* Action Buttons - matching personal profile exactly */}
      <div className="mt-5 px-5 flex items-center gap-2">
        {/* Follow button */}
        <button 
          className="h-9 flex-1 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 bg-slate-700"
          onClick={handleFollowToggle}
          disabled={followBusy}
        >
          {followBusy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isFollowing ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Following
            </>
          ) : (
            'Follow'
          )}
        </button>
        
        {/* Message button - hidden until messaging is implemented */}
        
        {/* Owner-only menu (⋯) */}
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center"
                style={{
                  background: '#fff',
                  border: '1px solid #E0E0E0'
                }}
              >
                <MoreHorizontal className="w-4 h-4 text-[#0F0F0F]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Mini-nav row: Posts | Followers | Following - identical to personal profile */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between">
          {/* Posts */}
          <button
            onClick={() => setActiveMiniNav('posts')}
            className="pb-3 flex items-center gap-2"
          >
            <span className="text-sm text-slate-500">Posts</span>
            <span className="text-base font-semibold text-[#0F0F0F]">{postsCount}</span>
          </button>
          
          {/* Followers */}
          <button
            onClick={() => setActiveMiniNav('followers')}
            className="pb-3 flex items-center gap-2"
          >
            <span className="text-sm text-slate-500">Followers</span>
            <span className="text-base font-semibold text-[#0F0F0F]">{followersCount}</span>
          </button>
          
          {/* Following stat removed - businesses don't follow others yet */}
        </div>
      </div>

      {/* White content sheet */}
      <div className="bg-white pt-5 pb-32 min-h-[60vh]">
        {/* About section - identical to personal profile */}
        <section className="px-5 mb-6">
          <h3 className="text-xl font-semibold text-[#0F0F0F] mb-2">About</h3>
          {bioText ? (
            <div>
              <p 
                ref={bioRef}
                className={cn(
                  "text-base text-[#0F0F0F] leading-relaxed whitespace-pre-wrap",
                  !bioExpanded && "line-clamp-4"
                )}
                style={{ overflowWrap: 'anywhere' }}
              >
                {bioText}
              </p>
              {(isBioClamped || bioExpanded) && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-sm font-medium mt-1 hover:underline text-slate-500"
                >
                  {bioExpanded ? 'Show less' : 'More'}
                </button>
              )}
            </div>
          ) : (
            <p className="text-base text-slate-400 italic">No description provided</p>
          )}
        </section>

        {/* Business-specific section: Website, Call, Location (replaces Achievements) */}
        <section className="px-5 mb-6">
          {/* Website pill */}
          {business.website && (
            <a
              href={ensureProtocol(business.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors mr-2 mb-2"
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0'
              }}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors mr-2 mb-2"
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0'
              }}
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

        {/* Segmented control tabs - matches profile page exactly */}
        {/* pointer-events-auto ensures tabs remain tappable regardless of parent stacking */}
        <section className="px-4 py-2 pointer-events-auto">
          <div 
            className="flex items-stretch rounded-xl overflow-hidden pointer-events-auto"
            style={{ background: '#e2e8f0' }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as BusinessTab)}
                  className={cn(
                    "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px]",
                    isActive 
                      ? "bg-white text-[#1e293b] shadow-sm m-1 rounded-lg border border-[#e2e8f0]" 
                      : "text-[#64748b] hover:text-[#1e293b]"
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

      {/* Avatar Lightbox */}
      <AvatarLightbox
        isOpen={isAvatarLightboxOpen}
        onClose={() => setIsAvatarLightboxOpen(false)}
        imageUrl={business?.logo_url || ''}
        altText={`${business?.name} logo`}
        shape="squircle"
        fallbackInitial={initials}
      />
    </PageRoot>
  );
};

export default BusinessProfilePage;
