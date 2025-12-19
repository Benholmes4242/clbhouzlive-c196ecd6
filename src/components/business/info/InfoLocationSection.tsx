/**
 * InfoLocationSection - Edge-to-edge dark map with glass overlay panel
 */
import React, { useEffect, useRef, useState } from 'react';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { MapPin, Navigation } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface InfoLocationSectionProps {
  business: BusinessProfile;
}

export function InfoLocationSection({ business }: InfoLocationSectionProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const hasCoords = business.lat !== null && business.lng !== null;
  
  const addressDisplay = business.address_line1 
    || business.location 
    || [business.city, business.country].filter(Boolean).join(', ')
    || 'Location available';

  const handleGetDirections = () => {
    if (hasCoords) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`,
        '_blank'
      );
    } else if (business.location) {
      const query = encodeURIComponent(business.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !hasCoords) return;

    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!token) {
      console.warn('[InfoLocationSection] No Mapbox token');
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [business.lng!, business.lat!],
      zoom: 14,
      interactive: false,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add marker with pulse animation
      const el = document.createElement('div');
      el.className = 'info-map-marker';
      el.innerHTML = `
        <div class="marker-pin">
          <div class="marker-pulse"></div>
        </div>
      `;
      
      marker.current = new mapboxgl.Marker(el)
        .setLngLat([business.lng!, business.lat!])
        .addTo(map.current!);
    });

    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [business.lat, business.lng, hasCoords]);

  if (!hasCoords && !business.location) {
    return null;
  }

  return (
    <section className="-mx-4 relative">
      {/* Map container */}
      {hasCoords ? (
        <div 
          ref={mapContainer} 
          className="w-full h-[180px]"
          style={{ opacity: mapLoaded ? 1 : 0.5, transition: 'opacity 0.3s' }}
        />
      ) : (
        <div 
          className="w-full h-[180px] flex items-center justify-center"
          style={{ background: '#1a1a1a' }}
        >
          <MapPin className="h-8 w-8 text-white/30" />
        </div>
      )}
      
      {/* Glass overlay panel */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-4"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
        }}
      >
        <div 
          className="flex items-center justify-between gap-3 p-3 rounded-sq-md"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <MapPin className="h-4 w-4 text-white/80 flex-shrink-0" />
            <p className="text-sm text-white/90 truncate font-medium">
              {addressDisplay}
            </p>
          </div>
          
          <button
            onClick={handleGetDirections}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap active:scale-95 transition-transform"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
            }}
          >
            <Navigation className="h-3 w-3" />
            Directions
          </button>
        </div>
      </div>
      
      {/* Marker styles */}
      <style>{`
        .info-map-marker {
          width: 24px;
          height: 24px;
        }
        .marker-pin {
          width: 12px;
          height: 12px;
          background: #F7931E;
          border: 2px solid white;
          border-radius: 50%;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(247, 147, 30, 0.3);
          animation: marker-pulse-anim 1.5s ease-out 1;
        }
        @keyframes marker-pulse-anim {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
