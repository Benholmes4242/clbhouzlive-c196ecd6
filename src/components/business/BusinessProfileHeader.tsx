import React, { useState } from 'react';
import { Phone, Globe, MapPin, BarChart2, Building2, Camera, Loader2 } from 'lucide-react';
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

  const handleViewInsights = () => {
    navigate(`/business/${business.id}/insights`);
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
    <section className="relative w-full">
      {/* HERO IMAGE with gradient fade */}
      <div className="relative w-full h-[280px] overflow-hidden">
        {business.cover_image_url ? (
          <img
            src={business.cover_image_url}
            alt={`${business.name} cover`}
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        )}
        
        {/* Gradient fade overlay - bottom fade into content */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 40%, hsl(var(--background)) 100%)',
          }}
        />

        {/* Edit cover button - for owners/admins only */}
        {canEditImages && (
          <button
            onClick={() => setCoverSheetOpen(true)}
            className="absolute bottom-16 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/60 transition-colors z-10"
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

      {/* IDENTITY OVERLAY - Avatar + Name positioned over gradient fade */}
      <div className="relative" style={{ marginTop: '-100px' }}>
        <div className="flex flex-col items-center px-4">
          {/* Avatar with camera badge for owners */}
          <button
            onClick={canEditImages ? () => setLogoSheetOpen(true) : undefined}
            className={cn(
              "relative z-20",
              canEditImages && "cursor-pointer"
            )}
            disabled={!canEditImages}
          >
            {business.logo_url ? (
              <SquircleAvatar
                src={business.logo_url}
                alt={business.name}
                size={96}
                className="border-[3px] border-background shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-sq-md bg-card flex items-center justify-center text-2xl font-bold text-muted-foreground border-[3px] border-background shadow-xl">
                {initials}
              </div>
            )}
            
            {/* Camera badge - bottom right of avatar */}
            {canEditImages && (
              <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground shadow-md z-30">
                {uploadingLogo ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </span>
            )}
          </button>

          {/* Name + Verified Badge */}
          <div className="flex items-center gap-2 mt-4">
            <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground text-center">
              {business.name}
            </h1>
            {business.is_verified && (
              <VerifiedBadge size="lg" />
            )}
          </div>

          {/* Handle + Business badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
            {business.slug && (
              <span className="text-sm text-muted-foreground">@{business.slug}</span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              Business
            </span>
          </div>

          {/* Category pill */}
          {business.category && (
            <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {business.category}
            </span>
          )}

          {/* Location */}
          {business.location && (
            <button 
              onClick={handleDirections}
              className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              {business.location}
            </button>
          )}

          {/* Website link pill */}
          {business.website && (
            <a
              href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="w-3 h-3" />
              {formatWebsiteUrl(business.website)}
            </a>
          )}
        </div>
      </div>

      {/* BIO / Tagline */}
      {business.description && (
        <div className="mt-4 px-6 md:px-8">
          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {business.description}
          </p>
        </div>
      )}

      {/* Stats Row */}
      <section className="mt-5 flex items-center justify-center gap-10 px-4">
        <StatItem label="Posts" value={postsCount} />
        <StatItem label="Followers" value={followersCount} />
        <StatItem label="Rating" value="–" />
      </section>

      {/* Actions Row */}
      <div className="mt-5 px-4 flex flex-wrap justify-center gap-2">
        {/* Follow button for non-owners */}
        {!membership?.canManage && (
          <BusinessFollowButton 
            businessId={business.id} 
            className="rounded-full px-5"
          />
        )}
        {membership?.canViewInsights && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewInsights}
            className="gap-1.5 rounded-full px-4"
          >
            <BarChart2 className="h-4 w-4" />
            Insights
          </Button>
        )}
        {business.phone && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCall}
            className="rounded-full px-4"
          >
            <Phone className="h-4 w-4 mr-1.5" />
            Call
          </Button>
        )}
        {business.website && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleWebsite}
            className="rounded-full px-4"
          >
            <Globe className="h-4 w-4 mr-1.5" />
            Website
          </Button>
        )}
        {business.location && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDirections}
            className="rounded-full px-4"
          >
            <MapPin className="h-4 w-4 mr-1.5" />
            Directions
          </Button>
        )}
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

function StatItem({ label, value }: { label: string; value: number | string }) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-semibold text-foreground tabular-nums">
        {displayValue}
      </span>
      <span className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
