import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

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

  // Mapbox public token
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2xiaG91eiIsImEiOiJjbTVyejIzMXcxemx2MmpzZDU3YjkxNjNkIn0.H_w9d-UAvvMRkJ_9DoVQ-A';
  
  // Generate static map URL (if we have coordinates)
  const mapUrl = lat && lng
    ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+F7931E(${lng},${lat})/${lng},${lat},13,0/400x200@2x?access_token=${MAPBOX_TOKEN}`
    : null;

  return (
    <div className="mt-4">
      {/* Map preview - directly on background */}
      {mapUrl ? (
        <div className="relative w-full h-40 rounded-sq-md overflow-hidden bg-slate-100">
          <img
            src={mapUrl}
            alt={`Map of ${businessName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full h-40 rounded-sq-md bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">{location}</p>
          </div>
        </div>
      )}

      {/* Location text + Get directions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-600">{location}</span>
        </div>
        <button
          onClick={handleDirections}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          style={{
            background: '#f1f5f9',
            border: '1px solid #e2e8f0'
          }}
        >
          <Navigation className="h-3.5 w-3.5" />
          Directions
        </button>
      </div>
    </div>
  );
}
