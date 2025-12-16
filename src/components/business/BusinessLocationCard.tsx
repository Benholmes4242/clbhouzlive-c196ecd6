import React, { useState } from 'react';
import { MapPin, Navigation, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BusinessLocationCardProps {
  location: string;
  lat?: number | null;
  lng?: number | null;
  businessName: string;
  onDirections?: () => void;
}

export function BusinessLocationCard({
  location,
  lat,
  lng,
  businessName,
  onDirections,
}: BusinessLocationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleDirections = () => {
    if (onDirections) {
      onDirections();
      return;
    }
    
    // Default directions behavior
    let query: string;
    if (lat && lng) {
      query = `${lat},${lng}`;
    } else {
      query = encodeURIComponent(`${businessName}, ${location}`);
    }
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Generate static map URL (if we have coordinates)
  const mapUrl = lat && lng
    ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+F7931E(${lng},${lat})/${lng},${lat},13,0/400x200@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN || ''}`
    : null;

  return (
    <div 
      className="bg-white mx-4 mt-3 rounded-sq-lg shadow-sm overflow-hidden"
      style={{ border: '1px solid rgba(31,36,40,0.08)' }}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#EDEFF2] flex items-center justify-center flex-shrink-0">
            <MapPin className="h-4 w-4 text-[#5E666D]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0F0F0F]">Location</h3>
            <p className="text-sm text-[#5E666D] mt-0.5">{location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#97A1AA]">
          <span className="text-xs">{expanded ? 'Hide' : 'Tap to expand'}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5">
          {/* Map preview */}
          {mapUrl ? (
            <div className="relative w-full h-40 rounded-sq-md overflow-hidden mb-4 bg-slate-100">
              <img
                src={mapUrl}
                alt={`Map of ${businessName}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-40 rounded-sq-md mb-4 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">{location}</p>
              </div>
            </div>
          )}

          {/* Get directions button */}
          <Button
            onClick={handleDirections}
            className="w-full h-10 rounded-full bg-[#1F2428] hover:bg-[#0F0F0F] text-white"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Get directions
            <ExternalLink className="h-3 w-3 ml-1.5 opacity-50" />
          </Button>
        </div>
      )}
    </div>
  );
}
