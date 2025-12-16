import React, { useState } from 'react';
import { MapPin, Maximize2, ExternalLink } from 'lucide-react';

interface BusinessLocationCardProps {
  location: string;
  lat?: number | null;
  lng?: number | null;
  businessName: string;
  city?: string | null;
  country?: string | null;
  region?: string | null;
  isOwner?: boolean;
}

// Mapbox public token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2xiaG91eiIsImEiOiJjbTVyejIzMXcxemx2MmpzZDU3YjkxNjNkIn0.H_w9d-UAvvMRkJ_9DoVQ-A';

// Format location for display: City, Country (or City, Region, Country for US/CA)
function formatDisplayLocation(props: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  location: string;
}): string {
  const { city, region, country, location } = props;
  
  // Try to build from structured data
  if (city && country) {
    // For US/CA, include region (state/province)
    if ((country === 'United States' || country === 'Canada' || country === 'US' || country === 'CA') && region) {
      return `${city}, ${region}, ${country}`;
    }
    return `${city}, ${country}`;
  }
  
  // Fallback: extract first part of location (usually city) + last part (country)
  if (location) {
    const parts = location.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // Return first and last part
      return `${parts[0]}, ${parts[parts.length - 1]}`;
    }
    return parts[0] || location;
  }
  
  return location;
}

export function BusinessLocationCard({
  location,
  lat,
  lng,
  businessName,
  city,
  country,
  region,
  isOwner = false,
}: BusinessLocationCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Don't render if no valid coordinates
  const hasValidCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
  
  if (!hasValidCoords) {
    // Show owner-only prompt
    if (isOwner) {
      return (
        <div className="mt-4 p-4 rounded-sq-md bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sq-sm bg-slate-100 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Add your address to enable the map</p>
              <p className="text-xs text-slate-500">Your location helps golfers find you</p>
            </div>
          </div>
        </div>
      );
    }
    return null; // Don't show anything for non-owners if no coords
  }
  
  const displayLocation = formatDisplayLocation({ city, region, country, location });
  
  // Generate static map URL
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+F7931E(${lng},${lat})/${lng},${lat},14,0/400x200@2x?access_token=${MAPBOX_TOKEN}`;
  
  // Expanded map URL (larger)
  const expandedMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+F7931E(${lng},${lat})/${lng},${lat},15,0/800x400@2x?access_token=${MAPBOX_TOKEN}`;

  const handleOpenAppleMaps = () => {
    window.open(`https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(businessName)}`, '_blank');
  };

  const handleOpenGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  return (
    <div className="mt-4">
      {/* Map thumbnail card */}
      <div 
        className="relative w-full rounded-sq-md overflow-hidden border border-slate-200 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`relative w-full ${expanded ? 'h-[280px]' : 'h-[160px]'} transition-all duration-300`}>
          <img
            src={expanded ? expandedMapUrl : mapUrl}
            alt={`Map of ${businessName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          
          {/* Expand pill - only show when collapsed */}
          {!expanded && (
            <button
              type="button"
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium shadow-lg group-hover:bg-black/80 transition-colors"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Tap to expand</span>
            </button>
          )}
        </div>
        
        {/* Location label inside card */}
        <div className="px-3 py-2.5 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-700 font-medium">{displayLocation}</span>
          </div>
        </div>
      </div>
      
      {/* Apple/Google Maps buttons - show when expanded */}
      {expanded && (
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAppleMaps();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Apple Maps
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenGoogleMaps();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Google Maps
          </button>
        </div>
      )}
    </div>
  );
}
