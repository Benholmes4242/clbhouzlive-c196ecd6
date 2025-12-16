import React, { useState } from 'react';
import { Phone, Globe, MapPin, Camera, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { useNavigate } from 'react-router-dom';
import { trackBusinessAction } from '@/lib/businessAnalyticsTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';
import { BusinessImageActionSheet } from './BusinessImageActionSheet';
import { useBusinessImageUpload } from '@/hooks/useBusinessImageUpload';
import { BusinessFollowButton } from './BusinessFollowButton';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface BusinessProfileHeaderProps {
  business: BusinessProfile;
  membership: BusinessMembership | null;
  postsCount: number;
  followersCount: number;
}

export function BusinessProfileHeader({
  business,
  membership,
  postsCount,
  followersCount,
}: BusinessProfileHeaderProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  
  // Image editing state
  const [logoSheetOpen, setLogoSheetOpen] = useState(false);
  const [coverSheetOpen, setCoverSheetOpen] = useState(false);
  const { uploadLogo, removeLogo, uploadCover, removeCover, uploadingLogo, uploadingCover } = useBusinessImageUpload(business.id);
  
  // Check if user can edit images
  const canEditImages = membership?.role === 'owner' || membership?.role === 'admin';

  const handleCall = () => {
    if (business.phone) {
      trackBusinessAction(business.id, 'call', user?.id);
      window.location.href = `tel:${business.phone}`;
    }
  };

  const handleWebsite = () => {
    if (business.website) {
      trackBusinessAction(business.id, 'website', user?.id);
      const url = business.website.startsWith('http') 
        ? business.website 
        : `https://${business.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDirections = () => {
    if (business.location) {
      trackBusinessAction(business.id, 'directions', user?.id);
      const query = encodeURIComponent(business.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  // Generate initials from business name
  const initials = business.name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  // Format website URL for display
  const formatWebsiteUrl = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  return (
    <section className="relative w-full bg-[#F4F5F7]">
      {/* COVER IMAGE - Light UI with contain to match Edit preview */}
      <div className="relative w-full h-[220px] overflow-hidden" style={{ background: '#F4F5F7' }}>
        {business.cover_image_url ? (
          <img
            src={business.cover_image_url}
            alt={`${business.name} cover`}
            className="w-full h-full object-contain"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
        )}
        
        {/* Subtle gradient overlay for light UI readability */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.15) 100%)',
          }}
        />

        {/* Edit cover button - for owners/admins only */}
        {canEditImages && (
          <button
            onClick={() => setCoverSheetOpen(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium hover:bg-white transition-colors shadow-sm"
            style={{ border: '1px solid rgba(31,36,40,0.08)' }}
          >
            {uploadingCover ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            <span>Change cover</span>
          </button>
        )}
      </div>

      {/* WHITE CARD META BLOCK - Avatar + Identity */}
      <div className="relative bg-white mx-4 -mt-12 rounded-sq-lg shadow-sm" style={{ border: '1px solid rgba(31,36,40,0.08)' }}>
        <div className="px-5 pt-5 pb-5">
          {/* Avatar row */}
          <div className="flex items-start gap-4">
            {/* AVATAR with camera badge for owners */}
            <div className="flex-shrink-0 -mt-14 relative">
              <button
                onClick={canEditImages ? () => setLogoSheetOpen(true) : undefined}
                className={cn(
                  "relative",
                  canEditImages && "cursor-pointer"
                )}
                disabled={!canEditImages}
              >
                {business.logo_url ? (
                  <SquircleAvatar
                    src={business.logo_url}
                    alt={business.name}
                    size={88}
                    className="shadow-lg"
                  />
                ) : (
                  <div className="w-[88px] h-[88px] rounded-sq-md flex items-center justify-center text-2xl font-bold text-slate-600 shadow-lg" style={{ background: '#F4F5F7' }}>
                    {initials}
                  </div>
                )}
                
                {/* Camera badge - bottom right of avatar */}
                {canEditImages && (
                  <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-[#F7931E] text-white shadow-md">
                    {uploadingLogo ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                  </span>
                )}
              </button>
            </div>

            {/* TEXT META (name, verified, category pill) */}
            <div className="flex-1 min-w-0 pt-1">
              {/* Name + Verified badge */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xl font-semibold tracking-tight text-[#1F2428] truncate">
                  {business.name}
                </h1>
                {business.is_verified && (
                  <VerifiedBadge size="lg" />
                )}
              </div>

              {/* Category pill */}
              {business.category && (
                <span className="inline-flex items-center mt-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-[#5E666D]" style={{ background: '#EDEFF2' }}>
                  {business.category}
                </span>
              )}

              {/* Location */}
              {business.location && (
                <div className="flex items-center gap-1 mt-2 text-sm text-[#5E666D]">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{business.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* BIO / Tagline */}
          {business.description && (
            <p className="mt-4 text-sm text-[#5E666D] leading-relaxed line-clamp-2">
              {business.description}
            </p>
          )}

          {/* PRIMARY ACTIONS ROW */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/* Follow button for non-owners */}
            {!membership?.canManage && (
              <BusinessFollowButton 
                businessId={business.id} 
                className="rounded-full px-5"
              />
            )}
            
            {business.website && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleWebsite}
                className="rounded-full px-4 text-[#1F2428] border-[#1F2428]/10 hover:bg-[#EDEFF2]"
              >
                <Globe className="h-4 w-4 mr-1.5" />
                Website
                <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
              </Button>
            )}
            
            {business.phone && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCall}
                className="rounded-full px-4 text-[#1F2428] border-[#1F2428]/10 hover:bg-[#EDEFF2]"
              >
                <Phone className="h-4 w-4 mr-1.5" />
                Call
              </Button>
            )}
            
            {business.location && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDirections}
                className="rounded-full px-4 text-[#1F2428] border-[#1F2428]/10 hover:bg-[#EDEFF2]"
              >
                <MapPin className="h-4 w-4 mr-1.5" />
                Directions
              </Button>
            )}
          </div>
        </div>

        {/* SIGNALS BAR - Subtle row with key metrics */}
        <div 
          className="flex items-center justify-around py-3 border-t"
          style={{ borderColor: 'rgba(31,36,40,0.06)' }}
        >
          <SignalItem label="Followers" value={followersCount} />
          <div className="w-px h-6 bg-[#1F2428]/6" />
          <SignalItem label="Posts" value={postsCount} />
          <div className="w-px h-6 bg-[#1F2428]/6" />
          <SignalItem label="Rating" value="–" />
        </div>
      </div>

      {/* Image Action Sheets */}
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
    </section>
  );
}

function SignalItem({ label, value }: { label: string; value: number | string }) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <div className="flex flex-col items-center px-4">
      <span className="text-base font-semibold text-[#1F2428] tabular-nums">
        {displayValue}
      </span>
      <span className="mt-0.5 text-[11px] text-[#5E666D]">
        {label}
      </span>
    </div>
  );
}
