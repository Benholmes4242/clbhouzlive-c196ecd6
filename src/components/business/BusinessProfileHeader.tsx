import React from 'react';
import { Phone, Globe, MapPin, BadgeCheck, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { useNavigate } from 'react-router-dom';

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

  const handleCall = () => {
    if (business.phone) {
      window.location.href = `tel:${business.phone}`;
    }
  };

  const handleWebsite = () => {
    if (business.website) {
      const url = business.website.startsWith('http') 
        ? business.website 
        : `https://${business.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDirections = () => {
    if (business.location) {
      const query = encodeURIComponent(business.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleViewInsights = () => {
    navigate(`/business/insights?businessId=${business.id}`);
  };

  // Generate initials from business name
  const initials = business.name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative">
      {/* Cover image / gradient background */}
      <div className="h-[260px] md:h-[300px] w-full relative overflow-hidden">
        {business.cover_image_url ? (
          <img
            src={business.cover_image_url}
            alt={`${business.name} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600" />
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          {/* Left: Logo + Info */}
          <div className="flex items-end gap-4">
            {/* Logo */}
            <div className="shrink-0">
              {business.logo_url ? (
                <SquircleAvatar
                  src={business.logo_url}
                  alt={business.name}
                  size={96}
                  className="border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-sq-md bg-white flex items-center justify-center text-2xl font-bold text-slate-700 border-4 border-white shadow-lg">
                  {initials}
                </div>
              )}
            </div>

            {/* Name, category, location */}
            <div className="text-white mb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">{business.name}</h1>
                {business.is_verified && (
                  <BadgeCheck className="h-6 w-6 text-blue-400" />
                )}
              </div>
              <p className="text-white/80 text-sm md:text-base">
                {[business.category, business.location].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          {/* Right: CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            {membership?.canViewInsights && (
              <Button
                variant="glass"
                size="sm"
                onClick={handleViewInsights}
                className="gap-1.5"
              >
                <BarChart2 className="h-4 w-4" />
                View insights
              </Button>
            )}
            {business.phone && (
              <Button variant="glass" size="sm" onClick={handleCall}>
                <Phone className="h-4 w-4 mr-1.5" />
                Call
              </Button>
            )}
            {business.website && (
              <Button variant="glass-outline" size="sm" onClick={handleWebsite}>
                <Globe className="h-4 w-4 mr-1.5" />
                Website
              </Button>
            )}
            {business.location && (
              <Button variant="glass-outline" size="sm" onClick={handleDirections}>
                <MapPin className="h-4 w-4 mr-1.5" />
                Directions
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-6 md:gap-10">
            <StatItem label="Followers" value={followersCount} />
            <StatItem label="Posts" value={postsCount} />
            <StatItem label="Rating" value="–" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number | string }) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <div className="text-center">
      <p className="text-lg md:text-xl font-semibold text-foreground">{displayValue}</p>
      <p className="text-xs md:text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
