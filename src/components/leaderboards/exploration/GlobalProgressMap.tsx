/**
 * GlobalProgressMap - Apple-grade world map using react-simple-maps
 * Uses real TopoJSON data from Natural Earth for accurate continent shapes
 */

import React, { useState, useCallback, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';
import { cn } from '@/lib/utils';

// Use the world-continents TopoJSON from Natural Earth data
const CONTINENTS_TOPOJSON_URL = 
  'https://raw.githubusercontent.com/deldersveld/topojson/master/world-continents.json';

// Map continent names from the TopoJSON to our internal IDs
const CONTINENT_NAME_MAP: Record<string, string> = {
  'Africa': 'africa',
  'Antarctica': 'antarctica',
  'Asia': 'asia',
  'Europe': 'europe',
  'North America': 'north_america',
  'Oceania': 'oceania',
  'South America': 'south_america',
};

// Brand colors matching the design mockup
const COLORS = {
  playedFill: '#8B9D77',      // Muted sage green
  playedFillHover: '#7A8C68', // Darker on hover
  playedStroke: '#FFFFFF',
  notPlayedFill: '#E5E7EB',   // Light grey
  notPlayedStroke: '#D1D5DB',
};

interface GlobalProgressMapProps {
  playedContinents: string[];
  className?: string;
}

function GlobalProgressMapComponent({ playedContinents, className }: GlobalProgressMapProps) {
  const [hoveredContinent, setHoveredContinent] = useState<string | null>(null);

  // Normalize the played continents array
  const normalizedPlayed = new Set(
    playedContinents.map(c => {
      // Handle both "North America" and "north_america" formats
      const normalized = c.toLowerCase().replace(/\s+/g, '_');
      return normalized;
    })
  );

  const isPlayed = useCallback((continentName: string) => {
    const id = CONTINENT_NAME_MAP[continentName];
    return id ? normalizedPlayed.has(id) : false;
  }, [normalizedPlayed]);

  const continentsPlayedCount = normalizedPlayed.size;

  return (
    <div className={cn('w-full', className)}>
      {/* Header with decorative lines */}
      <div className="mb-4 px-2">
        <div className="flex items-center justify-center gap-3">
          {/* Left decorative line */}
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-zinc-300" />
          
          {/* Title block */}
          <div className="text-center flex-shrink-0 px-2">
            <h3 className="text-lg font-semibold text-zinc-800 tracking-tight leading-tight">
              Global Progress
            </h3>
            <p className="text-sm text-zinc-500 mt-0.5 leading-tight">
              <span className="font-semibold text-zinc-700">{continentsPlayedCount}</span>
              <span className="mx-1 text-zinc-400">of</span>
              <span className="font-semibold text-zinc-700">7</span>
              <span className="ml-1 text-zinc-400">Continents Played</span>
            </p>
          </div>
          
          {/* Right decorative line */}
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-zinc-300" />
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-zinc-100/80 overflow-hidden mx-2">
        <div className="p-4 pb-2">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 120,
              center: [0, 20],
            }}
            style={{
              width: '100%',
              height: 'auto',
            }}
          >
            <Geographies geography={CONTINENTS_TOPOJSON_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const continentName = geo.properties.continent || geo.properties.CONTINENT || geo.properties.name;
                  const played = isPlayed(continentName);
                  const isAntarctica = continentName === 'Antarctica';
                  const isHovered = hoveredContinent === continentName && played;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => setHoveredContinent(continentName)}
                      onMouseLeave={() => setHoveredContinent(null)}
                      style={{
                        default: {
                          fill: played && !isAntarctica 
                            ? COLORS.playedFill 
                            : COLORS.notPlayedFill,
                          stroke: played && !isAntarctica 
                            ? COLORS.playedStroke 
                            : COLORS.notPlayedStroke,
                          strokeWidth: played && !isAntarctica ? 1 : 0.5,
                          opacity: played && !isAntarctica ? 1 : isAntarctica ? 0.3 : 0.45,
                          outline: 'none',
                          cursor: played && !isAntarctica ? 'pointer' : 'default',
                          transition: 'all 0.2s ease-out',
                        },
                        hover: {
                          fill: played && !isAntarctica 
                            ? COLORS.playedFillHover 
                            : COLORS.notPlayedFill,
                          stroke: played && !isAntarctica 
                            ? COLORS.playedStroke 
                            : COLORS.notPlayedStroke,
                          strokeWidth: played && !isAntarctica ? 1.5 : 0.5,
                          opacity: played && !isAntarctica ? 1 : isAntarctica ? 0.3 : 0.45,
                          outline: 'none',
                          cursor: played && !isAntarctica ? 'pointer' : 'default',
                        },
                        pressed: {
                          fill: played && !isAntarctica 
                            ? COLORS.playedFillHover 
                            : COLORS.notPlayedFill,
                          outline: 'none',
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pb-4 pt-1">
          <div className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: COLORS.playedFill }}
            />
            <span className="text-sm text-zinc-600 font-medium">Played</span>
          </div>
          <div className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full"
              style={{ 
                backgroundColor: COLORS.notPlayedFill,
                opacity: 0.5,
              }}
            />
            <span className="text-sm text-zinc-500">Not played</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const GlobalProgressMap = memo(GlobalProgressMapComponent);
export default GlobalProgressMap;
