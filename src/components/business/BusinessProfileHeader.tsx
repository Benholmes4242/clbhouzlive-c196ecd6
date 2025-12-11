import React from 'react';
import { Phone, Globe, MapPin, BadgeCheck, BarChart2, Building2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { useNavigate } from 'react-router-dom';
import { trackBusinessAction } from '@/lib/businessAnalyticsTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';
import { BusinessAchievementsStrip } from './BusinessAchievementsStrip';
import { BusinessHighlightsReel } from './BusinessHighlightsReel';

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

  // Format identity line: Category · Location
  const identityLine = [business.category, business.location].filter(Boolean).join(' · ');

  return (
    <section className="relative w-full">
      {/* HERO IMAGE - Same as personal profile */}
      <div className="relative w-full h-[250px] overflow-hidden">
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
        
        {/* Global vignette - subtle top + bottom darkening */}
        <div
          className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-70"
          style={{
            background: 'radial-gradient(circle at top, rgba(0,0,0,0.22), transparent 55%), radial-gradient(circle at bottom, rgba(0,0,0,0.18), transparent 55%)',
          }}
        />
      </div>

      {/* META BLOCK - Glass panel with avatar + text (matches personal profile) */}
      <div className="relative" style={{ marginTop: '-40px' }}>
        <div className="relative flex items-center gap-4 md:gap-6 rounded-3xl bg-muted/0 backdrop-blur-xl px-4 md:px-6 py-4 md:py-5">
          {/* AVATAR */}
          <div className="flex-shrink-0 z-20">
            {business.logo_url ? (
              <SquircleAvatar
                src={business.logo_url}
                alt={business.name}
                size={80}
                className="border-[2.5px] border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-sq-md bg-white flex items-center justify-center text-xl font-bold text-slate-700 border-[2.5px] border-white shadow-lg">
                {initials}
              </div>
            )}
          </div>

          {/* TEXT META (name, handle, category · location) */}
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 md:gap-2">
            {/* Name + Verified badge */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground text-center">
                {business.name}
              </h1>
              {business.is_verified && (
                <BadgeCheck className="h-5 w-5 text-blue-500" />
              )}
            </div>

            {/* Business badge + Category */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
              {business.slug && <span>@{business.slug}</span>}
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                <Building2 className="w-3 h-3" />
                Business
              </span>
              {business.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>

            {/* Identity line: Category · Location */}
            {identityLine && (
              <p className="text-sm text-muted-foreground text-center">
                {identityLine}
              </p>
            )}

            {/* Website link pill */}
            {business.website && (
              <a
                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-3 h-3" />
                {formatWebsiteUrl(business.website)}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* BIO / Tagline - Full width below glass panel */}
      {business.description && (
        <div className="mt-4 md:mt-5 px-6 md:px-8">
          <p className="mx-auto max-w-3xl text-center text-sm md:text-[15px] leading-relaxed text-muted-foreground line-clamp-2">
            {business.description}
          </p>
        </div>
      )}

      {/* Stories-Style Highlights Reel */}
      <BusinessHighlightsReel 
        businessId={business.id}
        isOwner={membership?.canManage || false}
        className="mt-4"
      />

      {/* Actions Row - Tight row of pill buttons */}
      <div className="mt-4 px-4 flex flex-wrap justify-center gap-2">
        {/* Follow button for non-owners */}
        {!membership?.canManage && (
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 rounded-full px-4"
          >
            <UserPlus className="h-4 w-4" />
            Follow
          </Button>
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

      {/* Business Achievements Strip */}
      <BusinessAchievementsStrip 
        followersCount={followersCount}
        postsCount={postsCount}
        className="mt-4"
      />

      {/* Stats Row - Matches personal profile styling */}
      <section className="mt-5 flex items-center justify-center gap-8 px-4">
        <StatItem label="Posts" value={postsCount} />
        <StatItem label="Followers" value={followersCount} />
        <StatItem label="Rating" value="–" />
      </section>

      {/* Faint divider */}
      <div 
        className="mt-5 h-px w-full"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsl(var(--foreground) / 0.05) 20%, hsl(var(--foreground) / 0.05) 80%, transparent 100%)',
        }}
      />
    </section>
  );
}

function StatItem({ label, value }: { label: string; value: number | string }) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <div className="flex flex-col items-center">
      <span className="text-base font-semibold text-foreground tabular-nums">
        {displayValue}
      </span>
      <span className="mt-1 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
